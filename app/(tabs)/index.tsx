import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../src/components/01_atoms/Text';
import { AlarmCard } from '../../src/components/02_molecules/AlarmCard';
import { AlarmSettingsPopup } from '../../src/components/02_molecules/AlarmSettingsPopup';
import { TimePickerPopup } from '../../src/components/02_molecules/TimePickerPopup';
import { useAlarms } from '../../src/store/AlarmContext';
import { theme } from '../../src/theme';
import { Alarm } from '../../src/types';

const greetingFor = (d: Date) => {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  if (h >= 18 && h < 22) return 'Good evening';
  return 'Sleep well';
};

const nextOccurrence = (alarm: Alarm, now: Date): Date => {
  const t = new Date(alarm.time);
  const next = new Date(now);
  next.setHours(t.getHours(), t.getMinutes(), 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
};

const findNextAlarm = (alarms: Alarm[], now: Date): { alarm: Alarm; at: Date } | null => {
  let best: { alarm: Alarm; at: Date } | null = null;
  for (const a of alarms) {
    if (!a.isEnabled) continue;
    const at = nextOccurrence(a, now);
    if (!best || at < best.at) best = { alarm: a, at };
  }
  return best;
};

const formatCountdown = (target: Date, now: Date): string => {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `in ${m}m`;
  return `in ${h}h ${m.toString().padStart(2, '0')}m`;
};

export default function HomeScreen() {
  const { alarms, addAlarm, toggleAlarm, deleteAlarm, updateAlarm } = useAlarms();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

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
      addAlarm(newTime, 'Type word "gravity"');
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

  const next = findNextAlarm(alarms, now);
  const enabledCount = alarms.filter(a => a.isEnabled).length;
  const eyebrow = `${format(now, 'EEEE · d MMM').toUpperCase()}  ·  ${enabledCount.toString().padStart(2, '0')} ACTIVE`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Atmospheric halo — first-light ambience in upper-right */}
      <View pointerEvents="none" style={styles.haloOuter} />
      <View pointerEvents="none" style={styles.haloInner} />

      <View style={styles.header}>
        <Text variant="caption" style={styles.eyebrow} color={theme.colors.onSurfaceInactive}>
          {eyebrow}
        </Text>
        <Text style={styles.greeting}>
          {greetingFor(now)}<Text style={styles.greetingPunct}>.</Text>
        </Text>

        {next ? (
          <View style={styles.nextRow}>
            <View style={styles.accentDot} />
            <Text variant="caption" color={theme.colors.onSurfaceInactive} style={styles.nextLabel}>
              Next alarm
            </Text>
            <Text style={styles.nextTime}>
              {format(next.at, 'h:mm').toLowerCase()}
              <Text style={styles.nextAmPm}>{format(next.at, ' a').toLowerCase()}</Text>
            </Text>
            <Text variant="caption" color={theme.colors.accent} style={styles.nextDelta}>
              {formatCountdown(next.at, now)}
            </Text>
          </View>
        ) : (
          <View style={styles.nextRow}>
            <View style={[styles.accentDot, { backgroundColor: theme.colors.border }]} />
            <Text variant="caption" color={theme.colors.onSurfaceInactive} style={styles.nextLabel}>
              No alarms scheduled
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sectionLabelRow}>
        <Text variant="caption" style={styles.sectionLabel} color={theme.colors.onSurfaceInactive}>
          ALL ALARMS
        </Text>
        <View style={styles.hairline} />
      </View>

      <View style={styles.content}>
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nothing set.</Text>
              <Text variant="caption" color={theme.colors.onSurfaceInactive} align="center" style={styles.emptyHint}>
                Tap “New alarm” below to schedule your first wake-up.
              </Text>
            </View>
          }
        />

        <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={handleAddPress}>
          <View style={styles.fabIconWrap}>
            <Feather name="plus" size={16} color={theme.colors.background} />
          </View>
          <Text style={styles.fabText}>New alarm</Text>
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
  haloOuter: {
    position: 'absolute',
    top: -180,
    right: -140,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: theme.colors.accentSoft,
    opacity: 0.45,
  },
  haloInner: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.accentSoft,
    opacity: 0.6,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  greeting: {
    color: theme.colors.onBackground,
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: -1,
    lineHeight: 46,
  },
  greetingPunct: {
    color: theme.colors.accent,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginRight: theme.spacing.sm,
  },
  nextLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginRight: theme.spacing.sm,
  },
  nextTime: {
    color: theme.colors.onBackground,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    marginRight: theme.spacing.sm,
  },
  nextAmPm: {
    color: theme.colors.onSurfaceInactive,
    fontSize: 12,
  },
  nextDelta: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2,
    marginRight: theme.spacing.md,
  },
  hairline: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyWrap: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.colors.onBackground,
    fontSize: 22,
    fontWeight: '300',
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  emptyHint: {
    fontSize: 13,
    maxWidth: 240,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: theme.spacing.lg,
    paddingVertical: 6,
    backgroundColor: theme.colors.onBackground,
    borderRadius: theme.borderRadius.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  fabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  fabText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
