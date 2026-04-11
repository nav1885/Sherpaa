import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
// TODO: import MapView for ride track rendering

export interface SegmentResult {
  id: string;
  name: string;
  timeSec: number;
  isNewPR: boolean;
  gapToPreSeconds: number; // negative = new PR / faster
  prTimeSec?: number;
  wasSkipped: boolean;
  splits?: SplitPoint[];
  cueTextPlayed?: string;
}

interface SplitPoint {
  label: string; // '25%' | '50%' | '75%' | 'End'
  gapSeconds: number; // vs PR at same checkpoint
}

interface Props {
  rideName: string;
  rideDate: string;
  distanceKm: number;
  durationSec: number;
  elevationM: number;
  avgHrBpm?: number;
  avgWatts?: number;
  segmentResults: SegmentResult[];
  stravaSynced: boolean;
  debriefText: string;
  onListenDebrief: () => void;
  onShare: () => void;
  onDone: () => void;
}

export default function PostRideSummaryScreen({
  rideName,
  rideDate,
  distanceKm,
  durationSec,
  elevationM,
  avgHrBpm,
  avgWatts,
  segmentResults,
  stravaSynced,
  debriefText,
  onListenDebrief,
  onShare,
  onDone,
}: Props) {
  const [expandedSegId, setExpandedSegId] = useState<string | null>(null);

  const prCount = segmentResults.filter(s => s.isNewPR).length;
  const hitCount = segmentResults.filter(s => !s.wasSkipped).length;

  const toggleExpand = (id: string) =>
    setExpandedSegId(prev => (prev === id ? null : id));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Map strip */}
        {/* TODO: replace with MapView showing gpxTrack in colors.gold and segment dots */}
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapNav}>
            <View>
              <Text style={styles.mapDate}>{rideDate}</Text>
              <Text style={styles.mapTitle}>{rideName}</Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={onShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PR headline */}
        {prCount > 0 && (
          <View style={styles.prHeadline}>
            <View style={styles.prCrownBadge}>
              <Text style={styles.prCrownText}>🏆 {prCount} New PR</Text>
            </View>
            <Text style={styles.prHeadlineSub}>
              {segmentResults.find(s => s.isNewPR)?.name}
            </Text>
          </View>
        )}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { val: `${distanceKm.toFixed(1)}`, label: 'km' },
            { val: formatTime(durationSec), label: 'duration' },
            { val: `${elevationM}`, label: 'elevation' },
            { val: `${hitCount} / ${segmentResults.length}`, label: 'segments' },
            { val: avgWatts ? `${avgWatts}` : '—', label: 'avg watts' },
            { val: avgHrBpm ? `${avgHrBpm}` : '—', label: 'avg bpm' },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statVal}>{stat.val}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Strava sync banner */}
        <View style={[styles.syncBanner, !stravaSynced && styles.syncBannerPending]}>
          <Text style={[styles.syncText, !stravaSynced && styles.syncTextPending]}>
            {stravaSynced ? '✓  Synced to Strava' : '↻  Strava sync pending…'}
          </Text>
        </View>

        {/* Segment results */}
        <Text style={styles.sectionLabel}>Segments</Text>

        {segmentResults.map(seg => {
          const expanded = expandedSegId === seg.id;
          return (
            <TouchableOpacity
              key={seg.id}
              style={[
                styles.segCard,
                seg.isNewPR && styles.segCardPR,
                seg.wasSkipped && { opacity: 0.5 },
              ]}
              onPress={() => !seg.wasSkipped && toggleExpand(seg.id)}
              activeOpacity={seg.wasSkipped ? 1 : 0.75}
            >
              <View style={styles.segCardTop}>
                <Text style={styles.segName}>{seg.name}</Text>
                <Text style={[styles.segTime, seg.isNewPR && { color: colors.gold }]}>
                  {seg.wasSkipped ? '—' : formatTime(seg.timeSec)}
                </Text>
              </View>
              <View style={styles.segCardBottom}>
                <Text style={styles.segNote}>
                  {seg.wasSkipped
                    ? 'Skipped · took alternate route'
                    : seg.prTimeSec
                    ? `PR: ${formatTime(seg.prTimeSec)}`
                    : 'No history'}
                </Text>
                {!seg.wasSkipped && (
                  <View style={seg.isNewPR ? styles.prTag : styles.offTag}>
                    <Text style={seg.isNewPR ? styles.prTagText : styles.offTagText}>
                      {seg.isNewPR
                        ? `🏆 NEW PR · −${Math.abs(seg.gapToPreSeconds)}s`
                        : `+${seg.gapToPreSeconds}s off PR`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Expanded splits */}
              {expanded && seg.splits && (
                <View style={styles.splitsArea}>
                  <Text style={styles.splitsTitle}>Split comparison · Today vs PR</Text>
                  {seg.splits.map((split, i) => (
                    <View key={i} style={styles.splitRow}>
                      <Text style={styles.splitLabel}>{split.label}</Text>
                      <View style={styles.splitTrack}>
                        <View style={styles.splitBarPR} />
                        {/* TODO: animate today bar width based on split */}
                        <View style={[styles.splitBarToday, { width: '72%' }]} />
                      </View>
                      <Text style={[
                        styles.splitVal,
                        { color: split.gapSeconds <= 0 ? colors.success : colors.error },
                      ]}>
                        {split.gapSeconds <= 0 ? `−${Math.abs(split.gapSeconds)}s` : `+${split.gapSeconds}s`}
                      </Text>
                    </View>
                  ))}
                  {seg.cueTextPlayed && (
                    <View style={styles.cueReview}>
                      <Text style={styles.cueReviewLabel}>Coaching cue played</Text>
                      <Text style={styles.cueReviewText}>"{seg.cueTextPlayed}"</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Listen again */}
        <TouchableOpacity style={styles.listenBtn} onPress={onListenDebrief} activeOpacity={0.8}>
          <Text style={styles.listenBtnText}>♪  Listen to Debrief Again</Text>
        </TouchableOpacity>

        {/* Done */}
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 40 },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.mapBg,
    justifyContent: 'flex-end',
  },
  mapNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 14,
    // TODO: wrap in <LinearGradient> from expo-linear-gradient (Phase 6 polish)
  },
  mapDate: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  mapTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  shareBtn: {
    width: 44, height: 44, borderRadius: 999,
    backgroundColor: 'rgba(42,42,42,0.9)', borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnText: { fontSize: 16, color: colors.textPrimary },
  prHeadline: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 16,
  },
  prCrownBadge: {
    backgroundColor: colors.gold, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  prCrownText: { fontSize: 12, fontWeight: '800', color: colors.textOnGold },
  prHeadlineSub: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 20, paddingTop: 14,
  },
  statCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 12,
  },
  statVal: {
    fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5,
    ...Platform.select({
      ios: { fontVariant: ['tabular-nums'] as const },
      android: { fontFamily: 'monospace' },
    }),
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },
  syncBanner: {
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: colors.successDim, borderWidth: 1, borderColor: colors.successBorder,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  syncBannerPending: {
    backgroundColor: colors.goldDim, borderColor: colors.goldBorder,
  },
  syncText: { fontSize: 13, fontWeight: '500', color: colors.success },
  syncTextPending: { color: colors.gold },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: colors.textDim,
    textTransform: 'uppercase', letterSpacing: 1.2,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
  },
  segCard: {
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14,
  },
  segCardPR: {
    borderColor: colors.goldBorderStrong,
    backgroundColor: colors.goldDim,
  },
  segCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  segName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  segTime: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary,
    ...Platform.select({
      ios: { fontVariant: ['tabular-nums'] as const },
      android: { fontFamily: 'monospace' },
    }),
  },
  segCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segNote: { fontSize: 12, color: colors.textMuted },
  prTag: {
    backgroundColor: colors.goldDim, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  prTagText: { fontSize: 11, fontWeight: '700', color: colors.gold },
  offTag: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderMuted,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  offTagText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  splitsArea: {
    marginTop: 14, borderTopWidth: 1, borderTopColor: colors.borderMuted, paddingTop: 14,
  },
  splitsTitle: { fontSize: 11, fontWeight: '600', color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  splitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  splitLabel: { fontSize: 12, fontWeight: '500', color: colors.textMuted, width: 36 },
  splitTrack: { flex: 1, height: 6, backgroundColor: colors.surfaceDim, borderRadius: 999, position: 'relative' },
  splitBarPR: { position: 'absolute', top: 0, left: 0, height: 6, width: '70%', backgroundColor: colors.textDim, borderRadius: 999 },
  splitBarToday: { position: 'absolute', top: 0, left: 0, height: 6, backgroundColor: colors.gold, borderRadius: 999, opacity: 0.9 },
  splitVal: {
    fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right',
    ...Platform.select({
      ios: { fontVariant: ['tabular-nums'] as const },
      android: { fontFamily: 'monospace' },
    }),
  },
  cueReview: {
    marginTop: 12, backgroundColor: colors.goldDim,
    borderWidth: 1, borderColor: colors.goldBorder, borderRadius: 8, padding: 10,
  },
  cueReviewLabel: { fontSize: 11, fontWeight: '600', color: colors.gold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  cueReviewText: { fontSize: 12, color: 'rgba(240,240,240,0.6)', fontStyle: 'italic', lineHeight: 18 },
  listenBtn: {
    marginHorizontal: 20, marginTop: 12, height: 48,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  listenBtnText: { fontSize: 14, fontWeight: '600', color: colors.gold },
  doneBtn: {
    marginHorizontal: 20, marginTop: 10, height: 54,
    backgroundColor: colors.gold, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  doneBtnText: { fontSize: 17, fontWeight: '600', color: colors.textOnGold },
});
