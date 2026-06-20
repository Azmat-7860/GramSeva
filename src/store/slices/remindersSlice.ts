import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReminderState, CollectionMember } from '../../types';

const initialState: ReminderState = {
  queue: [],
  dailyCap: 50,
  lastRun: null,
};

const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    setReminderQueue(state, action: PayloadAction<CollectionMember[]>) {
      state.queue = action.payload;
    },
    removeFromQueue(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((r) => r.id !== action.payload);
    },
    setDailyCap(state, action: PayloadAction<number>) {
      state.dailyCap = action.payload;
    },
    setLastRun(state, action: PayloadAction<string>) {
      state.lastRun = action.payload;
    },
  },
});

export const { setReminderQueue, removeFromQueue, setDailyCap, setLastRun } = remindersSlice.actions;
export const remindersReducer = remindersSlice.reducer;
