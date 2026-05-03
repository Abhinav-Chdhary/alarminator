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
}

export const AlarmCard: React.FC<Props> = ({ alarm, onToggle, onDelete }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h2">{format(alarm.time, 'h:mm a')}</Text>
        <Switch 
          value={alarm.isEnabled} 
          onValueChange={(val) => onToggle(alarm.id, val)} 
          trackColor={{ false: theme.colors.disabled, true: theme.colors.primaryVariant }}
          thumbColor={alarm.isEnabled ? theme.colors.primary : '#f4f3f4'}
        />
      </View>
      <View style={styles.body}>
        <Text variant="body" color={theme.colors.disabled}>{alarm.label}</Text>
        <Text variant="caption" color={theme.colors.secondary}>Task: {alarm.task}</Text>
      </View>
      <View style={styles.footer}>
        <Button 
          title="Delete" 
          variant="outline" 
          onPress={() => onDelete(alarm.id)} 
          style={styles.deleteBtn}
          textStyle={styles.deleteBtnText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  body: {
    marginBottom: theme.spacing.md,
  },
  footer: {
    alignItems: 'flex-end',
  },
  deleteBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderColor: theme.colors.error,
  },
  deleteBtnText: {
    color: theme.colors.error,
    fontSize: theme.typography.caption.fontSize,
  }
});
