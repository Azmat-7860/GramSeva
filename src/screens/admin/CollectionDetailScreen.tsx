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
  Share,
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
import { Badge } from '../../components/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressRing, PaymentRow } from '../../components/collections';
import {
  useGetCollectionQuery,
  useGetCollectionMembersWithVillagersQuery,
  useGetPaymentsByCollectionQuery,
  useCloseCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useGetVillagersQuery,
  useGetCollectorsQuery,
  useGetCollectionCollectorsQuery,
  useAddCollectorToCollectionMutation,
  useRemoveCollectorFromCollectionMutation,
  useAddCollectionMemberMutation,
  useStartNewCycleMutation,
  useUpdateCollectionMemberMutation,
} from '../../store/api/supabaseApi';
import { useAppSelector } from '../../store/store';
import { supabase } from '../../store/supabaseClient';
import Toast from 'react-native-toast-message';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';

type FilterType = 'all' | 'paid' | 'partial' | 'pending' | 'overdue';

export function CollectionDetailScreen({ route, navigation }: any) {
  const { collectionId } = route.params;
  const { villageId } = useAppSelector((state) => state.auth);

  const { data: collection } = useGetCollectionQuery(collectionId);
  const { data: members = [] } =
    useGetCollectionMembersWithVillagersQuery(collectionId);
  const { data: payments = [] } =
    useGetPaymentsByCollectionQuery({
      collectionId,
      monthLabel: collection?.current_month_label ?? undefined,
    });

  const [closeCollection, { isLoading: closing }] =
    useCloseCollectionMutation();
  const [updateCollection] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: deleting }] =
    useDeleteCollectionMutation();
  const { data: allCollectors = [] } = useGetCollectorsQuery(villageId ?? '');
  const { data: allVillagers = [] } = useGetVillagersQuery(villageId ?? '');
  const { data: assignedCollectors = [] } = useGetCollectionCollectorsQuery(collectionId);
  const [addCollectorToCollection] = useAddCollectorToCollectionMutation();
  const [removeCollectorFromCollection] = useRemoveCollectorFromCollectionMutation();
  const [addCollectionMember, { isLoading: addingMember }] = useAddCollectionMemberMutation();
  const [startNewCycle, { isLoading: cycleLoading }] = useStartNewCycleMutation();
  const [updateMember] = useUpdateCollectionMemberMutation();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCollectorModal, setShowCollectorModal] = useState(false);
  const [showVillagerModal, setShowVillagerModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [startingCycle, setStartingCycle] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editWarning, setEditWarning] = useState('');
  const [newVillagerAmount, setNewVillagerAmount] = useState<Record<string, string>>({});

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

  const lastPaymentInfo = useMemo(() => {
    const info: Record<string, { date: string; collectorName: string | null }> = {};
    payments.forEach((p: any) => {
      const existing = info[p.collection_member_id];
      if (!existing || p.paid_at > existing.date) {
        info[p.collection_member_id] = {
          date: p.paid_at,
          collectorName: p.collectors?.name ?? null,
        };
      }
    });
    return info;
  }, [payments]);

  const existingVillagerIds = useMemo(
    () => new Set(members.map((m: any) => m.villager_id)),
    [members]
  );

  const unassignedVillagers = useMemo(
    () => allVillagers.filter((v) => !existingVillagerIds.has(v.id)),
    [allVillagers, existingVillagerIds]
  );

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

  const handleAddVillager = async (villagerId: string) => {
    const amount = newVillagerAmount[villagerId];
    if (!amount) {
      Toast.show({ type: 'error', text1: 'Please enter an amount' });
      return;
    }
    try {
      await addCollectionMember({
        collection_id: collectionId,
        villager_id: villagerId,
        amount_due: parseFloat(amount),
      }).unwrap();
      setNewVillagerAmount((prev) => {
        const next = { ...prev };
        delete next[villagerId];
        return next;
      });
      Toast.show({ type: 'success', text1: 'Villager added to collection' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message ?? 'Failed to add villager' });
    }
  };

  const handleShare = async () => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const cName = collection?.name ?? 'Collection';

    const lines = members.map((m: any) => {
      const paid = paymentMap[m.id] || 0;
      const due = Number(m.amount_due);
      const status = paid >= due ? '✅ Paid' : paid > 0 ? '🟡 Partial' : '❌ Not paid';
      return `${m.villagers?.name ?? 'Unknown'} — ${status}`;
    });

    const summary = [
      `📅 ${today}`,
      `📍 ${cName}`,
      '',
      ...lines,
      '',
      `───`,
      `💰 Total Collected: ${formatCurrency(totalPaid)}`,
      `📊 Total Pending: ${formatCurrency(Math.max(0, totalDue - totalPaid))}`,
    ].join('\n');

    try {
      await Share.share({ message: summary });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.title}>
            {collection?.name ?? 'Collection'}
          </Text>

          <View style={styles.badgesRow}>
            {collection?.type && (
              <Badge
                label={collection.type === 'recurring' ? 'Recurring' : 'One-time'}
                color={colors.primary}
              />
            )}
            <Badge
              label={collection?.status ?? 'active'}
              color={
                (collection?.status ?? 'active') === 'active'
                  ? colors.secondary
                  : colors.textMuted
              }
            />
          </View>

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

              {collection?.type === 'recurring' && (
                <>
                  <Text style={styles.actionDivider}>|</Text>
                  <TouchableOpacity onPress={() => setShowCycleModal(true)}>
                    <Text style={[styles.actionText, { color: colors.secondary }]}>
                      Start New Cycle
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.actionDivider}>|</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('CollectionHistory', { collectionId })}>
                    <Text style={[styles.actionText, { color: colors.primary }]}>History</Text>
                  </TouchableOpacity>
                </>
              )}
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

        {/* ASSIGNED COLLECTORS */}
        {collection?.status === 'active' && (
          <Animated.View entering={FadeInUp.delay(100).duration(400)}
            style={styles.collectorsSection}>
            <View style={styles.collectorsHeaderRow}>
              <Text style={styles.sectionLabel}>
                Assigned Collectors ({assignedCollectors.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowCollectorModal(true)}
                style={styles.addSmallBtn}
              >
                <Text style={styles.addSmallBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {assignedCollectors.length === 0 ? (
              <Text style={styles.emptyCollectors}>
                No collectors assigned yet
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectorChipsRow}>
                {assignedCollectors.map((ac: any) => (
                  <View key={ac.id} style={styles.collectorChip}>
                    <Text style={styles.collectorChipName}>
                      {ac.collectors?.name ?? 'Collector'}
                    </Text>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          await removeCollectorFromCollection(ac.id).unwrap();
                        } catch {
                          Toast.show({ type: 'error', text1: 'Failed to remove collector' });
                        }
                      }}
                      style={styles.collectorChipRemove}
                    >
                      <Text style={styles.collectorChipRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        )}

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
          const lastInfo = lastPaymentInfo[member.id];

          return (
            <Animated.View
              key={member.id}
              entering={FadeInUp.delay(i * 50)}
            >
              <View style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <PaymentRow
                    name={member.villagers?.name ?? 'Villager'}
                    amountDue={Number(member.amount_due)}
                    totalPaid={paid}
                    lastPaymentDate={lastInfo?.date}
                    collectorName={lastInfo?.collectorName ?? undefined}
                  />
                </View>
                {collection?.status === 'active' && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditMemberId(member.id);
                      setEditAmount(String(member.amount_due));
                    }}
                    style={styles.editBtn}
                  >
                    <MaterialCommunityIcons name="pencil" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          );
        })}

        {/* EDIT AMOUNT MODAL */}
        <Modal visible={!!editMemberId} transparent>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditMemberId(null)} />
            <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.modalBox}>
              {(() => {
                const editMember = editMemberId ? members.find((m: any) => m.id === editMemberId) : null;
                if (!editMember) return null;
                const editPaid = paymentMap[editMemberId!] || 0;
                const editOldDue = Number(editMember.amount_due);
                const newVal = parseFloat(editAmount || '0');
                return (
                  <>
                    <Text style={styles.modalTitle}>Edit Amount Due</Text>
                    <Text style={styles.modalText}>
                      Villager: {editMember.villagers?.name ?? 'Unknown'}
                    </Text>
                    <View style={styles.editInfoRow}>
                      <View style={styles.editInfoItem}>
                        <Text style={styles.editInfoLabel}>Current Due</Text>
                        <Text style={styles.editInfoValue}>{formatCurrency(editOldDue)}</Text>
                      </View>
                      <View style={styles.editInfoItem}>
                        <Text style={styles.editInfoLabel}>Paid So Far</Text>
                        <Text style={styles.editInfoValue}>{formatCurrency(editPaid)}</Text>
                      </View>
                    </View>
                    <Text style={styles.inputLabel}>New Amount</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editAmount}
                      onChangeText={(val) => {
                        if (/^\d*$/.test(val)) {
                          setEditAmount(val);
                          const parsed = parseFloat(val || '0');
                          if (parsed <= 0) {
                            setEditWarning('Amount must be greater than 0');
                          } else if (parsed < editPaid) {
                            setEditWarning(`Member has already paid ${formatCurrency(editPaid)}. Setting amount lower will show them as overpaid.`);
                          } else {
                            setEditWarning('');
                          }
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                      placeholderTextColor={colors.textMuted}
                      autoFocus
                    />
                    {editWarning ? (
                      <Text style={styles.editWarning}>{editWarning}</Text>
                    ) : null}
                    <View style={styles.modalActions}>
                      <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setEditMemberId(null)}>
                        <Text style={styles.cancelTextModal}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalBtn, { backgroundColor: colors.primary + '20' }]}
                        onPress={async () => {
                          if (!editAmount || !editMemberId) return;
                          const parsed = parseFloat(editAmount);
                          if (!parsed || parsed <= 0) {
                            Toast.show({ type: 'error', text1: 'Amount must be greater than 0' });
                            return;
                          }
                          try {
                            await updateMember({ id: editMemberId, amount_due: parsed }).unwrap();
                            Toast.show({ type: 'success', text1: 'Amount updated' });
                            setEditMemberId(null);
                            setEditWarning('');
                          } catch (err: any) {
                            Toast.show({ type: 'error', text1: err?.message ?? 'Failed to update' });
                          }
                        }}
                      >
                        <Text style={{ color: colors.primary, fontFamily: fonts.poppins.medium }}>Save</Text>
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* COLLECTOR PICKER MODAL */}
        <Modal visible={showCollectorModal} transparent>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCollectorModal(false)} />
            <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add Collector</Text>
              {allCollectors
                .filter((c) => !assignedCollectors.find((ac: any) => ac.collector_id === c.id))
                .map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                    onPress={async () => {
                      try {
                        await addCollectorToCollection({ collection_id: collectionId, collector_id: c.id }).unwrap();
                        setShowCollectorModal(false);
                      } catch {
                        Toast.show({ type: 'error', text1: 'Failed to add collector' });
                      }
                    }}>
                    <Text style={{ fontFamily: fonts.poppins.medium, fontSize: 15, color: colors.textPrimary }}>{c.name}</Text>
                    <Text style={{ fontFamily: fonts.inter.regular, fontSize: 12, color: colors.textMuted }}>{c.phone}</Text>
                  </TouchableOpacity>
                ))}
              {allCollectors.filter((c) => !assignedCollectors.find((ac: any) => ac.collector_id === c.id)).length === 0 && (
                <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg }}>
                  All collectors already assigned
                </Text>
              )}
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* VILLAGER PICKER MODAL */}
        <Modal visible={showVillagerModal} transparent>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowVillagerModal(false)} />
            <Animated.View entering={ZoomIn} exiting={ZoomOut} style={[styles.modalBox, styles.villagerModalBox]}>
              <Text style={styles.modalTitle}>Add Villagers</Text>

              {unassignedVillagers.length === 0 ? (
                <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg }}>
                  All villagers are already in this collection
                </Text>
              ) : (
                <ScrollView style={styles.villagerModalList}>
                  {unassignedVillagers.map((v) => (
                    <View key={v.id} style={styles.villagerModalRow}>
                      <View style={styles.villagerModalInfo}>
                        <Text style={styles.villagerModalName}>{v.name}</Text>
                        <Text style={styles.villagerModalPhone}>{v.phone}</Text>
                      </View>
                      <TextInput
                        style={styles.villagerModalInput}
                        placeholder="Amount"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={newVillagerAmount[v.id] || ''}
                        onChangeText={(val) =>
                          /^\d*$/.test(val) &&
                          setNewVillagerAmount((prev) => ({ ...prev, [v.id]: val }))
                        }
                      />
                      <TouchableOpacity
                        style={[
                          styles.villagerModalAddBtn,
                          !newVillagerAmount[v.id] && { opacity: 0.4 },
                        ]}
                        disabled={!newVillagerAmount[v.id]}
                        onPress={() => handleAddVillager(v.id)}
                      >
                        <Text style={styles.villagerModalAddText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </Animated.View>
          </Animated.View>
        </Modal>
      </ScrollView>

      {/* STATS FOOTER */}
      {members.length > 0 && (
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.statsFooter}>
            {collection?.status === 'active' && (
              <>
                <TouchableOpacity
                  style={styles.footerActionBtn}
                  onPress={() => setShowCloseModal(true)}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color={colors.danger} />
                  <Text style={[styles.footerActionText, { color: colors.danger }]}>Close</Text>
                </TouchableOpacity>
                <View style={styles.footerDivider} />
              </>
            )}
            <TouchableOpacity
              style={styles.footerActionBtn}
              onPress={() => setShowVillagerModal(true)}
              activeOpacity={0.6}
            >
              <Text style={styles.footerActionIcon}>＋</Text>
              <Text style={styles.footerActionText}>Add</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity onPress={handleShare} style={styles.footerActionBtn} activeOpacity={0.6}>
              <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary} />
              <Text style={styles.footerActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ===== CLOSE CONFIRMATION MODAL ===== */}
      <Modal visible={showCloseModal} transparent>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCloseModal(false)} />
          <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Close Collection</Text>
            <Text style={styles.modalText}>
              This will mark "{collection?.name}" as closed. No more payments can be recorded.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowCloseModal(false)}>
                <Text style={styles.cancelTextModal}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.danger + '20' }]}
                onPress={async () => {
                  try {
                    await closeCollection(collectionId).unwrap();
                    Toast.show({ type: 'success', text1: 'Collection closed' });
                    setShowCloseModal(false);
                  } catch {
                    Toast.show({ type: 'error', text1: 'Failed to close collection' });
                  }
                }}
              >
                <Text style={{ color: colors.danger, fontFamily: fonts.poppins.medium }}>Close</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ===== START NEW CYCLE MODAL ===== */}
      <Modal visible={showCycleModal} transparent>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCycleModal(false)} />
          <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Start New Monthly Cycle</Text>
            <Text style={styles.modalText}>
              This will start a new monthly cycle for "{collection?.name}".{'\n\n'}
              • Unpaid amounts will carry forward to next month{'\n'}
              • Members with credit balance will have it deducted{'\n'}
              • All members will owe their base amount + carry-forward
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowCycleModal(false)}>
                <Text style={styles.cancelTextModal}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.secondary + '20' }]}
                disabled={startingCycle}
                onPress={async () => {
                  setStartingCycle(true);
                  try {
                    await startNewCycle(collectionId).unwrap();
                    Toast.show({ type: 'success', text1: 'New cycle started' });
                    setShowCycleModal(false);
                  } catch (err: any) {
                    Toast.show({ type: 'error', text1: err?.message ?? 'Failed to start cycle' });
                  } finally {
                    setStartingCycle(false);
                  }
                }}
              >
                <Text style={{ color: colors.secondary, fontFamily: fonts.poppins.medium }}>
                  {startingCycle ? 'Starting...' : 'Start Cycle'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ===== EDIT NAME MODAL ===== */}
      <Modal visible={editing} transparent>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditing(false)} />
          <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Collection Name</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Collection name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setEditing(false)}>
                <Text style={styles.cancelTextModal}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary + '20' }]}
                onPress={async () => {
                  if (!editName.trim()) return;
                  try {
                    await updateCollection({ id: collectionId, name: editName.trim() }).unwrap();
                    Toast.show({ type: 'success', text1: 'Collection renamed' });
                    setEditing(false);
                  } catch (err: any) {
                    Toast.show({ type: 'error', text1: err?.message ?? 'Failed to rename' });
                  }
                }}
              >
                <Text style={{ color: colors.primary, fontFamily: fonts.poppins.medium }}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

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

  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 26,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
  },

  date: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },

  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },

  actionText: { color: colors.primary, fontFamily: fonts.poppins.medium, fontSize: 14 },
  actionDivider: { color: colors.textMuted, fontFamily: fonts.poppins.medium, fontSize: 14 },

  ringContainer: { alignItems: 'center', marginVertical: spacing.xxl },

  totalsRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  totalValue: { color: colors.textPrimary, fontFamily: fonts.jetbrainsMono.medium, fontSize: 15 },

  // ─── Assigned Collectors ───────────────────
  collectorsSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  collectorsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionLabel: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  addSmallBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },

  addSmallBtnText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    color: colors.primary,
  },

  emptyCollectors: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  collectorChipsRow: {
    flexDirection: 'row',
  },

  collectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },

  collectorChipName: {
    fontFamily: fonts.poppins.medium,
    fontSize: 13,
    color: colors.primary,
    marginRight: spacing.xs,
  },

  collectorChipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  collectorChipRemoveText: {
    color: colors.textMuted,
    fontSize: 10,
  },

  // ─── Member Row ─────────────────────────
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: { flex: 1 },
  editBtn: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },

  // ─── Tabs ─────────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: 10,
    marginBottom: spacing.md,
  },

  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.full,
  },

  tabActive: {
    backgroundColor: colors.primary + '20',
  },

  tabText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    color: colors.textMuted,
  },

  tabTextActive: { color: colors.primary },

  // ─── Stats Footer ──────────────────────
  statsFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: colors.background,
  },

  footerStat: {
    flex: 1,
    alignItems: 'center',
  },

  footerLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },

  footerValue: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },

  footerMuted: {
    color: colors.textMuted,
    fontSize: 12,
  },

  footerDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.xs,
  },

  footerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  footerActionIcon: {
    fontFamily: fonts.poppins.semibold,
    fontSize: 16,
    color: colors.primary,
  },

  footerActionText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 13,
    color: colors.primary,
  },

  // ─── Modal ────────────────────────────────
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
    maxHeight: '70%',
  },

  villagerModalBox: {
    maxHeight: '80%',
  },

  modalTitle: {
    fontFamily: fonts.poppins.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  modalText: {
    color: colors.textMuted,
    marginTop: 8,
    fontFamily: fonts.inter.regular,
  },

  modalHighlight: {
    color: colors.primary,
    marginVertical: 10,
    fontFamily: fonts.poppins.medium,
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
    fontFamily: fonts.poppins.medium,
  },

  deleteText: {
    color: 'red',
    fontFamily: fonts.poppins.medium,
  },

  editInput: {
    fontFamily: fonts.poppins.medium,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginVertical: spacing.md,
  },
  editWarning: {
    color: '#f59e0b',
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  editInfoRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  editInfoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  editInfoLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.poppins.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editInfoValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fonts.poppins.semibold,
    marginTop: spacing.xs,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.poppins.medium,
    marginBottom: spacing.xs,
  },

  // ─── Villager Modal ───────────────────────
  villagerModalList: {
    maxHeight: 400,
  },

  villagerModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: spacing.sm,
  },

  villagerModalInfo: {
    flex: 1,
  },

  villagerModalName: {
    fontFamily: fonts.poppins.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  villagerModalPhone: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  villagerModalInput: {
    fontFamily: fonts.jetbrainsMono.regular,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 80,
    textAlign: 'right',
  },

  villagerModalAddBtn: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  villagerModalAddText: {
    fontFamily: fonts.poppins.medium,
    fontSize: 13,
    color: colors.primary,
  },
});
