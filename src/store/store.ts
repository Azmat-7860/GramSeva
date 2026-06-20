import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { authReducer } from './slices/authSlice';
import { collectorReducer } from './slices/collectorSlice';
import { villagersReducer } from './slices/villagersSlice';
import { collectionsReducer } from './slices/collectionsSlice';
import { paymentsReducer } from './slices/paymentsSlice';
import { remindersReducer } from './slices/remindersSlice';
import { uiReducer } from './slices/uiSlice';
import { supabaseApi } from './api/supabaseApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    collector: collectorReducer,
    villagers: villagersReducer,
    collections: collectionsReducer,
    payments: paymentsReducer,
    reminders: remindersReducer,
    ui: uiReducer,
    [supabaseApi.reducerPath]: supabaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(supabaseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
