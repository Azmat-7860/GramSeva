import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

const initialState: UIState = {
  loading: {},
  modalVisible: null,
  activeTab: 'Dashboard',
  reducedMotion: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<{ key: string; value: boolean }>) {
      state.loading[action.payload.key] = action.payload.value;
    },
    showModal(state, action: PayloadAction<string>) {
      state.modalVisible = action.payload;
    },
    hideModal(state) {
      state.modalVisible = null;
    },
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
  },
});

export const { setLoading, showModal, hideModal, setActiveTab, setReducedMotion } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
