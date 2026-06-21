import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Badge, Button } from '../../components/common';
import { ProgressRing, PaymentRow } from '../../components/collections';
import {
  useGetCollectionQuery,
  useGetCollectionMembersWithVillagersQuery,
  useGetPaymentsByCollectionQuery,
  useCloseCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} from '../../store/api/supabaseApi';
import Toast from 'react-native-toast-message';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

type FilterType = 'all' | 'paid' | 'partial' | 'pending' | 'overdue';

export function CollectionDetailScreen({ route, navigation }: any) {
  const { collectionId } = route.params;

  const { data: collection } = useGetCollectionQuery(collectionId);
  const { data: members = [] } =
    useGetCollectionMembersWithVillagersQuery(collectionId);
  const { data: payments = [] } =
    useGetPaymentsByCollectionQuery(collectionId);

  const [closeCollection, { isLoading: closing }] =
    useCloseCollectionMutation();
  const [updateCollection] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: deleting }] =
    useDeleteCollectionMutation();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ===== CALCULATIONS =====
  const totalDue = useMemo(
    () => collection?.target_amount ?? members.reduce((sum, m: any) => sum + Number(m.amount_due), 0),
    [collection?.target_amount, members]
  );

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount_paid), 0),
    [payments]
  );

  const paymentMap = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => {
      map[p.collection_member_id] =
        (map[p.collection_member_id] || 0) + Number(p.amount_paid);
    });
    return map;
  }, [payments]);

  const filteredMembers = useMemo(() => {
    return members.filter((m: any) => {
      const paid = paymentMap[m.id] || 0;
      const due = Number(m.amount_due);

      switch (filter) {
        case 'paid':
          return paid >= due;
        case 'partial':
          return paid > 0 && paid < due;
        case 'pending':
          return paid === 0;
        case 'overdue':
          return paid === 0;
        default:
          return true;
      }
    });
  }, [members, paymentMap, filter]);

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'partial', label: 'Partial' },
    { key: 'pending', label: 'Pending' },
    { key: 'overdue', label: 'Overdue' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Badge
              label={collection?.status ?? 'active'}
              color={
                (collection?.status ?? 'active') === 'active'
                  ? colors.secondary
                  : colors.textMuted
              }
            />
          </View>

          <Text style={styles.title}>
            {collection?.name ?? 'Collection'}
          </Text>

          <Text style={styles.date}>
            {formatDate(collection?.created_at ?? '')}
          </Text>

          {/* ACTIONS */}
          {collection?.status === 'active' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => {
                  setEditName(collection?.name ?? '');
                  setEditing(true);
                }}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDeleteModal(true)}
              >
                <Text
                  style={[styles.actionText, { color: colors.danger }]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* PROGRESS */}
        <View style={styles.ringContainer}>
          <ProgressRing
            collected={totalPaid}
            total={totalDue}
            size={160}
            strokeWidth={10}
          />
        </View>

        {/* TOTALS */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalValue}>
            Collected: {formatCurrency(totalPaid)}
          </Text>
          <Text style={styles.totalValue}>
            Target Amount: {formatCurrency(totalDue)}
          </Text>
        </View>

        {/* FILTER TABS */}
        <View style={styles.tabsRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tab,
                filter === t.key && styles.tabActive,
              ]}
              onPress={() => setFilter(t.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === t.key && styles.tabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MEMBERS */}
        {filteredMembers.map((member: any, i: number) => {
          const paid = paymentMap[member.id] || 0;

          return (
            <Animated.View
              key={member.id}
              entering={FadeInUp.delay(i * 50)}
            >
              <PaymentRow
                name={member.villagers?.name ?? 'Villager'}
                amountDue={Number(member.amount_due)}
                totalPaid={paid}
                onPress={() =>
                  navigation.navigate('VillagerPaymentDetail', {
                    memberId: member.id,
                  })
                }
              />
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* CLOSE BUTTON */}
      {collection?.status === 'active' && (
        <View style={styles.footer}>
          <Button
            title="Close Collection"
            onPress={async () => {
              try {
                await closeCollection(collectionId).unwrap();
              } catch (err: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to close collection',
                });
              }
            }}
            loading={closing}
            variant="danger"
            fullWidth
          />
        </View>
      )}

      {/* ===== PREMIUM DELETE MODAL ===== */}
      <Modal visible={showDeleteModal} transparent>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowDeleteModal(false)}
          />

          <Animated.View
            entering={ZoomIn}
            exiting={ZoomOut}
            style={styles.modalBox}
          >
            <Text style={styles.modalTitle}>Delete Collection</Text>

            <Text style={styles.modalText}>
              This action cannot be undone.
            </Text>

            <Text style={styles.modalHighlight}>
              "{collection?.name}"
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelTextModal}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  styles.deleteBtn,
                  deleting && { opacity: 0.6 },
                ]}
                disabled={deleting}
                onPress={async () => {
                  try {
                    await deleteCollection(collectionId).unwrap();

                    Toast.show({
                      type: 'success',
                      text1: 'Collection deleted',
                    });

                    setShowDeleteModal(false);
                    navigation.goBack();
                  } catch {
                    Toast.show({
                      type: 'error',
                      text1: 'Failed to delete',
                    });
                  }
                }}
              >
                <Text style={styles.deleteText}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },

  backText: { color: colors.primary },

  title: {
    fontSize: 26,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
  },

  date: {
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: spacing.xl,
    marginTop: 10,
  },

  actionText: { color: colors.primary },

  ringContainer: { alignItems: 'center', marginVertical: 30 },

  totalsRow: {
    alignItems: 'center',
    marginBottom: 20,
  },

  totalValue: { color: colors.textPrimary },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: 10,
  },

  tab: {
    padding: 8,
    backgroundColor: '#222',
    borderRadius: 20,
  },

  tabActive: {
    backgroundColor: colors.primary + '20',
  },

  tabText: { color: '#aaa' },
  tabTextActive: { color: colors.primary },

  footer: { padding: 20 },

  /* ===== MODAL ===== */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: '85%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },

  modalText: {
    color: colors.textMuted,
    marginTop: 8,
  },

  modalHighlight: {
    color: colors.primary,
    marginVertical: 10,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },

  modalBtn: {
    padding: 10,
    borderRadius: 8,
  },

  cancelBtn: {
    backgroundColor: '#222',
  },

  deleteBtn: {
    backgroundColor: '#330000',
  },

  cancelTextModal: {
    color: '#aaa',
  },

  deleteText: {
    color: 'red',
  },
});

