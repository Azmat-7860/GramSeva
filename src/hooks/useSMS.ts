import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { SendDirectSms } from 'react-native-send-direct-sms';
import Toast from 'react-native-toast-message';

interface SMSPayload {
  phoneNumber: string;
  message: string;
}

async function requestSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      {
        title: 'GramSeva – SMS Permission',
        message:
          'GramSeva needs permission to send payment confirmation SMS ' +
          'directly to villagers from your SIM — without opening the SMS app.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function useSMS() {
  const sendSMS = useCallback(
    async ({ phoneNumber, message }: SMSPayload): Promise<{ success: boolean; error?: string }> => {
      if (!phoneNumber) {
        Toast.show({ type: 'error', text1: 'No phone number found for this villager' });
        return { success: false, error: 'No phone number' };
      }

      if (Platform.OS !== 'android') {
        Toast.show({ type: 'info', text1: 'SMS only supported on Android' });
        return { success: false, error: 'Platform not supported' };
      }

      const hasPermission = await requestSMSPermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'SMS Permission Denied',
          text2: 'Payment recorded, but SMS could not be sent.',
        });
        return { success: false, error: 'SMS permission denied' };
      }

      try {
        await SendDirectSms(phoneNumber, message);
        Toast.show({
          type: 'success',
          text1: 'SMS Sent ✓',
          text2: `Payment confirmation sent to ${phoneNumber}`,
        });
        return { success: true };
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'SMS Failed',
          text2: String(err),
        });
        return { success: false, error: String(err) };
      }
    },
    []
  );

  const generateReminderMessage = useCallback(
    (
      name: string,
      amount: number,
      collection: string,
      balance: number,
      collectorName: string
    ) => {
      return (
        `Dear ${name}, Rs.${amount} received for ${collection}. ` +
        `Remaining: Rs.${balance}. - ${collectorName}`
      );
    },
    []
  );

  return { sendSMS, generateReminderMessage };
}