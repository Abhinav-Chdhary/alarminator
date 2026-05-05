import { format } from 'date-fns';
import React, { useRef, useState } from 'react';
import { Modal, PanResponder, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';
import { Alarm } from '../../types';
import { Text } from '../01_atoms/Text';

interface Props {
  visible: boolean;
  alarm: Alarm;
  onClose: () => void;
  onSave: (updatedAlarm: Alarm) => void;
  onDelete: (id: string) => void;
  onTimePress: () => void;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AlarmSettingsPopup: React.FC<Props> = ({
  visible,
  alarm,
  onClose,
  onSave,
  onDelete,
  onTimePress,
}) => {
  const [editedAlarm, setEditedAlarm] = useState<Alarm>(alarm);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          onClose();
        }
      },
    })
  ).current;

  const toggleDay = (dayIndex: number) => {
    const currentDays = editedAlarm.repeatDays || [];
    let newDays;
    if (currentDays.includes(dayIndex)) {
      newDays = currentDays.filter(d => d !== dayIndex);
    } else {
      newDays = [...currentDays, dayIndex].sort();
    }
    setEditedAlarm({ ...editedAlarm, repeatDays: newDays });
  };

  const isDaySelected = (dayIndex: number) => {
    return (editedAlarm.repeatDays || []).includes(dayIndex);
  };

  const handleSave = () => {
    onSave(editedAlarm);
  };

  const handleDelete = () => {
    onDelete(alarm.id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Time Header */}
            <View style={styles.headerRow}>
              <View style={styles.timeWrapper}>
                <Text variant="h1" style={styles.timeText}>
                  {format(editedAlarm.time, 'h:mm')}
                </Text>
                <Text variant="body" style={styles.amPm}>
                  {format(editedAlarm.time, 'a').toLowerCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={onTimePress}>
                <Text variant="body" color={theme.colors.onBackground}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Days of Week */}
            <View style={styles.daysRow}>
              {DAYS.map((day, index) => {
                const selected = isDaySelected(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayCircle, selected && styles.dayCircleSelected]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text variant="caption" color={selected ? theme.colors.onPrimary : theme.colors.primary}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Schedule Info */}
            <View style={styles.scheduleInfo}>
              <View>
                <Text variant="caption" color={theme.colors.onSurfaceInactive}>Upcoming alarm</Text>
                <Text variant="body" color={theme.colors.onBackground}>Tomorrow</Text>
              </View>
              <TouchableOpacity style={styles.scheduleButton}>
                <Text variant="body" color={theme.colors.onBackground}>Schedule alarm</Text>
              </TouchableOpacity>
            </View>

            {/* Pause alarm */}
            <View style={styles.settingsGroup}>
              <View style={styles.settingRow}>
                <Text variant="body" color={theme.colors.onBackground}>Pause alarm</Text>
                <Text variant="h2" color={theme.colors.onBackground}>+</Text>
              </View>
            </View>

            {/* More settings */}
            <View style={styles.settingsGroup}>
              {/* Alarm name */}
              <View style={styles.settingRow}>
                <Text variant="body" color={theme.colors.onBackground}>Alarm name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedAlarm.label}
                  onChangeText={(text) => setEditedAlarm({ ...editedAlarm, label: text })}
                  placeholderTextColor={theme.colors.onSurfaceInactive}
                />
              </View>

              {/* Horizontal divider */}
              <View style={styles.divider} />

              {/* Sound */}
              <View style={styles.settingRow}>
                <Text variant="body" color={theme.colors.onBackground}>Sound</Text>
                <Text variant="body" color={theme.colors.onSurfaceInactive}>
                  {editedAlarm.sound || 'repeater'}
                </Text>
              </View>

              {/* Horizontal divider */}
              <View style={styles.divider} />

              {/* Vibrate */}
              <View style={styles.settingRow}>
                <Text variant="body" color={theme.colors.onBackground}>Vibrate</Text>
                <Switch
                  value={editedAlarm.vibrate ?? true}
                  onValueChange={(val) => setEditedAlarm({ ...editedAlarm, vibrate: val })}
                  trackColor={{ false: theme.colors.switchTrackInactive, true: theme.colors.switchTrackActive }}
                  thumbColor={editedAlarm.vibrate !== false ? theme.colors.switchThumbActive : theme.colors.switchThumbInactive}
                />
              </View>
            </View>

            {/* TODO: figure out what this setting should do */}
            {/* <View style={styles.settingsGroup}>
              <View style={styles.settingRow}>
                <Text variant="body" color={theme.colors.onBackground}>Routines</Text>
                <Text variant="h2" color={theme.colors.onBackground}>+</Text>
              </View>
            </View> */}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={handleDelete}>
              <Text variant="body" color="#FF6B6B">Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, styles.saveButton]} onPress={handleSave}>
              <Text variant="body" color={theme.colors.background}>Save</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background, // Dark modal background
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.secondaryVariant,
    borderRadius: 2,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeText: {
    fontSize: 48,
    marginRight: 4,
  },
  amPm: {
    fontSize: 18,
  },
  editButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.primary,
  },
  scheduleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsGroup: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  },
  divider: {
    height: 3,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    color: theme.colors.onBackground,
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  footerButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
});
