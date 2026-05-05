import { Feather } from '@expo/vector-icons';
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
const DIAL_SIZE = 260;
const DIAL_RADIUS = DIAL_SIZE / 2;
const CENTER = DIAL_RADIUS;
const NUMBER_RADIUS = 105;
const DOT_SIZE = 38;
const DOT_RADIUS = DOT_SIZE / 2;
const HOUR_NUMBERS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_NUMBERS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const getCoordinates = (index: number, total: number) => {
  const angle = (index * 360) / total - 90;
  const rad = angle * (Math.PI / 180);
  return {
    x: CENTER + NUMBER_RADIUS * Math.cos(rad) - 15,
    y: CENTER + NUMBER_RADIUS * Math.sin(rad) - 15,
  };
};

const touchToAngle = (dx: number, dy: number): number => {
  const rad = Math.atan2(dy, dx);
  const deg = rad * (180 / Math.PI) + 90;
  return (deg + 360) % 360;
};

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

  const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const displayHourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  const displayMinute = currentMinute < 10 ? `0${currentMinute}` : `${currentMinute}`;

  const dialNumbers = mode === 'hour' ? HOUR_NUMBERS : MINUTE_NUMBERS;

  const hourValue = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const hourSlot = HOUR_NUMBERS.indexOf(hourValue);
  const minuteSlot = Math.round(currentMinute / 5) % 12;

  const handAngle =
    mode === 'hour'
      ? (hourSlot / 12) * 360
      : (currentMinute / 60) * 360;

  const handAngleAnim = useRef(new Animated.Value(handAngle)).current;
  const isDragging = useRef(false);

  const isLabelSelected = (num: number) =>
    mode === 'hour'
      ? num === hourValue
      : num === MINUTE_NUMBERS[minuteSlot];

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
          {/* Atmospheric halo */}
          <View pointerEvents="none" style={styles.halo} />

          {/* Eyebrow header */}
          <View style={styles.headerRow}>
            <Text variant="caption" style={styles.eyebrow} color={theme.colors.onSurfaceInactive}>
              SET TIME
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={16} color={theme.colors.onSurfaceInactive} />
            </TouchableOpacity>
          </View>

          {/* Hero time display */}
          <View style={styles.displayContainer}>
            <View style={styles.timeRow}>
              <TouchableOpacity onPress={() => setMode('hour')} activeOpacity={0.8}>
                <Text
                  style={[
                    styles.timeDigit,
                    { color: mode === 'hour' ? theme.colors.onBackground : theme.colors.onSurfaceInactive },
                  ]}
                >
                  {displayHourStr}
                </Text>
                <View
                  style={[
                    styles.activeUnderline,
                    { opacity: mode === 'hour' ? 1 : 0 },
                  ]}
                />
              </TouchableOpacity>

              <Text style={[styles.colon, { color: theme.colors.border }]}>:</Text>

              <TouchableOpacity onPress={() => setMode('minute')} activeOpacity={0.8}>
                <Text
                  style={[
                    styles.timeDigit,
                    { color: mode === 'minute' ? theme.colors.onBackground : theme.colors.onSurfaceInactive },
                  ]}
                >
                  {displayMinute}
                </Text>
                <View
                  style={[
                    styles.activeUnderline,
                    { opacity: mode === 'minute' ? 1 : 0 },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Segmented AM/PM */}
            <View style={styles.amPmContainer}>
              <TouchableOpacity
                style={[styles.amPmButton, isAm && styles.amPmButtonActive]}
                onPress={() => handleAmPm(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.amPmText, { color: isAm ? theme.colors.background : theme.colors.onSurfaceInactive }]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.amPmButton, !isAm && styles.amPmButtonActive]}
                onPress={() => handleAmPm(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.amPmText, { color: !isAm ? theme.colors.background : theme.colors.onSurfaceInactive }]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode hint */}
          <Text variant="caption" style={styles.modeHint} color={theme.colors.onSurfaceInactive}>
            {mode === 'hour' ? 'Drag to set the hour' : 'Drag to set the minute'}
          </Text>

          {/* Dial */}
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
              <Animated.View
                pointerEvents="none"
                style={[styles.handLayer, { transform: [{ rotate: handRotate }] }]}
              >
                <View style={styles.handLine} />
                <View style={styles.handDot} />
              </Animated.View>

              <View style={styles.dialCenter} />

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
                      style={[
                        styles.dialNumberText,
                        {
                          color: selected ? theme.colors.background : theme.colors.onSurfaceInactive,
                          fontWeight: selected ? '600' : '400',
                        },
                      ]}
                    >
                      {mode === 'minute' && num < 10 ? `0${num}` : num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okButton} onPress={() => onSave(date)} activeOpacity={0.85}>
              <Text style={styles.okText}>Set time</Text>
              <Feather name="arrow-right" size={16} color={theme.colors.background} />
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 28,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    width: 332,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.colors.accentSoft,
    opacity: 0.45,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },

  /* Hero display */
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeDigit: {
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -2,
    lineHeight: 60,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  activeUnderline: {
    height: 2,
    marginTop: 4,
    backgroundColor: theme.colors.accent,
    borderRadius: 1,
  },
  colon: {
    fontSize: 48,
    fontWeight: '200',
    marginHorizontal: 6,
    paddingBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  amPmContainer: {
    flexDirection: 'column',
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  amPmButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    minWidth: 52,
    alignItems: 'center',
  },
  amPmButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  amPmText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
  },

  modeHint: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },

  /* Dial */
  dialContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_RADIUS,
    backgroundColor: theme.colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  handLayer: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
  },
  handLine: {
    position: 'absolute',
    width: 1,
    height: NUMBER_RADIUS,
    left: CENTER - 0.5,
    top: CENTER - NUMBER_RADIUS,
    backgroundColor: theme.colors.accent,
    opacity: 0.7,
  },
  handDot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_RADIUS,
    backgroundColor: theme.colors.accent,
    left: CENTER - DOT_RADIUS,
    top: CENTER - NUMBER_RADIUS - DOT_RADIUS,
  },
  dialCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
    position: 'absolute',
    left: CENTER - 2,
    top: CENTER - 2,
  },
  dialNumber: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dialNumberText: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  cancelText: {
    color: theme.colors.onSurfaceInactive,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  okButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.accent,
  },
  okText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
