import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../types';
import uuid from 'react-native-uuid';
import { scheduleAlarmNotification, cancelAlarmNotification, reconcileAlarmSchedules } from './notificationService';

const ALARMS_STORAGE_KEY = '@alarminator_alarms';

export const getAlarms = async (): Promise<Alarm[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ALARMS_STORAGE_KEY);
    if (jsonValue != null) {
      const parsedAlarms = JSON.parse(jsonValue);
      // Revive Date objects
      return parsedAlarms.map((a: any) => ({
        ...a,
        time: new Date(a.time),
        snoozedUntil: a.snoozedUntil ? new Date(a.snoozedUntil) : undefined,
      }));
    }
    return [];
  } catch (e) {
    console.error('Error reading alarms', e);
    return [];
  }
};

export const saveAlarms = async (alarms: Alarm[]) => {
  try {
    const jsonValue = JSON.stringify(alarms);
    await AsyncStorage.setItem(ALARMS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving alarms', e);
  }
};

export const addAlarm = async (time: Date, task: string = 'math'): Promise<Alarm> => {
  const alarms = await getAlarms();
  const alarmId = uuid.v4().toString();
  const newAlarm: Alarm = {
    id: alarmId,
    time,
    isEnabled: true,
    task,
    notificationIds: [],
    snoozeNotificationId: `alarm-snooze-${alarmId}`,
  };
  const notificationIds = await scheduleAlarmNotification(newAlarm);
  newAlarm.notificationIds = notificationIds;
  alarms.push(newAlarm);
  await saveAlarms(alarms);
  return newAlarm;
};

export const updateAlarm = async (updatedAlarm: Alarm): Promise<Alarm[]> => {
  const alarms = await getAlarms();
  const index = alarms.findIndex(a => a.id === updatedAlarm.id);
  if (index > -1) {
    const previousNotificationIds = alarms[index].notificationIds;
    alarms[index] = updatedAlarm;
    
    // Reschedule
    await cancelAlarmNotification(updatedAlarm.id, previousNotificationIds);
    if (updatedAlarm.isEnabled) {
      const notificationIds = await scheduleAlarmNotification(updatedAlarm);
      alarms[index].notificationIds = notificationIds;
      alarms[index].snoozeNotificationId = `alarm-snooze-${updatedAlarm.id}`;
    } else {
      alarms[index].notificationIds = [];
      alarms[index].snoozeNotificationId = undefined;
    }
    await saveAlarms(alarms);
  }
  return alarms;
};

export const deleteAlarm = async (id: string): Promise<Alarm[]> => {
  const alarms = await getAlarms();
  const alarmToDelete = alarms.find((alarm) => alarm.id === id);
  const filtered = alarms.filter(a => a.id !== id);
  await saveAlarms(filtered);
  await cancelAlarmNotification(id, alarmToDelete?.notificationIds);
  return filtered;
};

export const toggleAlarm = async (id: string, isEnabled: boolean): Promise<Alarm[]> => {
  const alarms = await getAlarms();
  const index = alarms.findIndex(a => a.id === id);
  if (index > -1) {
    alarms[index].isEnabled = isEnabled;
    await saveAlarms(alarms);
    
    if (isEnabled) {
      const notificationIds = await scheduleAlarmNotification(alarms[index]);
      alarms[index].notificationIds = notificationIds;
      alarms[index].snoozeNotificationId = `alarm-snooze-${alarms[index].id}`;
      await saveAlarms(alarms);
    } else {
      await cancelAlarmNotification(id, alarms[index].notificationIds);
      alarms[index].notificationIds = [];
      alarms[index].snoozeNotificationId = undefined;
      alarms[index].snoozedUntil = undefined;
      await saveAlarms(alarms);
    }
  }
  return alarms;
};

export const setAlarmSnoozedUntil = async (id: string, snoozedUntil: Date | undefined): Promise<Alarm[]> => {
  const alarms = await getAlarms();
  const index = alarms.findIndex(a => a.id === id);
  if (index > -1) {
    alarms[index].snoozedUntil = snoozedUntil;
    await saveAlarms(alarms);
  }
  return alarms;
};

export const reconcileStoredAlarmSchedules = async (): Promise<Alarm[]> => {
  const alarms = await getAlarms();
  const { alarms: reconciled, didChange } = await reconcileAlarmSchedules(alarms);
  if (didChange) {
    await saveAlarms(reconciled);
  }
  return reconciled;
};
