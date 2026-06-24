import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../supabaseClient';
import {
  Villager,
  Collector,
  Collection,
  CollectionMember,
  Payment,
  AggregateTotals,
  CreateCollectionPayload,
  RecordPaymentPayload,
  CollectionCycle,
} from '../../types';

export const supabaseApi = createApi({
  reducerPath: 'supabaseApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    'Villagers',
    'Collectors',
    'Collections',
    'CollectionMembers',
    'Payments',
    'Aggregate',
    'CollectionCollectors',
  ],
  endpoints: (builder) => ({
    // ─── Villagers ──────────────────────────────────────────
    getVillagers: builder.query<Villager[], string>({
      queryFn: async (villageId) => {
        const { data, error } = await supabase
          .from('villagers')
          .select('*')
          .eq('village_id', villageId)
          .order('name');
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Villagers'],
    }),

    addVillager: builder.mutation<Villager, Partial<Villager>>({
      queryFn: async (villager) => {
        const { data, error } = await supabase
          .from('villagers')
          .insert(villager)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Villagers'],
    }),

    updateVillager: builder.mutation<Villager, Partial<Villager> & { id: string }>({
      queryFn: async ({ id, ...updates }) => {
        const { data, error } = await supabase
          .from('villagers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Villagers'],
    }),

    // ─── Collectors ──────────────────────────────────────────
    getCollectors: builder.query<Collector[], string>({
      queryFn: async (villageId) => {
        const { data, error } = await supabase
          .from('collectors')
          .select('*')
          .eq('village_id', villageId)
          .order('name');
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Collectors'],
    }),

    addCollector: builder.mutation<Collector, Partial<Collector>>({
      queryFn: async (collector) => {
        const { data, error } = await supabase
          .from('collectors')
          .insert(collector)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Collectors'],
    }),

    removeCollector: builder.mutation<null, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('collectors')
          .delete()
          .eq('id', id);
        if (error) return { error };
        return { data: null };
      },
      invalidatesTags: ['Collectors'],
    }),

    // ─── Collections ──────────────────────────────────────────
    getCollections: builder.query<Collection[], string>({
      queryFn: async (villageId) => {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('village_id', villageId)
          .order('created_at', { ascending: false });
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Collections'],
    }),

    createCollection: builder.mutation<Collection, CreateCollectionPayload>({
      queryFn: async (payload) => {
        const { members, ...collectionData } = payload;
        const { data: collection, error: collError } = await supabase
          .from('collections')
          .insert(collectionData)
          .select()
          .single();
        if (collError) return { error: collError };

        const memberInserts = members.map((m) => ({
          ...m,
          base_amount_due: m.amount_due,
          credit_balance: 0,
          collection_id: collection.id,
        }));
        const { error: memError } = await supabase
          .from('collection_members')
          .insert(memberInserts);
        if (memError) return { error: memError };

        return { data: collection };
      },
      invalidatesTags: ['Collections', 'CollectionMembers'],
    }),

    closeCollection: builder.mutation<Collection, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('collections')
          .update({ status: 'closed' })
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Collections'],
    }),

    updateCollection: builder.mutation<Collection, Partial<Collection> & { id: string }>({
      queryFn: async ({ id, ...updates }) => {
        const { data, error } = await supabase
          .from('collections')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Collections'],
    }),

    deleteCollection: builder.mutation<null, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('collections')
          .delete()
          .eq('id', id);
        if (error) return { error };
        return { data: null };
      },
      invalidatesTags: ['Collections'],
    }),

    // ─── Collection Members ──────────────────────────────────
    getCollectionMembers: builder.query<CollectionMember[], string>({
      queryFn: async (collectionId) => {
        const { data, error } = await supabase
          .from('collection_members')
          .select('*')
          .eq('collection_id', collectionId);
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['CollectionMembers'],
    }),

    getCollectionMembersWithVillagers: builder.query<any[], string>({
      queryFn: async (collectionId) => {
        const { data, error } = await supabase
          .from('collection_members')
          .select('*, villagers(name, phone)')
          .eq('collection_id', collectionId);
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['CollectionMembers'],
    }),

    getCollectionMemberDetail: builder.query<any, string>({
      queryFn: async (memberId) => {
        const { data, error } = await supabase
          .from('collection_members')
          .select('*, villagers(name, phone), collections(name)')
          .eq('id', memberId)
          .single();
        if (error) return { error };
        return { data: data ?? null };
      },
      providesTags: ['CollectionMembers'],
    }),

    updateCollectionMember: builder.mutation<any, { id: string; amount_due: number }>({
      queryFn: async ({ id, amount_due }) => {
        const { data, error } = await supabase
          .from('collection_members')
          .update({ amount_due, base_amount_due: amount_due })
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['CollectionMembers', 'Payments', 'Collections'],
    }),

    addCollectionMember: builder.mutation<any, {
      collection_id: string;
      villager_id: string;
      amount_due: number;
    }>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('collection_members')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['CollectionMembers'],
    }),

    getCollection: builder.query<Collection, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return { error };
        return { data };
      },
      providesTags: ['Collections'],
    }),

    // ─── Collector Assignments ─────────────────────────────
    getCollectorAssignments: builder.query<any[], string>({
      queryFn: async (collectorId) => {
        // get collection ids from junction table
        const { data: links } = await supabase
          .from('collection_collectors')
          .select('collection_id')
          .eq('collector_id', collectorId);
        if (!links?.length) return { data: [] };

        const collIds = links.map((l) => l.collection_id);
        // get all members of those collections
        const { data, error } = await supabase
          .from('collection_members')
          .select('*, villagers(name, phone), collections!inner(id, name, status, type, village_id, target_amount, created_at), payments(amount_paid, paid_at)')
          .in('collection_id', collIds);
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['CollectionMembers', 'CollectionCollectors'],
    }),

    // ─── Payments ────────────────────────────────────────────
    getPaymentsForCollection: builder.query<Payment[], string>({ // collection_member_id
      queryFn: async (collectionMemberId) => {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('collection_member_id', collectionMemberId)
          .order('paid_at', { ascending: false });
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Payments'],
    }),

    getPaymentsByCollection: builder.query<any[], { collectionId: string; monthLabel?: string }>({
      queryFn: async ({ collectionId, monthLabel }) => {
        const { data: members } = await supabase
          .from('collection_members')
          .select('id')
          .eq('collection_id', collectionId);
        if (!members?.length) return { data: [] };
        const memberIds = members.map((m) => m.id);
        let query = supabase
          .from('payments')
          .select('*, collectors(name)')
          .in('collection_member_id', memberIds);
        if (monthLabel) {
          query = query.eq('month_label', monthLabel);
        }
        const { data, error } = await query.order('paid_at', { ascending: false });
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Payments'],
    }),

    getPaymentsByVillage: builder.query<Payment[], string>({
      queryFn: async (villageId) => {
        const { data: collections } = await supabase
          .from('collections')
          .select('id')
          .eq('village_id', villageId);
        if (!collections?.length) return { data: [] };
        const collectionIds = collections.map((c) => c.id);
        const { data: members } = await supabase
          .from('collection_members')
          .select('id')
          .in('collection_id', collectionIds);
        if (!members?.length) return { data: [] };
        const memberIds = members.map((m) => m.id);
        const { data, error } = await supabase
          .from('payments')
          .select('*, collection_members!inner(collection_id)')
          .in('collection_member_id', memberIds)
          .order('paid_at', { ascending: false });
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Payments'],
    }),

    recordPayment: builder.mutation<Payment, RecordPaymentPayload>({
      queryFn: async (payment) => {
        const { data, error } = await supabase
          .from('payments')
          .insert(payment)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Payments'],
    }),

    updatePayment: builder.mutation<Payment, Partial<Payment> & { id: string }>({
      queryFn: async ({ id, ...updates }) => {
        const { data, error } = await supabase
          .from('payments')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Payments'],
    }),

    // ─── Aggregate (public) ──────────────────────────────────
    getAggregateTotal: builder.query<AggregateTotals, { villageId: string; collectionId: string }>({
      queryFn: async ({ villageId, collectionId }) => {
        const { data, error } = await supabase
          .rpc('get_aggregate_totals', {
            p_village_id: villageId,
            p_collection_id: collectionId,
          });
        if (error) return { error };
        return { data: data as AggregateTotals };
      },
      providesTags: ['Aggregate'],
    }),

    // ─── Villager History (OTP-gated) ──────────────────────
    getVillagerHistory: builder.query<any[], string>({
      queryFn: async (phone) => {
        const { data: villagers, error: vError } = await supabase
          .from('villagers')
          .select('id')
          .eq('phone', phone);
        if (vError) return { error: vError };
        if (!villagers?.length) return { data: [] };

        const villagerIds = villagers.map((v) => v.id);
        const { data: members, error: mError } = await supabase
          .from('collection_members')
          .select('*, collections(*), payments(*)')
          .in('villager_id', villagerIds);
        if (mError) return { error: mError };

        return { data: members ?? [] };
      },
    }),

    // ─── Reminders ──────────────────────────────────────────
    getDashboardStats: builder.query<any, string>({
      queryFn: async (villageId) => {
        const { data: collections } = await supabase
          .from('collections')
          .select('id')
          .eq('village_id', villageId)
          .eq('status', 'active');
        if (!collections?.length) {
          return { data: { totalCollected: 0, totalPending: 0, collectionStats: [] } };
        }
        const collIds = collections.map((c) => c.id);
        const { data: members } = await supabase
          .from('collection_members')
          .select('id, collection_id, amount_due')
          .in('collection_id', collIds);
        if (!members?.length) {
          return { data: { totalCollected: 0, totalPending: 0, collectionStats: [] } };
        }
        const memberIds = members.map((m) => m.id);
        const memberToColl: Record<string, string> = {};
        const perCollTotal: Record<string, number> = {};
        members.forEach((m) => {
          memberToColl[m.id] = m.collection_id;
          perCollTotal[m.collection_id] = (perCollTotal[m.collection_id] || 0) + Number(m.amount_due);
        });
        const totalDue = members.reduce((s, m) => s + Number(m.amount_due), 0);
        const { data: payments } = await supabase
          .from('payments')
          .select('amount_paid, collection_member_id')
          .in('collection_member_id', memberIds);
        const perCollPaid: Record<string, number> = {};
        let totalCollected = 0;
        payments?.forEach((p) => {
          totalCollected += Number(p.amount_paid);
          const cId = memberToColl[p.collection_member_id];
          if (cId) perCollPaid[cId] = (perCollPaid[cId] || 0) + Number(p.amount_paid);
        });
        const collectionStats = collIds.map((id) => ({
          id,
          collected: perCollPaid[id] || 0,
          total: perCollTotal[id] || 0,
        }));
        return { data: { totalCollected, totalPending: totalDue - totalCollected, collectionStats } };
      },
      providesTags: ['Payments', 'Collections', 'CollectionMembers'],
    }),

    getReminderQueue: builder.query<CollectionMember[], void>({
      queryFn: async () => {
        const today = new Date().getDate();
        const { data, error } = await supabase
          .from('collection_members')
          .select('*')
          .eq('reminder_date', today);
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['CollectionMembers'],
    }),

    // ─── Reset Collector PIN ────────────────────────────────
    resetCollectorPin: builder.mutation<null, { collectorId: string; newPin: string }>({
      queryFn: async ({ collectorId, newPin }) => {
        const { error } = await supabase
          .from('collectors')
          .update({ pin_hash: newPin })
          .eq('id', collectorId);
        if (error) return { error };
        return { data: null };
      },
      invalidatesTags: ['Collectors'],
    }),

    // ─── Carry Forward Dues ──────────────────────────────────
    getCarryForwardDues: builder.query<any[], string>({
      queryFn: async (memberId) => {
        const { data, error } = await supabase
          .from('carry_forward_dues')
          .select('*')
          .eq('collection_member_id', memberId)
          .order('created_at', { ascending: false });
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Payments'],
    }),

    // ─── Collection Cycles ─────────────────────────────────
    getCollectionCycles: builder.query<CollectionCycle[], string>({
      queryFn: async (collectionId) => {
        const { data, error } = await supabase
          .from('collection_cycles')
          .select('*')
          .eq('collection_id', collectionId)
          .order('started_at', { ascending: false });
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['Collections'],
    }),

    // ─── Start New Cycle ────────────────────────────────────
    startNewCycle: builder.mutation<any, string>({
      queryFn: async (collectionId) => {
        const { data, error } = await supabase
          .rpc('start_new_cycle', { p_collection_id: collectionId });
        if (error) return { error };
        if (data?.error) return { error: new Error(data.error) };
        return { data };
      },
      invalidatesTags: ['CollectionMembers', 'Payments', 'Collections'],
    }),

    // ─── Collection Collectors ───────────────────────────────
    getCollectionCollectors: builder.query<any[], string>({
      queryFn: async (collectionId) => {
        const { data, error } = await supabase
          .from('collection_collectors')
          .select('*, collectors(id, name, phone)')
          .eq('collection_id', collectionId);
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['CollectionCollectors'],
    }),

    addCollectorToCollection: builder.mutation<any, { collection_id: string; collector_id: string }>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('collection_collectors')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['CollectionCollectors'],
    }),

    removeCollectorFromCollection: builder.mutation<null, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('collection_collectors')
          .delete()
          .eq('id', id);
        if (error) return { error };
        return { data: null };
      },
      invalidatesTags: ['CollectionCollectors'],
    }),

    getCollectorCollections: builder.query<any[], string>({
      queryFn: async (collectorId) => {
        const { data, error } = await supabase
          .from('collection_collectors')
          .select('*, collections(id, name, type, status, village_id, target_amount, created_at, villages(name))')
          .eq('collector_id', collectorId);
        if (error) return { error };
        return { data: data ?? [] };
      },
      providesTags: ['CollectionCollectors', 'Collections'],
    }),
  }),
});

export const {
  useGetVillagersQuery,
  useAddVillagerMutation,
  useUpdateVillagerMutation,
  useGetCollectorsQuery,
  useAddCollectorMutation,
  useRemoveCollectorMutation,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useCloseCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCollectionMembersQuery,
  useGetCollectionMembersWithVillagersQuery,
  useGetCollectionMemberDetailQuery,
  useAddCollectionMemberMutation,
  useUpdateCollectionMemberMutation,
  useGetCollectionQuery,
  useGetCollectorAssignmentsQuery,
  useGetPaymentsForCollectionQuery,
  useGetPaymentsByCollectionQuery,
  useGetPaymentsByVillageQuery,
  useRecordPaymentMutation,
  useUpdatePaymentMutation,
  useGetAggregateTotalQuery,
  useGetVillagerHistoryQuery,
  useGetDashboardStatsQuery,
  useGetReminderQueueQuery,
  useResetCollectorPinMutation,
  useGetCollectionCollectorsQuery,
  useAddCollectorToCollectionMutation,
  useRemoveCollectorFromCollectionMutation,
  useGetCollectorCollectionsQuery,
  useGetCarryForwardDuesQuery,
  useStartNewCycleMutation,
  useGetCollectionCyclesQuery,
} = supabaseApi;