// import React, { useMemo, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
// import Animated, { FadeInUp } from 'react-native-reanimated';
// import { colors } from '../../constants/colors';
// import { fonts } from '../../constants/fonts';
// import { spacing, borderRadius } from '../../constants/spacing';
// import { Card, Badge, Button } from '../../components/common';
// import { ProgressRing, PaymentRow } from '../../components/collections';
// import {
//   useGetCollectionQuery,
//   useGetCollectionMembersWithVillagersQuery,
//   useGetPaymentsByCollectionQuery,
//   useCloseCollectionMutation,
//   useUpdateCollectionMutation,
//   useDeleteCollectionMutation,
// } from '../../store/api/supabaseApi';
// import Toast from 'react-native-toast-message';
// import { formatCurrency } from '../../utils/currency';
// import { formatDate } from '../../utils/dates';

// type FilterType = 'all' | 'paid' | 'partial' | 'pending' | 'overdue';

// export function CollectionDetailScreen({ route, navigation }: any) {
//   const { collectionId } = route.params;
//   const { data: collection } = useGetCollectionQuery(collectionId);
//   const { data: members = [] } = useGetCollectionMembersWithVillagersQuery(collectionId);
//   const { data: payments = [] } = useGetPaymentsByCollectionQuery(collectionId);
//   const [closeCollection, { isLoading: closing }] = useCloseCollectionMutation();
//   const [updateCollection, { isLoading: updating }] = useUpdateCollectionMutation();
//   const [deleteCollection, { isLoading: deleting }] = useDeleteCollectionMutation();
//   const [editing, setEditing] = useState(false);
//   const [editName, setEditName] = useState('');
//   const [filter, setFilter] = useState<FilterType>('all');
//   const [confirmDelete, setConfirmDelete] = useState(false);

//   const totalDue = useMemo(
//     () => members.reduce((sum, m: any) => sum + Number(m.amount_due), 0),
//     [members]
//   );

//   const totalPaid = useMemo(
//     () => payments.reduce((sum, p) => sum + Number(p.amount_paid), 0),
//     [payments]
//   );

//   const paymentMap = useMemo(() => {
//     const map: Record<string, number> = {};
//     payments.forEach((p) => {
//       map[p.collection_member_id] = (map[p.collection_member_id] || 0) + Number(p.amount_paid);
//     });
//     return map;
//   }, [payments]);

//   const filteredMembers = useMemo(() => {
//     return members.filter((m: any) => {
//       const paid = paymentMap[m.id] || 0;
//       const due = Number(m.amount_due);
//       switch (filter) {
//         case 'paid': return paid >= due;
//         case 'partial': return paid > 0 && paid < due;
//         case 'pending': return paid === 0;
//         case 'overdue': return paid === 0;
//         default: return true;
//       }
//     });
//   }, [members, paymentMap, filter]);

