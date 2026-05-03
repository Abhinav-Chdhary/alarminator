import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { addMinutes } from 'date-fns';

import { Text } from '../src/components/01_atoms/Text';
import { Button } from '../src/components/01_atoms/Button';
import { theme } from '../src/theme';
import { snoozeAlarm, clearSnoozeNotification } from '../src/services/notificationService';
import { useAlarms } from '../src/store/AlarmContext';

export default function AlarmActiveScreen() {
  const { alarmId, task } = useLocalSearchParams<{ alarmId: string, task: string }>();
  const router = useRouter();
  const { setSnoozedUntil } = useAlarms();
  
  const [snoozeMinutes, setSnoozeMinutes] = useState(5);
  const [message, setMessage] = useState<{ title: string, body: string } | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Notifications.dismissAllNotificationsAsync();
  }, []);

  useEffect(() => {
    async function playSound() {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../sounds/wrist_watch.wav'),
          { isLooping: true, shouldPlay: true }
        );
        soundRef.current = newSound;
      } catch (error) {
        console.error("Failed to play sound", error);
      }
    }
    playSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().then(() => soundRef.current?.unloadAsync()).catch(console.error);
      }
    };
  }, []);

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(console.error);
      await soundRef.current.unloadAsync().catch(console.error);
      soundRef.current = null;
    }
  };

  const handleSnooze = async () => {
    if (!alarmId) return;
    await stopSound();
    await snoozeAlarm(alarmId, snoozeMinutes);
    await setSnoozedUntil(alarmId, addMinutes(new Date(), snoozeMinutes));
    
    setMessage({ title: 'Snoozed', body: `Alarm snoozed for ${snoozeMinutes} minutes.` });
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  const handleDismiss = async () => {
    if (!alarmId) return;
    await stopSound();
    await clearSnoozeNotification(alarmId);
    await setSnoozedUntil(alarmId, undefined);
    
    setMessage({ 
      title: 'Task', 
      body: `You need to: ${decodeURIComponent(task || 'Do the puzzle')}\n\n(Puzzle UI not implemented yet. Dismissing alarm.)` 
    });
    setTimeout(() => {
      router.back();
    }, 3000);
  };

  const adjustSnooze = (increment: boolean) => {
    setSnoozeMinutes(prev => {
      if (increment) {
        if (prev >= 5) return prev + 5;
        return prev + 1;
      } else {
        if (prev > 5) return prev - 5;
        return Math.max(1, prev - 1);
      }
    });
  };

  if (message) {
    return (
      <SafeAreaView style={[styles.container, styles.messageContainer]}>
        <Text variant="h1" color={theme.colors.primary} style={styles.messageTitle}>{message.title}</Text>
        <Text variant="h3" align="center" color={theme.colors.onBackground}>{message.body}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="h1" color={theme.colors.primary}>WAKE UP!</Text>
          <Text variant="h3" color={theme.colors.onBackground} style={styles.subtitle}>
            Your alarm is ringing.
          </Text>
        </View>

        <View style={styles.snoozeContainer}>
          <Text variant="h2" align="center" style={styles.snoozeLabel}>Snooze</Text>
          <View style={styles.snoozeControls}>
            <Button title="-" variant="outline" onPress={() => adjustSnooze(false)} style={styles.roundBtn} />
            <Text variant="h1" style={styles.snoozeTime}>{snoozeMinutes} m</Text>
            <Button title="+" variant="outline" onPress={() => adjustSnooze(true)} style={styles.roundBtn} />
          </View>
          <Button title="Snooze Alarm" onPress={handleSnooze} variant="secondary" style={styles.snoozeBtn} />
        </View>

        <View style={styles.dismissContainer}>
          <Text variant="body" align="center" style={styles.dismissHint}>
            Task: {decodeURIComponent(task || 'Unknown')}
          </Text>
          <Button title="Dismiss (Do Task)" onPress={handleDismiss} variant="primary" style={styles.dismissBtn} />
        </View>
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
    padding: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  messageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  messageTitle: {
    marginBottom: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
  },
  snoozeContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  snoozeLabel: {
    marginBottom: theme.spacing.md,
  },
  snoozeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  snoozeTime: {
    marginHorizontal: theme.spacing.lg,
    width: 100,
    textAlign: 'center',
  },
  roundBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  snoozeBtn: {
    width: '100%',
  },
  dismissContainer: {
    marginBottom: theme.spacing.xl,
  },
  dismissHint: {
    marginBottom: theme.spacing.md,
    color: theme.colors.disabled,
  },
  dismissBtn: {
    paddingVertical: theme.spacing.lg,
  }
});
