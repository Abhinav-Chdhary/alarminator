import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Alarm } from '../types';

const ALARM_CHANNEL_ID = 'alarminator-alarms-v2';
const SNOOZE_ID_PREFIX = 'alarm-snooze-';
const DEFAULT_ALARM_SOUND = 'WristWatch.wav';

type ReconcileResult = {
  alarms: Alarm[];
  didChange: boolean;
};

const getWeekdayTriggerValue = (day: number) => {
  // Expo weekly trigger weekday: 1 = Sunday ... 7 = Saturday.
  return day + 1;
};

const buildRecurringIdentifiers = (alarm: Alarm) => {
  if (alarm.repeatDays && alarm.repeatDays.length > 0) {
    return alarm.repeatDays.map((day) => `alarm-${alarm.id}-weekday-${day}`);
  }
  return [`alarm-${alarm.id}-daily`];
};

const buildSnoozeIdentifier = (alarmId: string) => `${SNOOZE_ID_PREFIX}${alarmId}`;

const buildDailyTrigger = (alarm: Alarm): Notifications.DailyTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour: alarm.time.getHours(),
  minute: alarm.time.getMinutes(),
  channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
});

const buildWeeklyTrigger = (
  alarm: Alarm,
  weekday: number
): Notifications.WeeklyTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
  weekday,
  hour: alarm.time.getHours(),
  minute: alarm.time.getMinutes(),
  channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
});

const scheduleRecurringTriggerByIdentifier = async (alarm: Alarm, identifier: string) => {
  const weekdayMatch = identifier.match(/-weekday-(\d)$/);
  const trigger = weekdayMatch
    ? buildWeeklyTrigger(alarm, getWeekdayTriggerValue(Number(weekdayMatch[1])))
    : buildDailyTrigger(alarm);

  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: alarm.label || 'Alarm',
      body: alarm.task ? `Task: ${alarm.task}` : 'Time to wake up.',
      sound: DEFAULT_ALARM_SOUND,
      data: {
        alarmId: alarm.id,
        task: alarm.task || '',
        source: 'alarm',
      },
    },
    trigger,
  });
};

const cancelIdentifiers = async (identifiers: string[]) => {
  await Promise.all(
    identifiers.map(async (identifier) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch (error) {
        console.warn(`[Notifications] Failed to cancel ${identifier}`, error);
      }
    })
  );
};

export const requestPermissionsAsync = async () => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
        name: 'Alarm Notifications',
        importance: Notifications.AndroidImportance.MAX,
        sound: DEFAULT_ALARM_SOUND,
        vibrationPattern: [0, 500, 250, 500],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) {
      Alert.alert(
        'Notifications Disabled',
        'Alarms need notification permission to ring. Enable notifications in system settings, then reopen Alarminator.'
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Permission setup failed', error);
    Alert.alert(
      'Notification Setup Failed',
      'We could not initialize alarm notifications. Please restart the app and try again.'
    );
    return false;
  }
};

export const scheduleAlarmNotification = async (alarm: Alarm): Promise<string[]> => {
  const identifiers = buildRecurringIdentifiers(alarm);
  await cancelIdentifiers(identifiers);

  const scheduledIds = await Promise.all(
    identifiers.map((identifier) => scheduleRecurringTriggerByIdentifier(alarm, identifier))
  );

  return scheduledIds;
};

export const cancelAlarmNotification = async (alarmId: string, notificationIds?: string[]) => {
  const recurringIds = notificationIds && notificationIds.length > 0
    ? notificationIds
    : [`alarm-${alarmId}-daily`];

  await cancelIdentifiers([...recurringIds, buildSnoozeIdentifier(alarmId)]);
};

export const clearSnoozeNotification = async (alarmId: string) => {
  await cancelIdentifiers([buildSnoozeIdentifier(alarmId)]);
};

export const snoozeAlarm = async (alarmId: string, minutes: number = 5) => {
  const identifier = buildSnoozeIdentifier(alarmId);
  await cancelIdentifiers([identifier]);

  const seconds = Math.max(1, minutes * 60);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: 'Snooze ended',
      body: 'Your alarm is ringing again.',
      sound: DEFAULT_ALARM_SOUND,
      data: {
        alarmId,
        source: 'snooze',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
    },
  });
};

export const reconcileAlarmSchedules = async (alarms: Alarm[]): Promise<ReconcileResult> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(scheduledNotifications.map((n) => n.identifier));

    let didChange = false;
    const reconciledAlarms = await Promise.all(
      alarms.map(async (alarm) => {
        if (!alarm.isEnabled) {
          if ((alarm.notificationIds && alarm.notificationIds.length > 0) || alarm.snoozeNotificationId) {
            await cancelAlarmNotification(alarm.id, alarm.notificationIds);
            didChange = true;
          }
          return { ...alarm, notificationIds: [], snoozeNotificationId: undefined };
        }

        const desiredIds = buildRecurringIdentifiers(alarm);
        const allScheduled = desiredIds.every((id) => scheduledIds.has(id));
        const hasMatchingIds =
          alarm.notificationIds &&
          alarm.notificationIds.length === desiredIds.length &&
          alarm.notificationIds.every((id) => desiredIds.includes(id));

        if (allScheduled && hasMatchingIds) {
          return alarm;
        }

        const notificationIds = await scheduleAlarmNotification(alarm);
        didChange = true;
        return {
          ...alarm,
          notificationIds,
          snoozeNotificationId: alarm.snoozeNotificationId || buildSnoozeIdentifier(alarm.id),
        };
      })
    );

    return {
      alarms: reconciledAlarms,
      didChange,
    };
  } catch (error) {
    console.error('[Notifications] Reconciliation failed', error);
    return { alarms, didChange: false };
  }
};
