import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CollectionsState, Collection } from '../../types';

const initialState: CollectionsState = {
  list: [],
  loading: false,
};

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    setCollections(state, action: PayloadAction<Collection[]>) {
      state.list = action.payload;
    },
    addCollection(state, action: PayloadAction<Collection>) {
      state.list.push(action.payload);
    },
    updateCollection(state, action: PayloadAction<Partial<Collection> & { id: string }>) {
      const idx = state.list.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.list[idx] = { ...state.list[idx], ...action.payload };
      }
    },
    closeCollection(state, action: PayloadAction<string>) {
      const idx = state.list.findIndex((c) => c.id === action.payload);
      if (idx !== -1) {
        state.list[idx].status = 'closed';
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setCollections, addCollection, updateCollection, closeCollection, setLoading } = collectionsSlice.actions;
export const collectionsReducer = collectionsSlice.reducer;
