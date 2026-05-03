import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AlarmProvider } from '../src/store/AlarmContext';
import { requestPermissionsAsync } from '../src/services/notificationService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    requestPermissionsAsync();

    const handleRouteFromPayload = (payload: Record<string, unknown> | undefined) => {
      const alarmId = typeof payload?.alarmId === 'string' ? payload.alarmId : undefined;
      if (!alarmId) return;
      const task = typeof payload?.task === 'string' ? payload.task : '';
      router.push(`/alarm-active?alarmId=${alarmId}&task=${encodeURIComponent(task)}`);
    };

    const receivedSub = Notifications.addNotificationReceivedListener((event) => {
      handleRouteFromPayload(event.request.content.data as Record<string, unknown> | undefined);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleRouteFromPayload(
        response.notification.request.content.data as Record<string, unknown> | undefined
      );
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handleRouteFromPayload(
        response.notification.request.content.data as Record<string, unknown> | undefined
      );
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [router]);

  return (
    <AlarmProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="alarm-active" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AlarmProvider>
  );
}
