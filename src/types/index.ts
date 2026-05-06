export interface Alarm {
  id: string;
  time: Date;
  isEnabled: boolean;

  task: string;
  repeatDays?: number[]; // 0 = Sun, 1 = Mon, etc.
  notificationIds?: string[];
  snoozeNotificationId?: string;
  snoozedUntil?: Date;
  sound?: string;
  vibrate?: boolean;
}
