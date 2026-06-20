import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { supabase } from '../store/supabaseClient';

const REMINDER_TASK = 'REMINDER_TASK';

interface MemberWithJoins {
  id: string;
  reminder_date: number;
  amount_due: number;
  collection_id: string;
  villagers: { name: string; phone: string } | { name: string; phone: string }[];
  collections: { village_id: string; name: string } | { village_id: string; name: string }[];
}

TaskManager.defineTask(REMINDER_TASK, async () => {
  try {
    const today = new Date().getDate();

    const { data: members } = await supabase
      .from('collection_members')
      .select('id, reminder_date, amount_due, collection_id, villagers!inner(name, phone), collections!inner(village_id, name)')
      .eq('reminder_date', today);

    if (!members?.length) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    for (const raw of members) {
      const member = raw as unknown as MemberWithJoins;
      const villagerData = Array.isArray(member.villagers) ? member.villagers[0] : member.villagers;
      const collectionData = Array.isArray(member.collections) ? member.collections[0] : member.collections;

      if (!villagerData || !collectionData) continue;

      const { data: payments } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('collection_member_id', member.id);

      const totalPaid = payments?.reduce((s: number, p: any) => s + Number(p.amount_paid), 0) || 0;
      if (totalPaid >= Number(member.amount_due)) continue;

      const smsMessage = `Reminder: ${collectionData.name} payment of ₹${Number(member.amount_due) - totalPaid} is due. - GramSeva`;

      await supabase.from('sms_logs').insert({
        village_id: collectionData.village_id,
        collection_member_id: member.id,
        phone: villagerData.phone,
        message: smsMessage,
        status: 'sent',
      });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerReminderTask() {
  try {
    await BackgroundFetch.registerTaskAsync(REMINDER_TASK, {
      minimumInterval: 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (err) {
    console.warn('Background fetch registration failed:', err);
  }
}

export async function unregisterReminderTask() {
  try {
    await BackgroundFetch.unregisterTaskAsync(REMINDER_TASK);
  } catch (err) {
    console.warn('Background fetch unregistration failed:', err);
  }
}
