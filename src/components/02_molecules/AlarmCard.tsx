import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { Text } from '../01_atoms/Text';
import { theme } from '../../theme';
import { Alarm } from '../../types';
import { format } from 'date-fns';
import { Button } from '../01_atoms/Button';

interface Props {
  alarm: Alarm;
  onToggle: (id: string, isEnabled: boolean) => void;
  onDelete: (id: string) => void;
  onTimePress?: (id: string) => void;
}

export const AlarmCard: React.FC<Props> = ({ alarm, onToggle, onDelete, onTimePress }) => {
  const isSnoozing = alarm.snoozedUntil && new Date(alarm.snoozedUntil) > new Date();

  return (
    <View style={[
      styles.container,
      { backgroundColor: alarm.isEnabled ? theme.colors.surfaceActive : theme.colors.surface }
    ]}>
      <View style={styles.topRow}>
        <Text variant="caption" color={alarm.isEnabled ? theme.colors.primary : theme.colors.onSurfaceInactive}>
          {!alarm.isEnabled ? 'Not scheduled' : (alarm.repeatDays && alarm.repeatDays.length > 0 ? 'Every day' : 'Today')}
        </Text>
        {isSnoozing && (
          <Text variant="caption" color={theme.colors.onBackground}>
            Snoozing until {format(new Date(alarm.snoozedUntil!), 'E h:mm a')}
          </Text>
        )}
      </View>
      <View style={styles.header}>
        <View 
          style={styles.timeWrapper} 
          onTouchEnd={() => onTimePress && onTimePress(alarm.id)}
        >
          <Text 
            variant="h2" 
            color={alarm.isEnabled ? theme.colors.onBackground : theme.colors.onSurfaceInactive}
            style={styles.timeText}
          >
            {format(alarm.time, 'h:mm')}
          </Text>
          <Text 
            variant="body" 
            color={alarm.isEnabled ? theme.colors.onBackground : theme.colors.onSurfaceInactive} 
            style={styles.amPm}
          >
            {format(alarm.time, 'a').toLowerCase()}
          </Text>
        </View>
        <Switch 
          value={alarm.isEnabled} 
          onValueChange={(val) => onToggle(alarm.id, val)} 
          trackColor={{ false: theme.colors.switchTrackInactive, true: theme.colors.switchTrackActive }}
          thumbColor={alarm.isEnabled ? theme.colors.switchThumbActive : theme.colors.switchThumbInactive}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeText: {
    marginRight: 4,
    includeFontPadding: false,
    lineHeight: 64,
  },
  amPm: {
    paddingBottom: 8,
  },
});
