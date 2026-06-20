import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CollectorState, Collector } from '../../types';

const initialState: CollectorState = {
  currentCollector: null,
  pinVerified: false,
  assignedVillages: [],
};

const collectorSlice = createSlice({
  name: 'collector',
  initialState,
  reducers: {
    setCollector(state, action: PayloadAction<Collector>) {
      state.currentCollector = action.payload;
    },
    setPinVerified(state, action: PayloadAction<boolean>) {
      state.pinVerified = action.payload;
    },
    setAssignedVillages(state, action: PayloadAction<any[]>) {
      state.assignedVillages = action.payload;
    },
    clearCollector(state) {
      state.currentCollector = null;
      state.pinVerified = false;
      state.assignedVillages = [];
    },
  },
});

export const { setCollector, setPinVerified, setAssignedVillages, clearCollector } = collectorSlice.actions;
export const collectorReducer = collectorSlice.reducer;
