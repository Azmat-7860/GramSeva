import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card, Avatar, Button, Input } from '../../components/common';
import { useGetVillagersQuery, useAddVillagerMutation } from '../../store/api/supabaseApi';
import Toast from 'react-native-toast-message';
import { useAppSelector } from '../../store/store';

export function VillagersScreen({ navigation }: any) {
  const { villageId } = useAppSelector((state) => state.auth);
  const { data: villagers = [], error: fetchError } = useGetVillagersQuery(villageId ?? '');
  const [addVillager, { isLoading }] = useAddVillagerMutation();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const filtered = villagers.filter(
    (v) => v.name.toLowerCase().includes(search.toLowerCase()) || v.phone.includes(search)
  );

  const handleAdd = async () => {
    if (!name || !phone || !villageId) return;
    try {
      await addVillager({ name, phone, village_id: villageId }).unwrap();
      setName('');
      setPhone('');
      setModalVisible(false);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message ?? err?.error ?? 'Failed to add villager' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Villagers</Text>
        <Text style={styles.count}>{villagers.length} total</Text>
      </View>

      <Input
        placeholder="Search villagers..."
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.searchBox}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.map((v, i) => (
          <Animated.View key={v.id} entering={FadeInUp.delay(i * 30).duration(300)}>
            <TouchableOpacity style={styles.villagerRow}>
              <Avatar name={v.name} size={40} />
              <View style={styles.villagerInfo}>
                <Text style={styles.villagerName}>{v.name}</Text>
                <Text style={styles.villagerPhone}>{v.phone}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Villager</Text>
            <Input label="Name" placeholder="Villager name" value={name} onChangeText={setName} />
            <Input label="Phone" placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="ghost" style={{ flex: 1 }} />
              <Button title="Add" onPress={handleAdd} loading={isLoading} disabled={!name || !phone} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.poppins.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  count: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  searchBox: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  villagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  villagerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  villagerName: {
    fontFamily: fonts.poppins.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  villagerPhone: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  arrow: {
    fontFamily: fonts.poppins.regular,
    fontSize: 20,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontFamily: fonts.poppins.regular,
    fontSize: 28,
    color: colors.white,
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingBottom: spacing.huge,
  },
  modalTitle: {
    fontFamily: fonts.poppins.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
