import { useCallback } from 'react';
import * as SMS from 'expo-sms';

interface SMSPayload {
  phoneNumber: string;
  message: string;
}

export function useSMS() {
  const sendSMS = useCallback(async ({ phoneNumber, message }: SMSPayload) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      console.warn('SMS not available on this device');
      return { success: false, error: 'SMS not available' };
    }

    const { result } = await SMS.sendSMSAsync(
      [phoneNumber],
      message
    );

    return {
      success: result === 'sent' || result === 'unknown',
      result,
    };
  }, []);

  const generateReminderMessage = useCallback(
    (name: string, amount: number, collection: string, balance: number, collectorName: string) => {
      return `Dear ${name}, ₹${amount} received for ${collection}. Remaining: ₹${balance}. - ${collectorName}`;
    },
    []
  );

  return { sendSMS, generateReminderMessage };
}