//   const tabs: { key: FilterType; label: string }[] = [
//     { key: 'all', label: 'All' },
//     { key: 'paid', label: 'Paid' },
//     { key: 'partial', label: 'Partial' },
//     { key: 'pending', label: 'Pending' },
//     { key: 'overdue', label: 'Overdue' },
//   ];

//   return (
//     <View style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <Animated.View entering={FadeInUp.duration(400)}>
//           <View style={styles.header}>
//             <TouchableOpacity onPress={() => navigation.goBack()}>
//               <Text style={styles.backText}>← Back</Text>
//             </TouchableOpacity>
//             <Badge
//               label={collection?.status ?? 'active'}
//               color={(collection?.status ?? 'active') === 'active' ? colors.secondary : colors.textMuted}
//             />
//           </View>

//           <Text style={styles.title}>{collection?.name ?? 'Collection'}</Text>
//           <Badge
//             label={(collection?.type ?? 'recurring') === 'recurring' ? 'Monthly' : 'One-time'}
//             color={colors.primary}
//           />
//           <Text style={styles.date}>{formatDate(collection?.created_at ?? new Date().toISOString())}</Text>

//           {collection?.status === 'active' && (
//             <View style={styles.actionRow}>
//               {editing ? (
//                 <View style={styles.editRow}>
//                   <TextInput
//                     style={styles.editInput}
//                     value={editName}
//                     onChangeText={setEditName}
//                     placeholder="Collection name"
//                     placeholderTextColor={colors.textMuted}
//                   />
//                   <TouchableOpacity
//                     onPress={async () => {
//                       if (!editName.trim()) return;
//                       try {
//                         await updateCollection({ id: collectionId, name: editName.trim() }).unwrap();
//                         Toast.show({ type: 'success', text1: 'Collection renamed' });
//                         setEditing(false);
//                       } catch (err: any) {
//                         Toast.show({ type: 'error', text1: err?.message ?? 'Failed to rename' });
//                       }
//                     }}
//                   >
//                     <Text style={styles.actionText}>Save</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity onPress={() => setEditing(false)}>
//                     <Text style={[styles.actionText, { color: colors.textMuted }]}>Cancel</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : (
//                 <>
//                   <TouchableOpacity
//                     onPress={() => {
//                       setEditName(collection?.name ?? '');
//                       setEditing(true);
//                     }}
//                   >
//                     <Text style={styles.actionText}>Edit</Text>
//                   </TouchableOpacity>
//                   {confirmDelete ? (
//                     <View style={styles.confirmRow}>
//                       <Text style={styles.confirmText}>Delete "{collection?.name}"?</Text>
//                       <TouchableOpacity
//                         onPress={async () => {
//                           try {
//                             await deleteCollection(collectionId).unwrap();
//                             Toast.show({ type: 'success', text1: 'Collection deleted' });
//                             navigation.goBack();
//                           } catch (err: any) {
//                             Toast.show({ type: 'error', text1: err?.message ?? 'Failed to delete' });
//                           }
//                         }}
//                       >
//                         <Text style={[styles.actionText, { color: colors.danger }]}>Yes</Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity onPress={() => setConfirmDelete(false)}>
//                         <Text style={[styles.actionText, { color: colors.textMuted }]}>No</Text>
//                       </TouchableOpacity>
//                     </View>
//                   ) : (
//                     <TouchableOpacity onPress={() => setConfirmDelete(true)}>
//                       <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
//                     </TouchableOpacity>
//                   )}
//                 </>
//               )}
//             </View>
//           )}
//         </Animated.View>

//         <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.ringContainer}>
//           <ProgressRing collected={totalPaid} total={totalDue} size={160} strokeWidth={10} />
//         </Animated.View>

//         <Animated.View entering={FadeInUp.delay(150).duration(400)}>
//           <View style={styles.totalsRow}>
//             <View style={styles.totalItem}>
//               <Text style={styles.totalLabel}>Expected</Text>
//               <Text style={styles.totalValue}>{formatCurrency(totalDue)}</Text>
//             </View>
//             <View style={styles.totalItem}>
//               <Text style={styles.totalLabel}>Collected</Text>
//               <Text style={[styles.totalValue, { color: colors.secondary }]}>{formatCurrency(totalPaid)}</Text>
//             </View>
//             <View style={styles.totalItem}>
//               <Text style={styles.totalLabel}>Pending</Text>
//               <Text style={[styles.totalValue, { color: colors.warning }]}>{formatCurrency(totalDue - totalPaid)}</Text>
//             </View>
//           </View>
//         </Animated.View>

