import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { GoalMode } from './RouteSetupScreen';

interface BriefSegment {
  id: string;
  name: string;
  distanceKm: number;
  cuesReady: number; // 0–3
  bestTimeSec?: number;
  isPRTarget: boolean;
  hasHistory: boolean;
}

interface Props {
  goalMode: GoalMode;
  segmentCount: number;
  prTargetCount: number;
  routeKm: number;
  spokenBriefText: string;     // preview text shown on screen; audio plays simultaneously
  isAudioPlaying: boolean;
  segments: BriefSegment[];
  onStartRide: () => void;
  onChangeGoalMode: () => void;
  onBack: () => void;
}

const GOAL_LABELS: Record<GoalMode, string> = {
  pr: 'PR Attempt',
  training: 'Training',
  recovery: 'Recovery',
};

export default function PreRideBriefScreen({
  goalMode,
  segmentCount,
  prTargetCount,
  routeKm,
  spokenBriefText,
  isAudioPlaying,
  segments,
  onStartRide,
  onChangeGoalMode,
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Ready to Ride</Text>
          <TouchableOpacity onPress={onChangeGoalMode} activeOpacity={0.7}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.goalRow}>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>{GOAL_LABELS[goalMode]}</Text>
            </View>
            {isAudioPlaying && (
              <View style={styles.audioIndicator}>
                <View style={styles.audioDot} />
                <Text style={styles.audioText}>Playing brief…</Text>
              </View>
            )}
          </View>
          <View style={styles.statsRow}>
            {[
              { val: String(segmentCount), label: 'Segments' },
              { val: String(prTargetCount), label: 'PR Targets' },
              { val: `${routeKm} km`, label: 'Route' },
            ].map((stat, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{stat.val}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Spoken brief banner */}
        <View style={styles.briefBanner}>
          <View style={styles.briefWave}>
            {[8, 14, 20, 12, 18, 8].map((h, i) => (
              <View key={i} style={[styles.briefBar, { height: h }]} />
            ))}
          </View>
          <Text style={styles.briefText}>
            {spokenBriefText}
          </Text>
        </View>

        {/* Segments on route */}
        <Text style={styles.sectionLabel}>On your route</Text>

        {segments.map((seg, i) => (
          <View key={seg.id} style={[styles.segItem, !seg.hasHistory && { opacity: 0.55 }]}>
            <View style={styles.segNum}>
              <Text style={styles.segNumText}>{i + 1}</Text>
            </View>
            <View style={styles.segInfo}>
              <Text style={styles.segName}>{seg.name}</Text>
              <Text style={styles.segMeta}>
                {seg.hasHistory
                  ? `${seg.distanceKm} km · ${seg.cuesReady} cues ready${seg.bestTimeSec ? ` · Best: ${formatTime(seg.bestTimeSec)}` : ''}`
                  : `No history yet · generic cues only`}
              </Text>
            </View>
            {seg.isPRTarget && <View style={styles.prTag}><Text style={styles.prTagText}>PR</Text></View>}
          </View>
        ))}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={onStartRide} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>▶  Start Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onChangeGoalMode} activeOpacity={0.7}>
          <Text style={styles.changeGoalText}>Change goal mode</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  scrollContent: { paddingBottom: 120 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#3A3A3A',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 16, color: '#F0F0F0' },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#F0F0F0', letterSpacing: -0.3 },
  editText: { fontSize: 15, fontWeight: '500', color: '#F5C842' },
  summaryCard: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#363636', borderRadius: 16, padding: 20,
  },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  goalBadge: {
    backgroundColor: '#F5C842', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  goalBadgeText: { fontSize: 12, fontWeight: '700', color: '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
  audioIndicator: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  audioDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: '#F5C842' },
  audioText: { fontSize: 12, fontWeight: '500', color: '#F5C842' },
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, gap: 3 },
  statVal: { fontSize: 22, fontWeight: '700', color: '#F0F0F0', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, fontWeight: '500', color: '#555555', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#3A3A3A', marginHorizontal: 16 },
  briefBanner: {
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: 'rgba(245,200,66,0.08)', borderWidth: 1, borderColor: 'rgba(245,200,66,0.2)',
    borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  briefWave: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20, flexShrink: 0, marginTop: 2 },
  briefBar: { width: 3, backgroundColor: '#F5C842', borderRadius: 2 },
  briefText: { fontSize: 13, color: 'rgba(240,240,240,0.75)', lineHeight: 19, fontStyle: 'italic', flex: 1 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#444444',
    textTransform: 'uppercase', letterSpacing: 1.2,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
  },
  segItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: '#2A2A2A', borderWidth: 1, borderColor: '#363636',
    borderRadius: 12, padding: 12,
  },
  segNum: {
    width: 24, height: 24, borderRadius: 999, backgroundColor: '#363636',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  segNumText: { fontSize: 12, fontWeight: '700', color: '#888888' },
  segInfo: { flex: 1 },
  segName: { fontSize: 14, fontWeight: '600', color: '#F0F0F0' },
  segMeta: { fontSize: 12, color: '#555555', marginTop: 2 },
  prTag: {
    backgroundColor: 'rgba(245,200,66,0.1)', borderWidth: 1, borderColor: 'rgba(245,200,66,0.2)',
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  prTagText: { fontSize: 11, fontWeight: '600', color: '#F5C842' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
    backgroundColor: '#1C1C1E', borderTopWidth: 1, borderTopColor: '#2A2A2A',
    gap: 14, alignItems: 'center',
  },
  startBtn: {
    width: '100%', height: 58, backgroundColor: '#F5C842', borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#000000', letterSpacing: -0.3 },
  changeGoalText: { fontSize: 15, fontWeight: '500', color: 'rgba(240,240,240,0.4)' },
});
