import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setReminderQueue, removeFromQueue, setLastRun } from '../store/slices/remindersSlice';
import { useGetReminderQueueQuery } from '../store/api/supabaseApi';

export function useReminderQueue() {
  const dispatch = useAppDispatch();
  const { queue, dailyCap, lastRun } = useAppSelector((state) => state.reminders);
  const { data, isLoading } = useGetReminderQueueQuery();

  useEffect(() => {
    if (data) {
      dispatch(setReminderQueue(data));
    }
  }, [data, dispatch]);

  const markSent = (id: string) => {
    dispatch(removeFromQueue(id));
    dispatch(setLastRun(new Date().toISOString()));
  };

  return {
    queue,
    dailyCap,
    lastRun,
    isLoading,
    markSent,
  };
}
