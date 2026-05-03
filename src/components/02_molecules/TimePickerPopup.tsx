import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from '../01_atoms/Text';
import { theme } from '../../theme';
import { format, setHours, setMinutes } from 'date-fns';

interface Props {
  visible: boolean;
  initialTime: Date;
  onClose: () => void;
  onSave: (newTime: Date) => void;
}

const DIAL_RADIUS = 120;
const CENTER = DIAL_RADIUS;
const NUMBER_RADIUS = 95;

export const TimePickerPopup: React.FC<Props> = ({ visible, initialTime, onClose, onSave }) => {
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

  const handleAmPm = (am: boolean) => {
    let newHour = currentHour;
    if (am && !isAm) newHour -= 12;
    if (!am && isAm) newHour += 12;
    setDate(setHours(date, newHour));
  };

  const handleDialPress = (val: number) => {
    if (mode === 'hour') {
      let newHour = val;
      if (newHour === 12) newHour = 0;
      if (!isAm) newHour += 12;
      setDate(setHours(date, newHour));
      setMode('minute');
    } else {
      setDate(setMinutes(date, val));
    }
  };

  const dialNumbers = mode === 'hour' 
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const getCoordinates = (index: number, total: number) => {
    const angle = ((index * 360) / total - 90) * (Math.PI / 180);
    return {
      x: CENTER + NUMBER_RADIUS * Math.cos(angle) - 15,
      y: CENTER + NUMBER_RADIUS * Math.sin(angle) - 15,
    };
  };

  const selectedValue = mode === 'hour' ? (currentHour % 12 === 0 ? 12 : currentHour % 12) : currentMinute;
  const selectedIndex = dialNumbers.indexOf(selectedValue);
  
  const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const displayMinute = currentMinute < 10 ? `0${currentMinute}` : `${currentMinute}`;
  const displayHourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text variant="caption" color={theme.colors.disabled} style={styles.headerText}>
            Select time
          </Text>

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
                style={[styles.amPmButton, isAm && styles.amPmButtonActive, { borderBottomWidth: 1, borderBottomColor: theme.colors.secondaryVariant }]}
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

          <View style={styles.dialContainer}>
            <View style={styles.dial}>
              {selectedIndex !== -1 && (
                <>
                  <View style={styles.dialCenter} />
                  <View 
                    style={[
                      styles.dialHand, 
                      { transform: [{ rotate: `${selectedIndex * 30}deg` }] }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.dialSelection,
                      { left: getCoordinates(selectedIndex, 12).x - 5, top: getCoordinates(selectedIndex, 12).y - 5 }
                    ]}
                  />
                </>
              )}
              {dialNumbers.map((num, i) => {
                const pos = getCoordinates(i, 12);
                const isSelected = selectedValue === num;
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.dialNumber, { left: pos.x, top: pos.y }]}
                    onPress={() => handleDialPress(num)}
                  >
                    <Text variant="body" color={isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceInactive}>
                      {mode === 'minute' && num < 10 ? `0${num}` : num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

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
    width: DIAL_RADIUS * 2,
    height: DIAL_RADIUS * 2,
    borderRadius: DIAL_RADIUS,
    backgroundColor: theme.colors.secondaryVariant,
    position: 'relative',
  },
  dialCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    left: CENTER - 4,
    top: CENTER - 4,
  },
  dialHand: {
    width: 2,
    height: NUMBER_RADIUS,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    left: CENTER - 1,
    bottom: CENTER,
    transformOrigin: 'bottom',
  },
  dialSelection: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
  },
  dialNumber: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
  },
  footerButton: {
    marginLeft: theme.spacing.lg,
    padding: theme.spacing.sm,
  }
});
