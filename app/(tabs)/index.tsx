import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarms } from '../../src/store/AlarmContext';
import { AlarmCard } from '../../src/components/02_molecules/AlarmCard';
import { TimePickerPopup } from '../../src/components/02_molecules/TimePickerPopup';
import { Text } from '../../src/components/01_atoms/Text';
import { theme } from '../../src/theme';
import { addMinutes } from 'date-fns';

export default function HomeScreen() {
  const { alarms, addAlarm, toggleAlarm, deleteAlarm, updateAlarm } = useAlarms();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  const handleAddDemoAlarm = () => {
    // Add an alarm for 1 minute from now for testing
    addAlarm(addMinutes(new Date(), 1), 'Morning Wakeup', 'Type word "gravity"');
  };

  const handleTimePress = (id: string) => {
    setEditingAlarmId(id);
    setPickerVisible(true);
  };

  const handleTimeSave = (newTime: Date) => {
    if (editingAlarmId) {
      const alarmToUpdate = alarms.find(a => a.id === editingAlarmId);
      if (alarmToUpdate) {
        updateAlarm({ ...alarmToUpdate, time: newTime });
      }
    }
    setPickerVisible(false);
  };

  const activeAlarm = alarms.find(a => a.id === editingAlarmId);

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
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText} align="center" color={theme.colors.disabled}>
              No alarms yet. Add one below!
            </Text>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={handleAddDemoAlarm}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {pickerVisible && activeAlarm && (
          <TimePickerPopup
            visible={pickerVisible}
            initialTime={new Date(activeAlarm.time)}
            onClose={() => setPickerVisible(false)}
            onSave={handleTimeSave}
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
