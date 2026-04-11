import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
// TODO: trigger StoreKit purchase via react-native-purchases (RevenueCat) or expo-in-app-purchases

export type PlanId = 'pro_annual' | 'pro_monthly' | 'elite_annual' | 'elite_monthly';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  pricePerMonth?: string;
  saveBadge?: string;
}

const PLANS: Plan[] = [
  { id: 'pro_annual', name: 'Pro · Annual', price: '$59 / year', pricePerMonth: '$4.92/mo', saveBadge: 'Save 30%' },
  { id: 'pro_monthly', name: 'Pro · Monthly', price: '$6.99 / month' },
  { id: 'elite_annual', name: 'Elite · Annual', price: '$99 / year', pricePerMonth: '$8.25/mo', saveBadge: 'Save 37%' },
  { id: 'elite_monthly', name: 'Elite · Monthly', price: '$12.99 / month' },
];

interface FeatureRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  elite: string | boolean;
}

const FEATURES: FeatureRow[] = [
  { label: 'Coached segments', free: '3 / ride', pro: 'Unlimited', elite: 'Unlimited' },
  { label: 'PR coaching cues', free: false, pro: true, elite: true },
  { label: 'Splits analysis', free: false, pro: true, elite: true },
  { label: 'Post-ride debrief', free: false, pro: true, elite: true },
  { label: 'HR zone coaching', free: false, pro: true, elite: true },
  { label: 'Power zone cues', free: false, pro: false, elite: true },
  { label: 'Trend analysis', free: false, pro: false, elite: true },
];

interface Props {
  onClose: () => void;
  onSelectPlan: (planId: PlanId) => void; // triggers StoreKit
  onRestorePurchases: () => void;
  trialEligible: boolean; // false if trial already used
}

