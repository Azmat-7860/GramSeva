import { PaymentType } from '../types';

export interface PaymentStatus {
  label: string;
  color: string;
  type: 'paid' | 'partial' | 'pending' | 'overdue';
}

export function calculateStatus(
  amountDue: number,
  totalPaid: number,
  isOverdue: boolean = false
): PaymentStatus {
  if (totalPaid >= amountDue) {
    return { label: 'Paid', color: '#00D4AA', type: 'paid' };
  }
  if (totalPaid > 0 && totalPaid < amountDue) {
    return { label: 'Partial', color: '#F5A623', type: 'partial' };
  }
  if (isOverdue) {
    return { label: 'Overdue', color: '#FF4D6D', type: 'overdue' };
  }
  return { label: 'Pending', color: '#8A8FA8', type: 'pending' };
}

export function getPaymentType(amountPaid: number, amountDue: number): PaymentType {
  if (amountPaid >= amountDue) return 'full';
  if (amountPaid > 0) return 'partial';
  return 'full';
}