//         <View style={styles.tabsRow}>
//           {tabs.map((t) => (
//             <TouchableOpacity
//               key={t.key}
//               style={[styles.tab, filter === t.key && styles.tabActive]}
//               onPress={() => setFilter(t.key)}
//             >
//               <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {filteredMembers.map((member: any, i: number) => {
//           const paid = paymentMap[member.id] || 0;
//           const villagerName = member.villagers?.name ?? 'Villager';
//           return (
//             <Animated.View key={member.id} entering={FadeInUp.delay(i * 50).duration(300)}>
//               <PaymentRow
//                 name={villagerName}
//                 amountDue={Number(member.amount_due)}
//                 totalPaid={paid}
//                 onPress={() => navigation.navigate('VillagerPaymentDetail', { memberId: member.id })}
//               />
//             </Animated.View>
//           );
//         })}
//       </ScrollView>

//       {collection?.status === 'active' && (
//         <View style={styles.footer}>
//           <Button
//             title="Close Collection"
//             onPress={async () => {
//               try {
//                 await closeCollection(collectionId).unwrap();
//               } catch (err: any) {
//                 Toast.show({ type: 'error', text1: err?.message ?? err?.error ?? 'Failed to close collection' });
//               }
//             }}
//             loading={closing}
//             variant="danger"
//             fullWidth
//           />
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   scrollContent: {
//     paddingBottom: 100,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: spacing.xl,
//     paddingTop: spacing.huge,
//     paddingBottom: spacing.sm,
//   },
//   backText: {
//     fontFamily: fonts.poppins.medium,
//     fontSize: 14,
//     color: colors.primary,
//   },
//   title: {
//     fontFamily: fonts.poppins.bold,
//     fontSize: 26,
//     color: colors.textPrimary,
//     paddingHorizontal: spacing.xl,
//     marginBottom: spacing.xs,
//   },
//   date: {
//     fontFamily: fonts.inter.regular,
//     fontSize: 12,
//     color: colors.textMuted,
//     paddingHorizontal: spacing.xl,
//     marginTop: spacing.sm,
//   },
//   ringContainer: {
//     alignItems: 'center',
//     paddingVertical: spacing.xxl,
//   },
//   totalsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingHorizontal: spacing.xl,
//     marginBottom: spacing.xxl,
//   },
//   totalItem: {
//     alignItems: 'center',
//   },
//   totalLabel: {
//     fontFamily: fonts.inter.regular,
//     fontSize: 11,
//     color: colors.textMuted,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//     marginBottom: spacing.xs,
//   },
//   totalValue: {
//     fontFamily: fonts.jetbrainsMono.medium,
//     fontSize: 16,
//     color: colors.textPrimary,
//   },
//   tabsRow: {
//     flexDirection: 'row',
//     paddingHorizontal: spacing.xl,
//     marginBottom: spacing.md,
//     gap: spacing.sm,
//   },
//   tab: {
//     paddingVertical: spacing.sm,
//     paddingHorizontal: spacing.md,
//     borderRadius: borderRadius.full,
//     backgroundColor: 'rgba(255,255,255,0.05)',
//   },
//   tabActive: {
//     backgroundColor: colors.primary + '20',
//   },
//   tabText: {
//     fontFamily: fonts.poppins.medium,
//     fontSize: 12,
//     color: colors.textMuted,
//   },
//   tabTextActive: {
//     color: colors.primary,
//   },
//   actionRow: {
//     flexDirection: 'row',
//     paddingHorizontal: spacing.xl,
//     marginTop: spacing.md,
//     gap: spacing.lg,
//   },
//   editRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     gap: spacing.sm,
//   },
//   editInput: {
//     flex: 1,
//     fontFamily: fonts.poppins.medium,
//     fontSize: 14,
//     color: colors.textPrimary,
//     backgroundColor: 'rgba(255,255,255,0.05)',
//     borderWidth: 1,
//     borderColor: colors.primary + '40',
//     borderRadius: borderRadius.sm,
//     paddingHorizontal: spacing.md,
//     paddingVertical: spacing.sm,
//   },
//   confirmRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: spacing.sm,
//   },
//   confirmText: {
//     fontFamily: fonts.poppins.medium,
//     fontSize: 13,
//     color: colors.textMuted,
//     flex: 1,
//   },
//   actionText: {
//     fontFamily: fonts.poppins.medium,
//     fontSize: 14,
//     color: colors.primary,
//   },
//   footer: {
//     paddingHorizontal: spacing.xl,
//     paddingVertical: spacing.lg,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255,255,255,0.06)',
//   },
// });
