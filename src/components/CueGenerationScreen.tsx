import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

export type CueStatus = 'done' | 'active' | 'pending';

export interface CueSegment {
  id: string;
  name: string;
  status: CueStatus;
}

interface Props {
  segments: CueSegment[];
  estimatedSecondsRemaining?: number;
  onSkip: () => void; // proceed with available cues
}

export default function CueGenerationScreen({ segments, estimatedSecondsRemaining, onSkip }: Props) {
  return (
    <SafeAreaView style={styles.container}>

      {/* Waveform icon */}
      <View style={styles.iconWrap}>
        <View style={styles.waveform}>
          {[12, 22, 32, 20, 28, 14].map((h, i) => (
            <View key={i} style={[styles.bar, { height: h }]} />
          ))}
        </View>
      </View>

      <Text style={styles.title}>Preparing your coaching cues</Text>
      <Text style={styles.sub}>Analysing your segment history…</Text>

      {/* Progress list */}
      <View style={styles.progressList}>
        {segments.map(seg => (
          <View
            key={seg.id}
            style={[styles.segItem, seg.status === 'active' && styles.segItemActive]}
          >
            <View style={[styles.segIcon, styles[`segIcon_${seg.status}`]]}>
              {seg.status === 'done' && <Text style={styles.segIconDone}>✓</Text>}
              {seg.status === 'active' && (
                // TODO: animate this spinner with Reanimated rotate
                <View style={styles.spinner} />
              )}
              {seg.status === 'pending' && <View style={styles.pendingDot} />}
            </View>
            <View>
              <Text style={styles.segName}>{seg.name}</Text>
              <Text style={[
                styles.segStatus,
                seg.status === 'done' && styles.segStatusDone,
                seg.status === 'active' && styles.segStatusActive,
                seg.status === 'pending' && styles.segStatusPending,
              ]}>
                {seg.status === 'done' ? '3 cue variants ready' : seg.status === 'active' ? 'Generating cues…' : 'Waiting…'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {estimatedSecondsRemaining !== undefined && (
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>
            ~{estimatedSecondsRemaining} seconds remaining
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip — start with available cues</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    marginBottom: 28,
  },
  waveform: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 36 },
  bar: { width: 5, backgroundColor: colors.gold, borderRadius: 3 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  sub: { fontSize: 14, color: colors.textMuted, marginBottom: 40 },
  progressList: { width: '100%', gap: 10, marginBottom: 32 },
  segItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  segItemActive: { borderColor: colors.goldBorder },
  segIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  segIcon_done: { backgroundColor: colors.successDim },
  segIcon_active: { backgroundColor: colors.goldDim },
  segIcon_pending: { backgroundColor: colors.surfaceDim },
  segIconDone: { fontSize: 14, color: colors.success, fontWeight: '700' },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.goldBorder,
    borderTopColor: colors.gold,
    // TODO: animate rotation with Reanimated
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
  },
  segName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  segStatus: { fontSize: 12, marginTop: 2 },
  segStatusDone: { color: colors.success },
  segStatusActive: { color: colors.gold },
  segStatusPending: { color: colors.borderStrong },
  timeBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 24,
  },
  timeBadgeText: { fontSize: 12, color: colors.textMuted },
  skipText: { fontSize: 15, fontWeight: '500', color: colors.textFaint, textAlign: 'center' },
});
