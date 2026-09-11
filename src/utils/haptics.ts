import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

export const hapticTap = () => {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

export const hapticSuccess = () => {
  if (isNative) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};

export const hapticWarning = () => {
  if (isNative) Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
};