export default function PaywallScreen({ onClose, onSelectPlan, onRestorePurchases, trialEligible }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro_annual');

  const renderCell = (val: string | boolean, isElite = false) => {
    if (typeof val === 'boolean') {
      return <Text style={val ? styles.check : styles.cross}>{val ? '✓' : '✕'}</Text>;
    }
    return <Text style={isElite ? styles.valGold : styles.val}>{val}</Text>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRestorePurchases} activeOpacity={0.7}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>
          Unlock your full{'\n'}<Text style={styles.headlineAccent}>segment coach</Text>
        </Text>
        <Text style={styles.sub}>7-day free trial. Cancel anytime in Settings.</Text>

        {/* Feature table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th]}>Free</Text>
            <Text style={[styles.th, { color: '#F5C842' }]}>Pro</Text>
            <Text style={[styles.th, { color: '#F0F0F0' }]}>Elite</Text>
          </View>
          {FEATURES.map((row, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
              <Text style={styles.tdLabel}>{row.label}</Text>
              <View style={styles.tdCell}>{renderCell(row.free)}</View>
              <View style={styles.tdCell}>{renderCell(row.pro)}</View>
              <View style={styles.tdCell}>{renderCell(row.elite, true)}</View>
            </View>
          ))}
        </View>

        {/* Plan options */}
        <View style={styles.planList}>
          {PLANS.map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planOption, selectedPlan === plan.id && styles.planOptionSelected]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              <View style={styles.planLeft}>
                <Text style={[styles.planName, selectedPlan !== plan.id && { color: '#888888' }]}>
                  {plan.name}
                </Text>
                <Text style={styles.planPrice}>
                  {plan.price}
                  {plan.pricePerMonth && (
                    <Text style={styles.planPriceMonth}> · {plan.pricePerMonth}</Text>
                  )}
                </Text>
              </View>
              <View style={styles.planRight}>
                {plan.saveBadge && (
                  <View style={[
                    styles.saveBadge,
                    selectedPlan !== plan.id && styles.saveBadgeMuted,
                  ]}>
                    <Text style={[
                      styles.saveBadgeText,
                      selectedPlan !== plan.id && { color: '#555555' },
                    ]}>
                      {plan.saveBadge}
                    </Text>
                  </View>
                )}
                <View style={[styles.radio, selectedPlan !== plan.id && styles.radioEmpty]}>
                  {selectedPlan === plan.id && <View style={styles.radioFill} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.trialBtn}
          onPress={() => onSelectPlan(selectedPlan)}
          activeOpacity={0.85}
        >
          <Text style={styles.trialBtnText}>
            {trialEligible ? 'Start 7-Day Free Trial' : 'Subscribe'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          {trialEligible
            ? 'After trial, billed at selected plan rate. Cancel anytime in iOS Settings → Subscriptions. No charge during trial.'
            : 'Billed at selected plan rate. Cancel anytime in iOS Settings → Subscriptions.'}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  scrollContent: { paddingBottom: 40 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 999,
    backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#363636',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#555555' },
  restoreText: { fontSize: 13, fontWeight: '500', color: '#444444' },
  headline: {
    fontSize: 26, fontWeight: '800', color: '#F0F0F0',
    letterSpacing: -0.6, textAlign: 'center',
    paddingHorizontal: 20, paddingTop: 16, lineHeight: 32,
  },
  headlineAccent: { color: '#F5C842' },
  sub: { fontSize: 14, color: '#555555', textAlign: 'center', paddingHorizontal: 32, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  table: {
    marginHorizontal: 16, borderWidth: 1, borderColor: '#2E2E2E',
    borderRadius: 14, overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#242424',
    borderBottomWidth: 1, borderBottomColor: '#2E2E2E',
    paddingVertical: 10,
    paddingLeft: '33%' as any,
  },
  th: {
    flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700',
    color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#222222',
  },
  tableRowAlt: { backgroundColor: '#1E1E1E' },
  tdLabel: {
    width: '33%', paddingLeft: 12, paddingVertical: 9,
    fontSize: 12, color: '#888888', fontWeight: '500',
  },
  tdCell: { flex: 1, alignItems: 'center' },
  check: { fontSize: 14, fontWeight: '700', color: '#30A46C' },
  cross: { fontSize: 14, color: '#333333' },
  val: { fontSize: 12, fontWeight: '600', color: '#F0F0F0' },
  valGold: { fontSize: 12, fontWeight: '700', color: '#F5C842' },
  planList: { marginTop: 14, marginHorizontal: 16, gap: 8 },
  planOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, padding: 12, paddingHorizontal: 16,
    backgroundColor: '#242424', borderWidth: 1, borderColor: '#333333',
  },
  planOptionSelected: {
    backgroundColor: 'rgba(245,200,66,0.08)', borderColor: '#F5C842', borderWidth: 1.5,
  },
  planLeft: { gap: 2 },
  planName: { fontSize: 15, fontWeight: '700', color: '#F0F0F0' },
  planPrice: { fontSize: 13, color: '#555555' },
  planPriceMonth: { fontWeight: '600', color: '#888888' },
  planRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBadge: {
    backgroundColor: '#F5C842', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  saveBadgeMuted: {
    backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#363636',
  },
  saveBadgeText: { fontSize: 11, fontWeight: '800', color: '#000000' },
  radio: {
    width: 18, height: 18, borderRadius: 999,
    borderWidth: 2, borderColor: '#F5C842',
    alignItems: 'center', justifyContent: 'center',
  },
  radioEmpty: { borderColor: '#3A3A3A' },
  radioFill: {
    width: 9, height: 9, borderRadius: 999, backgroundColor: '#F5C842',
  },
  trialBtn: {
    marginHorizontal: 20, marginTop: 12, height: 54,
    backgroundColor: '#F5C842', borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  trialBtnText: { fontSize: 17, fontWeight: '700', color: '#000000', letterSpacing: -0.2 },
  terms: {
    fontSize: 11, color: '#3A3A3A', textAlign: 'center',
    paddingHorizontal: 32, marginTop: 10, lineHeight: 16,
  },
});
