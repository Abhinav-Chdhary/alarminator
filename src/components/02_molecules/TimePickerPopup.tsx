import { setHours, setMinutes } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';
import { Text } from '../01_atoms/Text';

interface Props {
  visible: boolean;
  initialTime: Date;
  onClose: () => void;
  onSave: (newTime: Date) => void;
}

// ─── geometry constants ───────────────────────────────────────────────────────
const DIAL_SIZE = 260;          // total dial diameter
const DIAL_RADIUS = DIAL_SIZE / 2; // 130 – used as borderRadius
const CENTER = DIAL_RADIUS;        // 130 – centre of the View in local coords
const NUMBER_RADIUS = 105;         // how far from centre the number circles sit
const DOT_SIZE = 40;               // selection circle diameter (matches reference)
const DOT_RADIUS = DOT_SIZE / 2;   // 20
const HOUR_NUMBERS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_NUMBERS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Index (0-based, 12 steps) → {x, y} so the 30×30 label box is centred on
 *  the ring.  label boxes are 30×30, so offset by –15. */
const getCoordinates = (index: number, total: number) => {
  const angle = (index * 360) / total - 90; // 0° = 12-o'clock
  const rad = angle * (Math.PI / 180);
  return {
    x: CENTER + NUMBER_RADIUS * Math.cos(rad) - 15,
    y: CENTER + NUMBER_RADIUS * Math.sin(rad) - 15,
  };
};

/** Screen touch → 0–359° angle measured from 12-o'clock clockwise */
const touchToAngle = (dx: number, dy: number): number => {
  const rad = Math.atan2(dy, dx);
  const deg = rad * (180 / Math.PI) + 90;
  return (deg + 360) % 360;
};

/** Snap an arbitrary angle to the nearest slot (0 … steps-1) */
const snapToSlot = (angle: number, steps: number): number =>
  Math.round((angle / 360) * steps) % steps;

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const closestEquivalentAngle = (targetAngle: number, currentAngle: number): number => {
  const target = normalizeAngle(targetAngle);
  const candidates = [target - 360, target, target + 360];
  return candidates.reduce((closest, candidate) =>
    Math.abs(candidate - currentAngle) < Math.abs(closest - currentAngle) ? candidate : closest
  );
};

// ─── component ────────────────────────────────────────────────────────────────

