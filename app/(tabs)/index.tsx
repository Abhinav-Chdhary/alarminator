import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarms } from '../../src/store/AlarmContext';
import { AlarmCard } from '../../src/components/02_molecules/AlarmCard';
import { TimePickerPopup } from '../../src/components/02_molecules/TimePickerPopup';
import { Text } from '../../src/components/01_atoms/Text';
import { theme } from '../../src/theme';

import { AlarmSettingsPopup } from '../../src/components/02_molecules/AlarmSettingsPopup';
import { Alarm } from '../../src/types';

export default function HomeScreen() {
  const { alarms, addAlarm, toggleAlarm, deleteAlarm, updateAlarm } = useAlarms();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleAddPress = () => {
    setIsCreatingNew(true);
    setEditingAlarmId(null);
    setPickerVisible(true);
  };

  const handleTimePress = (id: string) => {
    setIsCreatingNew(false);
    setEditingAlarmId(id);
    setPickerVisible(true);
  };

  const handleBodyPress = (id: string) => {
    setIsCreatingNew(false);
    setEditingAlarmId(id);
    setSettingsVisible(true);
  };

  const handleTimeSave = (newTime: Date) => {
    if (isCreatingNew) {
      addAlarm(newTime, 'Morning Wakeup', 'Type word "gravity"');
    } else if (editingAlarmId) {
      const alarmToUpdate = alarms.find(a => a.id === editingAlarmId);
      if (alarmToUpdate) {
        updateAlarm({ ...alarmToUpdate, time: newTime });
      }
    }
    setPickerVisible(false);
    setIsCreatingNew(false);
  };

  const handleSettingsSave = (updatedAlarm: Alarm) => {
    updateAlarm(updatedAlarm);
    setSettingsVisible(false);
  };

  const handleSettingsDelete = (id: string) => {
    deleteAlarm(id);
    setSettingsVisible(false);
  };

  const handleSettingsTimePress = () => {
    setSettingsVisible(false);
    setPickerVisible(true);
  };

  const handlePickerClose = () => {
    setPickerVisible(false);
    setIsCreatingNew(false);
  };

  const activeAlarm = editingAlarmId ? alarms.find(a => a.id === editingAlarmId) : null;
  const initialPickerTime = activeAlarm ? new Date(activeAlarm.time) : new Date();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>Alarms</Text>
        <Text variant="h2" color={theme.colors.disabled} style={styles.dots}>⋮</Text>
      </View>
      <View style={styles.content}>
        
        <FlatList 
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlarmCard 
              alarm={item} 
              onToggle={toggleAlarm} 
              onDelete={deleteAlarm} 
              onTimePress={handleTimePress}
              onBodyPress={handleBodyPress}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText} align="center" color={theme.colors.disabled}>
              No alarms yet. Add one below!
            </Text>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={handleAddPress}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {pickerVisible && (
          <TimePickerPopup
            visible={pickerVisible}
            initialTime={initialPickerTime}
            onClose={handlePickerClose}
            onSave={handleTimeSave}
          />
        )}

        {settingsVisible && activeAlarm && (
          <AlarmSettingsPopup
            visible={settingsVisible}
            alarm={activeAlarm}
            onClose={() => setSettingsVisible(false)}
            onSave={handleSettingsSave}
            onDelete={handleSettingsDelete}
            onTimePress={handleSettingsTimePress}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
  },
  dots: {
    fontSize: 28,
    marginTop: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    marginTop: theme.spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: theme.colors.onBackground,
    fontWeight: '300',
    marginTop: -4,
  }
});
