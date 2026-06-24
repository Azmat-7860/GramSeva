import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Share,
  Platform,
} from 'react-native';
import Animated, { FadeInUp, FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Badge } from '../../components/common';
import { ProgressRing, PaymentRow } from '../../components/collections';
import {
  useGetCollectionQuery,
  useGetCollectionMembersWithVillagersQuery,
  useGetPaymentsByCollectionQuery,
  useGetCollectionCyclesQuery,
} from '../../store/api/supabaseApi';
import Toast from 'react-native-toast-message';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dates';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type FilterType = 'all' | 'paid' | 'partial' | 'pending' | 'overdue';

function formatMonthLabel(monthLabel: string): string {
  const [year, month] = monthLabel.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function formatDateShort(iso: string | null): string {
  if (!iso) return 'Ongoing';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDuration(start: string, end: string | null): string {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return `${diff} days`;
}

export function CollectionHistoryScreen({ route, navigation }: any) {
  const { collectionId } = route.params;

  const { data: collection } = useGetCollectionQuery(collectionId);
  const { data: cycles = [] } = useGetCollectionCyclesQuery(collectionId);
  const { data: allMembers = [] } = useGetCollectionMembersWithVillagersQuery(collectionId);

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [exporting, setExporting] = useState(false);

  const selectedCycle = useMemo(
    () => cycles.find((c) => c.id === selectedCycleId) ?? cycles[0] ?? null,
    [cycles, selectedCycleId]
  );

  const { data: rawPayments = [] } = useGetPaymentsByCollectionQuery({
    collectionId,
    monthLabel: selectedCycle?.month_label ?? undefined,
  });

  const snapshots = useMemo(() => {
    if (!selectedCycle?.member_snapshots) return [];
    if (typeof selectedCycle.member_snapshots === 'string') {
      try { return JSON.parse(selectedCycle.member_snapshots); }
      catch { return []; }
    }
    return selectedCycle.member_snapshots;
  }, [selectedCycle]);

  const paymentMap = useMemo(() => {
    const map: Record<string, number> = {};
    rawPayments.forEach((p) => {
      map[p.collection_member_id] = (map[p.collection_member_id] || 0) + Number(p.amount_paid);
    });
    return map;
  }, [rawPayments]);

  const lastPaymentInfo = useMemo(() => {
    const info: Record<string, { date: string; collectorName: string | null }> = {};
    rawPayments.forEach((p: any) => {
      const existing = info[p.collection_member_id];
      if (!existing || p.paid_at > existing.date) {
        info[p.collection_member_id] = {
          date: p.paid_at,
          collectorName: p.collectors?.name ?? null,
        };
      }
    });
    return info;
  }, [rawPayments]);

  const totalPaid = useMemo(
    () => rawPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0),
    [rawPayments]
  );

  const totalDue = selectedCycle?.total_due ?? 0;

  const cycleMembers = useMemo(() => {
    if (snapshots.length > 0) {
      return snapshots.map((s: any) => {
        const paid = paymentMap[s.member_id] || 0;
        return { ...s, paid };
      });
    }
    return allMembers.map((m: any) => {
      const paid = paymentMap[m.id] || 0;
      return {
        member_id: m.id,
        villager_name: m.villagers?.name ?? 'Unknown',
        amount_due: Number(m.amount_due),
        paid,
      };
    });
  }, [snapshots, allMembers, paymentMap]);

  const filteredMembers = useMemo(() => {
    return cycleMembers.filter((m: any) => {
      const paid = m.paid || 0;
      const due = Number(m.amount_due);
      switch (filter) {
        case 'paid': return paid >= due;
        case 'partial': return paid > 0 && paid < due;
        case 'pending': return paid === 0;
        case 'overdue': return paid === 0;
        default: return true;
      }
    });
  }, [cycleMembers, filter]);

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'partial', label: 'Partial' },
    { key: 'pending', label: 'Pending' },
    { key: 'overdue', label: 'Overdue' },
  ];

  const paidCount = cycleMembers.filter((m: any) => m.paid >= Number(m.amount_due)).length;
  const partialCount = cycleMembers.filter((m: any) => m.paid > 0 && m.paid < Number(m.amount_due)).length;
  const pendingCount = cycleMembers.filter((m: any) => m.paid === 0).length;

  const formatMonthWithDate = (cycle: any): string => {
    const label = formatMonthLabel(cycle.month_label);
    const start = formatDateShort(cycle.started_at);
    const end = formatDateShort(cycle.closed_at);
    return `${label} (${start} → ${end})`;
  };

  const buildTextSummary = (): string => {
    const lines: string[] = [];
    lines.push(`📅 ${collection?.name ?? 'Collection'} — ${selectedCycle ? formatMonthLabel(selectedCycle.month_label) : ''}`);
    if (selectedCycle) {
      lines.push(`📆 ${formatDateShort(selectedCycle.started_at)} → ${formatDateShort(selectedCycle.closed_at)} (${getDuration(selectedCycle.started_at, selectedCycle.closed_at)})`);
    }
    lines.push(`💰 Collected: ${formatCurrency(totalPaid)} / Due: ${formatCurrency(totalDue)}`);
    lines.push(`📊 Pending: ${formatCurrency(Math.max(0, totalDue - totalPaid))}`);
    lines.push('');
    lines.push('Member Status:');
    cycleMembers.forEach((m: any) => {
      const paid = m.paid || 0;
      const due = Number(m.amount_due);
      const status = paid >= due ? '✅' : paid > 0 ? '🟡' : '◉';
      const lastInfo = lastPaymentInfo[m.member_id];
      const collectorStr = lastInfo?.collectorName ? ` (${lastInfo.collectorName})` : '';
      lines.push(`${status} ${m.villager_name} — ${formatCurrency(paid)} / ${formatCurrency(due)}${paid > 0 ? ` Paid${collectorStr}` : ' Pending'}`);
    });
    lines.push('');
    lines.push(`─── Summary ───`);
    lines.push(`Members: ${cycleMembers.length} · Paid: ${paidCount} · Partial: ${partialCount} · Pending: ${pendingCount}`);
    lines.push(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
    return lines.join('\n');
  };

  const buildHtmlReport = (): string => {
    const rows = cycleMembers.map((m: any) => {
      const paid = m.paid || 0;
      const due = Number(m.amount_due);
      const status = paid >= due ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
      const lastInfo = lastPaymentInfo[m.member_id];
      const dateStr = lastInfo?.date ? formatDate(lastInfo.date) : '-';
      const collectorStr = lastInfo?.collectorName ?? '-';
      return `<tr><td>${m.villager_name}</td><td>₹${due}</td><td>₹${paid}</td><td>${status}</td><td>${dateStr}</td><td>${collectorStr}</td></tr>`;
    }).join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .sub { color: #666; font-size: 14px; margin-bottom: 20px; }
            .summary { display: flex; gap: 20px; margin-bottom: 24px; }
            .card { background: #f5f5f5; border-radius: 8px; padding: 16px; flex: 1; text-align: center; }
            .card .num { font-size: 24px; font-weight: bold; }
            .card .lbl { font-size: 12px; color: #666; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #6C63FF; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .footer { margin-top: 24px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${collection?.name ?? 'Collection'}</h1>
          <div class="sub">${selectedCycle ? formatMonthLabel(selectedCycle.month_label) : ''} — ${formatDateShort(selectedCycle?.started_at ?? '')} to ${formatDateShort(selectedCycle?.closed_at ?? '')} (${selectedCycle ? getDuration(selectedCycle.started_at, selectedCycle.closed_at) : ''})</div>
          <div class="summary">
            <div class="card"><div class="num">₹${totalPaid}</div><div class="lbl">Collected</div></div>
            <div class="card"><div class="num">₹${totalDue}</div><div class="lbl">Total Due</div></div>
            <div class="card"><div class="num">₹${Math.max(0, totalDue - totalPaid)}</div><div class="lbl">Pending</div></div>
            <div class="card"><div class="num">${cycleMembers.length}</div><div class="lbl">Members</div></div>
          </div>
          <table>
            <tr><th>Name</th><th>Due</th><th>Paid</th><th>Status</th><th>Last Payment</th><th>Collector</th></tr>
            ${rows}
          </table>
          <div class="footer">
            Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — GramSeva
          </div>
        </body>
      </html>
    `;
  };

  const handleExport = async () => {
    if (!selectedCycle) return;
    setExporting(true);
    try {
      const text = buildTextSummary();
      await Share.share({ message: text });

      const html = buildHtmlReport();
      const { uri } = await Print.printToFileAsync({ html });
      const pdfName = `${(collection?.name ?? 'Collection').replace(/\s+/g, '_')}_${selectedCycle.month_label}.pdf`;
      const dest = FileSystem.documentDirectory + pdfName;
      await FileSystem.moveAsync({ from: uri, to: dest });
      Toast.show({ type: 'success', text1: `PDF saved: ${pdfName}` });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        Toast.show({ type: 'error', text1: 'Export failed' });
      }
    } finally {
      setExporting(false);
    }
  };

  if (!selectedCycle) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No cycles found</Text>
          <Text style={styles.emptySubtitle}>Start a new cycle from the collection detail screen.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={handleExport} disabled={exporting} style={styles.shareBtn}>
          <MaterialCommunityIcons name="share-variant" size={22} color={exporting ? colors.textMuted : colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* COLLECTION NAME */}
        <Text style={styles.title}>{collection?.name ?? 'Collection'}</Text>

        {/* CYCLE PICKER */}
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.pickerBtnText}>{formatMonthWithDate(selectedCycle)}</Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </TouchableOpacity>

        {/* CYCLE INFO */}
        <View style={styles.cycleInfoRow}>
          <View style={styles.cycleInfoItem}>
            <Text style={styles.cycleInfoLabel}>Start</Text>
            <Text style={styles.cycleInfoValue}>{formatDateShort(selectedCycle.started_at)}</Text>
          </View>
          <View style={styles.cycleInfoItem}>
            <Text style={styles.cycleInfoLabel}>End</Text>
            <Text style={styles.cycleInfoValue}>{formatDateShort(selectedCycle.closed_at)}</Text>
          </View>
          <View style={styles.cycleInfoItem}>
            <Text style={styles.cycleInfoLabel}>Duration</Text>
            <Text style={styles.cycleInfoValue}>{getDuration(selectedCycle.started_at, selectedCycle.closed_at)}</Text>
          </View>
          <View style={styles.cycleInfoItem}>
            <Text style={styles.cycleInfoLabel}>Status</Text>
            <Badge label={selectedCycle.status} color={selectedCycle.status === 'active' ? colors.secondary : colors.textMuted} size="sm" />
          </View>
        </View>

        {/* PROGRESS */}
        <View style={styles.ringContainer}>
          <ProgressRing collected={totalPaid} total={totalDue} size={160} strokeWidth={10} />
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalValue}>Collected: {formatCurrency(totalPaid)}</Text>
          <Text style={styles.totalValue}>Due: {formatCurrency(totalDue)}</Text>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{cycleMembers.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.secondary }]}>{paidCount}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>{partialCount}</Text>
            <Text style={styles.statLabel}>Partial</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.danger }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* FILTER TABS */}
        <View style={styles.tabsRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, filter === t.key && styles.tabActive]}
              onPress={() => setFilter(t.key)}
            >
              <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MEMBER LIST */}
        {filteredMembers.map((member: any, i: number) => {
          const paid = member.paid || 0;
          const lastInfo = lastPaymentInfo[member.member_id];
          return (
            <Animated.View key={member.member_id} entering={FadeInUp.delay(i * 50)}>
              <PaymentRow
                name={member.villager_name}
                amountDue={Number(member.amount_due)}
                totalPaid={paid}
                lastPaymentDate={lastInfo?.date}
                collectorName={lastInfo?.collectorName ?? undefined}
              />
            </Animated.View>
          );
        })}

        {filteredMembers.length === 0 && (
          <Text style={styles.emptyList}>No members match this filter.</Text>
        )}
      </ScrollView>

      {/* CYCLE PICKER MODAL */}
      <Modal visible={showPicker} transparent>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPicker(false)} />
          <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Cycle</Text>
            <ScrollView style={styles.pickerList}>
              {cycles.map((cycle) => (
                <TouchableOpacity
                  key={cycle.id}
                  style={[styles.pickerItem, cycle.id === selectedCycle.id && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedCycleId(cycle.id);
                    setShowPicker(false);
                  }}
                >
                  <View style={styles.pickerItemLeft}>
                    <Text style={[styles.pickerItemLabel, cycle.id === selectedCycle.id && styles.pickerItemLabelActive]}>
                      {formatMonthLabel(cycle.month_label)}
                    </Text>
                    <Text style={styles.pickerItemDates}>
                      {formatDateShort(cycle.started_at)} → {formatDateShort(cycle.closed_at)}
                    </Text>
                  </View>
                  <Badge
                    label={cycle.status}
                    color={cycle.status === 'active' ? colors.secondary : colors.textMuted}
                    size="sm"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.huge,
  },

  headerTitle: { fontFamily: fonts.poppins.semibold, fontSize: 16, color: colors.textPrimary },
  shareBtn: { padding: spacing.sm },

  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 24,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  // ─── Picker ─────────────────────────
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  pickerBtnText: { fontFamily: fonts.poppins.medium, fontSize: 15, color: colors.textPrimary, flex: 1 },
  pickerArrow: { color: colors.textMuted, fontSize: 12, marginLeft: spacing.sm },

  // ─── Cycle Info ─────────────────────
  cycleInfoRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  cycleInfoItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  cycleInfoLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cycleInfoValue: {
    fontFamily: fonts.poppins.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },

  // ─── Progress ───────────────────────
  ringContainer: { alignItems: 'center', marginVertical: spacing.xl },
  totalsRow: { alignItems: 'center', marginBottom: spacing.lg },
  totalValue: { color: colors.textPrimary, fontFamily: fonts.jetbrainsMono.medium, fontSize: 15 },

  // ─── Stats ──────────────────────────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontFamily: fonts.jetbrainsMono.medium,
    fontSize: 20,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },

  // ─── Tabs ──────────────────────────
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
  tabActive: { backgroundColor: colors.primary + '20' },
  tabText: { fontFamily: fonts.poppins.medium, fontSize: 12, color: colors.textMuted },
  tabTextActive: { color: colors.primary },

  // ─── Empty ─────────────────────────
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.poppins.bold, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySubtitle: { fontFamily: fonts.inter.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  emptyList: { fontFamily: fonts.inter.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },

  // ─── Modal ─────────────────────────
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
  modalTitle: {
    fontFamily: fonts.poppins.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  pickerList: { maxHeight: 400 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerItemActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
  },
  pickerItemLeft: { flex: 1 },
  pickerItemLabel: {
    fontFamily: fonts.poppins.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  pickerItemLabelActive: { color: colors.primary },
  pickerItemDates: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