export const TimePickerPopup: React.FC<Props> = ({
  visible,
  initialTime,
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [date, setDate] = useState(initialTime);

  useEffect(() => {
    if (visible) {
      setDate(initialTime);
      setMode('hour');
    }
  }, [visible, initialTime]);

  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const isAm = currentHour < 12;

  // ── display strings ──────────────────────────────────────────────────────
  const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const displayHourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  const displayMinute = currentMinute < 10 ? `0${currentMinute}` : `${currentMinute}`;

  // ── dial data ────────────────────────────────────────────────────────────
  const dialNumbers = mode === 'hour' ? HOUR_NUMBERS : MINUTE_NUMBERS;

  // For hours: which slot is selected (0–11)
  const hourValue = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const hourSlot = HOUR_NUMBERS.indexOf(hourValue);           // 0–11
  // For minutes: continuous 0–59, mapped onto 0–11 slots for the line angle
  const minuteSlot = Math.round(currentMinute / 5) % 12;   // nearest label

  // The hand angle in degrees from 12-o'clock (0 = 12-o'clock, clockwise)
  const handAngle =
    mode === 'hour'
      ? (hourSlot / 12) * 360
      : (currentMinute / 60) * 360; // smooth for minutes

  const handAngleAnim = useRef(new Animated.Value(handAngle)).current;
  const isDragging = useRef(false);

  // Whether a number label is "selected" (gets the highlight dot)
  const isLabelSelected = (num: number) =>
    mode === 'hour'
      ? num === hourValue
      : num === MINUTE_NUMBERS[minuteSlot];

  // ── drag / PanResponder ──────────────────────────────────────────────────
  const dialRef = useRef<View>(null);
  const dialLayout = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isDragging.current) return;
    handAngleAnim.stopAnimation((currentValue) => {
      const target = closestEquivalentAngle(handAngle, Number(currentValue));
      handAngleAnim.setValue(target);
    });
  }, [handAngle, handAngleAnim]);

  const applyAngleToDate = useCallback((angle: number) => {
    if (mode === 'hour') {
      const slot = snapToSlot(angle, 12);
      const num = HOUR_NUMBERS[slot];
      let newHour = num === 12 ? 0 : num;
      if (!isAm) newHour += 12;
      setDate((prev) => setHours(prev, newHour));
      return;
    }

    // Map to nearest minute (0–59)
    const minute = Math.round((angle / 360) * 60) % 60;
    setDate((prev) => setMinutes(prev, minute));
  }, [mode, isAm]);

  const applyTouch = useCallback((pageX: number, pageY: number) => {
    const dx = pageX - dialLayout.current.x - CENTER;
    const dy = pageY - dialLayout.current.y - CENTER;
    const angle = touchToAngle(dx, dy);
    handAngleAnim.setValue(angle);
    applyAngleToDate(angle);
    return angle;
  }, [applyAngleToDate, handAngleAnim]);

  const panResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        isDragging.current = true;
        handAngleAnim.stopAnimation();
        applyTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);
      },
      onPanResponderMove: (e) => applyTouch(e.nativeEvent.pageX, e.nativeEvent.pageY),
      onPanResponderRelease: (e) => {
        const angle = applyTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);

        if (mode !== 'hour') {
          isDragging.current = false;
          return;
        }

        const slot = snapToSlot(angle, 12);
        const snappedAngle = (slot / 12) * 360;

        handAngleAnim.stopAnimation((currentValue) => {
          const animatedTarget = closestEquivalentAngle(snappedAngle, Number(currentValue));
          Animated.spring(handAngleAnim, {
            toValue: animatedTarget,
            damping: 18,
            stiffness: 230,
            mass: 0.8,
            useNativeDriver: true,
          }).start(() => {
            handAngleAnim.setValue(normalizeAngle(snappedAngle));
            isDragging.current = false;
            setMode('minute');
          });
        });
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      },
    }), [applyTouch, handAngleAnim, mode]);

  const handRotate = useMemo(() =>
    handAngleAnim.interpolate({
      inputRange: [-360, 720],
      outputRange: ['-360deg', '720deg'],
    }), [handAngleAnim]);

  // ── tap a label ──────────────────────────────────────────────────────────
  const handleDialPress = (val: number) => {
    if (mode === 'hour') {
      let newHour = val === 12 ? 0 : val;
      if (!isAm) newHour += 12;
      setDate((prev) => setHours(prev, newHour));
      setMode('minute');
    } else {
      setDate((prev) => setMinutes(prev, val));
    }
  };

  const handleAmPm = (am: boolean) => {
    let newHour = currentHour;
    if (am && !isAm) newHour -= 12;
    if (!am && isAm) newHour += 12;
    setDate((prev) => setHours(prev, newHour));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header label */}
          <Text variant="caption" color={theme.colors.disabled} style={styles.headerText}>
            Select time
          </Text>

          {/* ── HH : MM  AM/PM ── */}
          <View style={styles.displayContainer}>
            <TouchableOpacity
              style={[styles.timeBlock, mode === 'hour' && styles.timeBlockActive]}
              onPress={() => setMode('hour')}
            >
              <Text variant="h2" color={mode === 'hour' ? theme.colors.primary : theme.colors.disabled}>
                {displayHourStr}
              </Text>
            </TouchableOpacity>

            <Text variant="h2" color={theme.colors.disabled} style={styles.colon}>:</Text>

            <TouchableOpacity
              style={[styles.timeBlock, mode === 'minute' && styles.timeBlockActive]}
              onPress={() => setMode('minute')}
            >
              <Text variant="h2" color={mode === 'minute' ? theme.colors.primary : theme.colors.disabled}>
                {displayMinute}
              </Text>
            </TouchableOpacity>

            <View style={styles.amPmContainer}>
              <TouchableOpacity
                style={[
                  styles.amPmButton,
                  isAm && styles.amPmButtonActive,
                  { borderBottomWidth: 1, borderBottomColor: theme.colors.secondaryVariant },
                ]}
                onPress={() => handleAmPm(true)}
              >
                <Text variant="body" color={isAm ? theme.colors.primary : theme.colors.disabled}>a.m.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.amPmButton, !isAm && styles.amPmButtonActive]}
                onPress={() => handleAmPm(false)}
              >
                <Text variant="body" color={!isAm ? theme.colors.primary : theme.colors.disabled}>p.m.</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Dial ── */}
          <View style={styles.dialContainer}>
            <View
              ref={dialRef}
              style={styles.dial}
              onLayout={() => {
                dialRef.current?.measureInWindow((x, y) => {
                  dialLayout.current = { x, y };
                });
              }}
              {...panResponder.panHandlers}
            >
              {/* Hand layer rotates as one unit for smoother drag/animations */}
              <Animated.View
                pointerEvents="none"
                style={[styles.handLayer, { transform: [{ rotate: handRotate }] }]}
              >
                <View style={styles.handLine} />
                <View style={styles.handDot} />
              </Animated.View>

              {/* Centre pivot dot (drawn on top) */}
              <View style={styles.dialCenter} />

              {/* Number labels — rendered on top of the hand */}
              {dialNumbers.map((num, i) => {
                const pos = getCoordinates(i, 12);
                const selected = isLabelSelected(num);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dialNumber, { left: pos.x, top: pos.y }]}
                    onPress={() => handleDialPress(num)}
                  >
                    <Text
                      variant="body"
                      color={selected ? theme.colors.onPrimary : theme.colors.onSurfaceInactive}
                    >
                      {mode === 'minute' && num < 10 ? `0${num}` : num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={onClose}>
              <Text variant="body" color={theme.colors.primary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerButton} onPress={() => onSave(date)}>
              <Text variant="body" color={theme.colors.primary}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: 320,
  },
  headerText: {
    marginBottom: theme.spacing.md,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  timeBlock: {
    backgroundColor: theme.colors.secondaryVariant,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  timeBlockActive: {
    backgroundColor: theme.colors.surfaceActive,
  },
  colon: {
    marginHorizontal: theme.spacing.xs,
  },
  amPmContainer: {
    marginLeft: theme.spacing.md,
    borderColor: theme.colors.secondaryVariant,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  amPmButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'transparent',
  },
  amPmButtonActive: {
    backgroundColor: theme.colors.secondaryVariant,
  },
  dialContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  dial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_RADIUS,
    backgroundColor: theme.colors.secondaryVariant,
    position: 'relative',
  },
  handLayer: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
  },
  handLine: {
    position: 'absolute',
    width: 2,
    height: NUMBER_RADIUS,
    left: CENTER - 1,
    top: CENTER - NUMBER_RADIUS,
    backgroundColor: theme.colors.primary,
  },
  handDot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_RADIUS,
    backgroundColor: theme.colors.primary,
    left: CENTER - DOT_RADIUS,
    top: CENTER - NUMBER_RADIUS - DOT_RADIUS,
  },
  // Small pivot dot, drawn last so it sits on top of everything
  dialCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    left: CENTER - 4,
    top: CENTER - 4,
  },
  dialNumber: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // Rendered after handWrapper so they appear above the dot
    zIndex: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
  },
  footerButton: {
    marginLeft: theme.spacing.lg,
    padding: theme.spacing.sm,
  },
});
