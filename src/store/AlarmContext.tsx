import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alarm } from '../types';
import * as alarmStorage from '../services/alarmStorage';

interface AlarmContextType {
  alarms: Alarm[];
  loadAlarms: () => Promise<void>;
  addAlarm: (time: Date, task?: string) => Promise<void>;
  updateAlarm: (alarm: Alarm) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string, isEnabled: boolean) => Promise<void>;
  setSnoozedUntil: (id: string, snoozedUntil: Date | undefined) => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const loadAlarms = async () => {
    const loaded = await alarmStorage.reconcileStoredAlarmSchedules();
    setAlarms(loaded);
  };

  useEffect(() => {
    loadAlarms();
  }, []);

  const addAlarm = async (time: Date, task?: string) => {
    await alarmStorage.addAlarm(time, task);
    await loadAlarms();
  };

  const updateAlarm = async (alarm: Alarm) => {
    await alarmStorage.updateAlarm(alarm);
    await loadAlarms();
  };

  const deleteAlarm = async (id: string) => {
    await alarmStorage.deleteAlarm(id);
    await loadAlarms();
  };

  const toggleAlarm = async (id: string, isEnabled: boolean) => {
    await alarmStorage.toggleAlarm(id, isEnabled);
    await loadAlarms();
  };

  const setSnoozedUntil = async (id: string, snoozedUntil: Date | undefined) => {
    await alarmStorage.setAlarmSnoozedUntil(id, snoozedUntil);
    await loadAlarms();
  };

  return (
    <AlarmContext.Provider value={{ alarms, loadAlarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm, setSnoozedUntil }}>
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarms = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarms must be used within an AlarmProvider');
  }
  return context;
};
