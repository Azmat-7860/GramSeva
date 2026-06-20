import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaymentsState, Payment } from '../../types';

const initialState: PaymentsState = {
  byCollection: {},
  loading: false,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setPaymentsForCollection(state, action: PayloadAction<{ collectionId: string; payments: Payment[] }>) {
      state.byCollection[action.payload.collectionId] = action.payload.payments;
    },
    addPayment(state, action: PayloadAction<{ collectionId: string; payment: Payment }>) {
      const { collectionId, payment } = action.payload;
      if (!state.byCollection[collectionId]) {
        state.byCollection[collectionId] = [];
      }
      state.byCollection[collectionId].unshift(payment);
    },
    updatePayment(state, action: PayloadAction<{ collectionId: string; payment: Partial<Payment> & { id: string } }>) {
      const { collectionId, payment } = action.payload;
      const payments = state.byCollection[collectionId];
      if (payments) {
        const idx = payments.findIndex((p) => p.id === payment.id);
        if (idx !== -1) {
          payments[idx] = { ...payments[idx], ...payment };
        }
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setPaymentsForCollection, addPayment, updatePayment, setLoading } = paymentsSlice.actions;
export const paymentsReducer = paymentsSlice.reducer;
