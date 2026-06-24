export interface Village {
  id: string;
  admin_id: string;
  name: string;
  daily_sms_cap: number;
  created_at: string;
}

export interface Villager {
  id: string;
  village_id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface Collector {
  id: string;
  village_id: string;
  name: string;
  phone: string;
  pin_hash: string | null;
  created_at: string;
}

export type CollectionType = 'recurring' | 'one_time';
export type CollectionStatus = 'active' | 'closed';
export type PaymentType = 'partial' | 'full' | 'extra';

export interface Collection {
  id: string;
  village_id: string;
  name: string;
  type: CollectionType;
  status: CollectionStatus;
  target_amount: number | null;
  current_month_label: string | null;
  created_at: string;
}

export interface CollectionMember {
  id: string;
  collection_id: string;
  villager_id: string;
  collector_id: string;
  amount_due: number;
  base_amount_due: number;
  credit_balance: number;
  reminder_date: number | null;
  created_at: string;
}

export interface Payment {
  id: string;
  collection_member_id: string;
  amount_paid: number;
  payment_type: PaymentType;
  month_label: string | null;
  note: string | null;
  paid_at: string;
  recorded_by: string | null;
}

export interface CarryForwardDue {
  id: string;
  collection_member_id: string;
  amount: number;
  from_month: string;
  to_month: string;
  created_at: string;
}

export interface SMSLog {
  id: string;
  village_id: string;
  collection_member_id: string;
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  sent_at: string;
}

export interface AuthState {
  session: string | null;
  email: string | null;
  isLoggedIn: boolean;
  role: 'admin' | 'collector' | null;
  villageId: string | null;
  villageName: string | null;
}

export interface CollectorState {
  currentCollector: Collector | null;
  pinVerified: boolean;
  assignedVillages: Village[];
}

export interface VillagersState {
  list: Villager[];
  loading: boolean;
}

export interface CollectionsState {
  list: Collection[];
  loading: boolean;
}

export interface PaymentsState {
  byCollection: Record<string, Payment[]>;
  loading: boolean;
}

export interface ReminderState {
  queue: CollectionMember[];
  dailyCap: number;
  lastRun: string | null;
}

export interface UIState {
  loading: Record<string, boolean>;
  modalVisible: string | null;
  activeTab: string;
  reducedMotion: boolean;
}

export interface AggregateTotals {
  total_due: number;
  total_collected: number;
  member_count: number;
}

export interface VillagerHistoryEntry {
  payment: Payment;
  collection: Collection;
  member: CollectionMember;
}

export interface CollectionCycle {
  id: string;
  collection_id: string;
  month_label: string;
  total_due: number;
  member_snapshots: CycleMemberSnapshot[] | null;
  status: 'active' | 'closed';
  started_at: string;
  closed_at: string | null;
}

export interface CycleMemberSnapshot {
  member_id: string;
  villager_id: string;
  villager_name: string;
  amount_due: number;
  credit_balance: number;
  collector_name?: string;
}

export interface CreateCollectionPayload {
  name: string;
  type: CollectionType;
  village_id: string;
  target_amount?: number;
  members: {
    villager_id: string;
    collector_id: string | null;
    amount_due: number;
    reminder_date?: number;
  }[];
}

export interface RecordPaymentPayload {
  collection_member_id: string;
  amount_paid: number;
  payment_type: PaymentType;
  month_label?: string;
  note?: string;
  recorded_by?: string;
}
