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
  useGetCollectionMembersQuery,
  useGetCollectionMemberDetailQuery,
  useGetPaymentsForCollectionQuery,
  useRecordPaymentMutation,
  useUpdatePaymentMutation,
  useGetAggregateTotalQuery,
  useGetVillagerHistoryQuery,
  useGetReminderQueueQuery,
  useResetCollectorPinMutation,
} = supabaseApi;
