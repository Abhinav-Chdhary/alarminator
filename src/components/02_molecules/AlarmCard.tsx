import { format } from 'date-fns';
import React from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';
import { Alarm } from '../../types';
import { Text } from '../01_atoms/Text';

interface Props {
  alarm: Alarm;
  onToggle: (id: string, isEnabled: boolean) => void;
  onDelete: (id: string) => void;
  onTimePress?: (id: string) => void;
  onBodyPress?: (id: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const repeatSummary = (days?: number[]) => {
  if (!days || days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  const isWeekdays = weekdays.every(d => days.includes(d)) && days.length === 5;
  const isWeekend = weekend.every(d => days.includes(d)) && days.length === 2;
  if (isWeekdays) return 'Weekdays';
  if (isWeekend) return 'Weekend';
  return days.map(d => DAY_NAMES[d]).join(' · ');
};

export const AlarmCard: React.FC<Props> = ({ alarm, onToggle, onDelete, onTimePress, onBodyPress }) => {
  const isSnoozing = alarm.snoozedUntil && new Date(alarm.snoozedUntil) > new Date();
  const enabled = alarm.isEnabled;

  const numeralColor = enabled ? theme.colors.onBackground : theme.colors.onSurfaceInactive;
  const accentColor = enabled ? theme.colors.accent : theme.colors.onSurfaceInactive;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onBodyPress && onBodyPress(alarm.id)}
      style={styles.container}
    >
      {/* Left accent bar — amber when enabled, transparent otherwise */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: enabled ? theme.colors.accent : 'transparent' },
        ]}
      />

      <View style={styles.body}>
        {/* Eyebrow row */}
        <View style={styles.topRow}>
          <View style={styles.eyebrowLeft}>
            <View
              style={[
                styles.eyebrowDot,
                { backgroundColor: enabled ? theme.colors.accent : theme.colors.border },
              ]}
            />
            <Text variant="caption" style={[styles.eyebrow, { color: accentColor }]}>
              {(enabled ? repeatSummary(alarm.repeatDays) : 'Off').toUpperCase()}
            </Text>
          </View>
          {isSnoozing && (
            <Text variant="caption" color={theme.colors.onSurfaceInactive} style={styles.snoozeText}>
              Snoozing · {format(new Date(alarm.snoozedUntil!), 'E h:mm a').toLowerCase()}
            </Text>
          )}
        </View>

        {/* Time hero row */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.timeWrapper}
            onPress={() => onTimePress && onTimePress(alarm.id)}
          >
            <Text style={[styles.timeText, { color: numeralColor }]}>
              {format(alarm.time, 'h:mm')}
            </Text>
            <Text style={[styles.amPm, { color: accentColor }]}>
              {format(alarm.time, 'a').toLowerCase()}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchWrap}>
            <Switch
              value={enabled}
              onValueChange={(val) => onToggle(alarm.id, val)}
              trackColor={{ false: theme.colors.switchTrackInactive, true: theme.colors.accentSoft }}
              thumbColor={enabled ? theme.colors.accent : theme.colors.switchThumbInactive}
              ios_backgroundColor={theme.colors.switchTrackInactive}
            />
          </View>
        </View>



      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    overflow: 'hidden',
  },
  accentBar: {
    width: 2,
  },
  body: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  eyebrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: theme.spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
  },
  snoozeText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -2,
    lineHeight: 64,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  amPm: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginLeft: theme.spacing.sm,
    paddingBottom: 12,
  },

  switchWrap: {
    minHeight: 33,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
