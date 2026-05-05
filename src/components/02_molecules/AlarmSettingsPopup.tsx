import { Feather } from '@expo/vector-icons';
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
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort();
    setEditedAlarm({ ...editedAlarm, repeatDays: newDays });
  };

  const isDaySelected = (dayIndex: number) => {
    return (editedAlarm.repeatDays || []).includes(dayIndex);
  };

  const repeatSummary = () => {
    const days = editedAlarm.repeatDays || [];
    if (days.length === 0) return 'Once';
    if (days.length === 7) return 'Every day';
    const weekdays = [1, 2, 3, 4, 5];
    const weekend = [0, 6];
    const isWeekdays = weekdays.every(d => days.includes(d)) && days.length === 5;
    const isWeekend = weekend.every(d => days.includes(d)) && days.length === 2;
    if (isWeekdays) return 'Weekdays';
    if (isWeekend) return 'Weekend';
    return days.map(d => DAY_NAMES[d]).join(', ');
  };

  const handleSave = () => onSave(editedAlarm);
  const handleDelete = () => onDelete(alarm.id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Drag handle */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          {/* Eyebrow row */}
          <View style={styles.eyebrowRow}>
            <Text variant="caption" style={styles.eyebrow} color={theme.colors.onSurfaceInactive}>
              EDIT ALARM
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={18} color={theme.colors.onSurfaceInactive} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Time hero with halo */}
            <View style={styles.heroWrap}>
              <View pointerEvents="none" style={styles.heroHalo} />
              <TouchableOpacity activeOpacity={0.7} onPress={onTimePress} style={styles.heroTouch}>
                <View style={styles.timeWrapper}>
                  <Text style={styles.timeText}>{format(editedAlarm.time, 'h:mm')}</Text>
                  <View style={styles.amPmWrap}>
                    <Text style={styles.amPm}>{format(editedAlarm.time, 'a').toLowerCase()}</Text>
                    <Text style={styles.repeatHint}>{repeatSummary()}</Text>
                  </View>
                </View>
                <View style={styles.editChip}>
                  <Feather name="edit-2" size={11} color={theme.colors.onBackground} />
                  <Text variant="caption" style={styles.editChipText}>Change</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Repeat */}
            <SectionLabel>REPEAT</SectionLabel>
            <View style={styles.daysRow}>
              {DAYS.map((day, index) => {
                const selected = isDaySelected(index);
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={[styles.dayCircle, selected && styles.dayCircleSelected]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Schedule info */}
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleLeft}>
                <View style={styles.accentDot} />
                <View>
                  <Text variant="caption" color={theme.colors.onSurfaceInactive} style={styles.scheduleEyebrow}>
                    UPCOMING
                  </Text>
                  <Text style={styles.scheduleValue}>Tomorrow</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.scheduleAction} hitSlop={8}>
                <Text variant="caption" style={styles.scheduleActionText}>Schedule</Text>
                <Feather name="chevron-right" size={14} color={theme.colors.onBackground} />
              </TouchableOpacity>
            </View>

            {/* Pause */}
            <SectionLabel>PAUSE ALARM</SectionLabel>
            <TouchableOpacity activeOpacity={0.85} style={styles.row}>
              <View>
                <Text style={styles.rowLabel}>Add a break</Text>
                <Text variant="caption" color={theme.colors.onSurfaceInactive} style={styles.rowSub}>
                  Skip the next ring without disabling
                </Text>
              </View>
              <Feather name="plus" size={18} color={theme.colors.onBackground} />
            </TouchableOpacity>

            {/* Details */}
            <SectionLabel>ALARM DETAILS</SectionLabel>
            <View style={styles.settingsGroup}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedAlarm.label}
                  placeholder="Untitled"
                  onChangeText={(text) => setEditedAlarm({ ...editedAlarm, label: text })}
                  placeholderTextColor={theme.colors.onSurfaceInactive}
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity activeOpacity={0.85} style={styles.row}>
                <Text style={styles.rowLabel}>Sound</Text>
                <View style={styles.rowRight}>
                  <Text variant="body" color={theme.colors.onSurfaceInactive}>
                    {editedAlarm.sound || 'repeater'}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={theme.colors.onSurfaceInactive}
                    style={styles.chevron}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Vibrate</Text>
                <Switch
                  value={editedAlarm.vibrate ?? true}
                  onValueChange={(val) => setEditedAlarm({ ...editedAlarm, vibrate: val })}
                  trackColor={{ false: theme.colors.switchTrackInactive, true: theme.colors.switchTrackActive }}
                  thumbColor={editedAlarm.vibrate !== false ? theme.colors.switchThumbActive : theme.colors.switchThumbInactive}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
              <Feather name="trash-2" size={14} color="#FF6B6B" />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveText}>Save changes</Text>
              <Feather name="arrow-right" size={16} color={theme.colors.background} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.sectionLabelRow}>
    <Text variant="caption" style={styles.sectionLabel} color={theme.colors.onSurfaceInactive}>
      {children}
    </Text>
    <View style={styles.sectionHairline} />
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    maxHeight: '92%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  dragHandleContainer: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  eyebrowRow: {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  /* Hero */
  heroWrap: {
    position: 'relative',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  heroHalo: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.colors.accentSoft,
    opacity: 0.55,
  },
  heroTouch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeText: {
    color: theme.colors.onBackground,
    fontSize: 76,
    fontWeight: '200',
    letterSpacing: -3,
    lineHeight: 80,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  amPmWrap: {
    marginLeft: theme.spacing.sm,
    paddingBottom: 12,
  },
  amPm: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  repeatHint: {
    color: theme.colors.onSurfaceInactive,
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  editChipText: {
    fontSize: 12,
    color: theme.colors.onBackground,
    letterSpacing: 0.5,
  },

  /* Section labels */
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2,
    marginRight: theme.spacing.md,
  },
  sectionHairline: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },

  /* Day pills */
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  dayText: {
    color: theme.colors.onSurfaceInactive,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dayTextSelected: {
    color: theme.colors.background,
    fontWeight: '600',
  },

  /* Schedule card */
  scheduleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginRight: theme.spacing.md,
  },
  scheduleEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  scheduleValue: {
    color: theme.colors.onBackground,
    fontSize: 15,
    fontWeight: '400',
  },
  scheduleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleActionText: {
    fontSize: 12,
    color: theme.colors.onBackground,
    letterSpacing: 0.5,
  },

  /* Setting rows */
  settingsGroup: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: 56,
    backgroundColor: theme.colors.surfaceElevated,
  },
  rowLabel: {
    color: theme.colors.onBackground,
    fontSize: 15,
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  textInput: {
    color: theme.colors.onBackground,
    fontSize: 15,
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing.md,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  deleteText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.accent,
  },
  saveText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
