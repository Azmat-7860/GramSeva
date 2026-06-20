import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VillagersState, Villager } from '../../types';

const initialState: VillagersState = {
  list: [],
  loading: false,
};

const villagersSlice = createSlice({
  name: 'villagers',
  initialState,
  reducers: {
    setVillagers(state, action: PayloadAction<Villager[]>) {
      state.list = action.payload;
    },
    addVillager(state, action: PayloadAction<Villager>) {
      state.list.push(action.payload);
    },
    updateVillager(state, action: PayloadAction<Partial<Villager> & { id: string }>) {
      const idx = state.list.findIndex((v) => v.id === action.payload.id);
      if (idx !== -1) {
        state.list[idx] = { ...state.list[idx], ...action.payload };
      }
    },
    removeVillager(state, action: PayloadAction<string>) {
      state.list = state.list.filter((v) => v.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setVillagers, addVillager, updateVillager, removeVillager, setLoading } = villagersSlice.actions;
export const villagersReducer = villagersSlice.reducer;
