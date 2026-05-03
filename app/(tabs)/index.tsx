import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarms } from '../../src/store/AlarmContext';
import { AlarmCard } from '../../src/components/02_molecules/AlarmCard';
import { Button } from '../../src/components/01_atoms/Button';
import { Text } from '../../src/components/01_atoms/Text';
import { theme } from '../../src/theme';
import { addMinutes } from 'date-fns';

export default function HomeScreen() {
  const { alarms, addAlarm, toggleAlarm, deleteAlarm } = useAlarms();

  const handleAddDemoAlarm = () => {
    // Add an alarm for 1 minute from now for testing
    addAlarm(addMinutes(new Date(), 1), 'Morning Wakeup', 'Type word "gravity"');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="h1" style={styles.title}>Alarminator</Text>
        
        <FlatList 
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlarmCard 
              alarm={item} 
              onToggle={toggleAlarm} 
              onDelete={deleteAlarm} 
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText} align="center" color={theme.colors.disabled}>
              No alarms yet. Add one below!
            </Text>
          }
        />

        <Button 
          title="+ Add Demo Alarm (1 min)" 
          onPress={handleAddDemoAlarm} 
          style={styles.addButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.xl,
  },
  addButton: {
    marginTop: theme.spacing.lg,
  }
});
