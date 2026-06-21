import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  session: string | null;
  email: string | null;
  isLoggedIn: boolean;
  role: 'admin' | 'collector' | null;
  villageId: string | null;
  villageName: string | null;
}

const initialState: AuthState = {
  session: null,
  email: null,
  isLoggedIn: false,
  role: null,
  villageId: null,
  villageName: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{
      session: string;
      email: string;
      role: 'admin' | 'collector';
      villageId?: string;
      villageName?: string;
    }>) {
      state.session = action.payload.session;
      state.email = action.payload.email;
      state.isLoggedIn = true;
      state.role = action.payload.role;
      state.villageId = action.payload.villageId ?? null;
      state.villageName = action.payload.villageName ?? null;
    },
    clearSession(state) {
      state.session = null;
      state.email = null;
      state.isLoggedIn = false;
      state.role = null;
      state.villageId = null;
      state.villageName = null;
    },
    setRole(state, action: PayloadAction<'admin' | 'collector'>) {
      state.role = action.payload;
    },
    setVillage(state, action: PayloadAction<{ id: string; name: string }>) {
      state.villageId = action.payload.id;
      state.villageName = action.payload.name;
    },
  },
});

export const { setSession, clearSession, setRole, setVillage } = authSlice.actions;
export const authReducer = authSlice.reducer;
