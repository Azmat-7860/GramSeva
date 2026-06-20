import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '../../types';

const initialState: AuthState = {
  session: null,
  email: null,
  isLoggedIn: false,
  role: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ session: string; email: string; role: 'admin' | 'collector' }>) {
      state.session = action.payload.session;
      state.email = action.payload.email;
      state.isLoggedIn = true;
      state.role = action.payload.role;
    },
    clearSession(state) {
      state.session = null;
      state.email = null;
      state.isLoggedIn = false;
      state.role = null;
    },
    setRole(state, action: PayloadAction<'admin' | 'collector'>) {
      state.role = action.payload;
    },
  },
});

export const { setSession, clearSession, setRole } = authSlice.actions;
export const authReducer = authSlice.reducer;
