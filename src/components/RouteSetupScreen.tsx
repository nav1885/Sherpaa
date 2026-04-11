import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
// TODO: import MapKit via react-native-maps or @rnmapbox/maps
// import MapView, { Polyline, Marker } from 'react-native-maps';

export type RouteMethod = 'strava' | 'gpx' | 'skip';
export type GoalMode = 'pr' | 'training' | 'recovery';

interface SegmentOnRoute {
  id: string;
  name: string;
  distanceKm: number;
  estimatedTimeSec: number;
  isPRTarget: boolean;
  hasHistory: boolean;
}

interface Props {
  segmentsOnRoute: SegmentOnRoute[];
  onRouteMethodSelect: (method: RouteMethod) => void;
  onGoalModeSelect: (mode: GoalMode) => void;
  onGenerateCues: () => void;
  onBack: () => void;
  selectedGoalMode?: GoalMode;
  selectedRouteMethod?: RouteMethod;
}

const GOAL_LABELS: Record<GoalMode, string> = {
  pr: 'PR Attempt',
  training: 'Training',
  recovery: 'Recovery',
};

export default function RouteSetupScreen({
  segmentsOnRoute,
  onRouteMethodSelect,
  onGoalModeSelect,
  onGenerateCues,
  onBack,
  selectedGoalMode = 'training',
  selectedRouteMethod = 'strava',
}: Props) {
  const prTargets = segmentsOnRoute.filter(s => s.isPRTarget).length;

  return (
    <View style={styles.container}>
      {/* TODO: replace with MapView showing route polyline and segment overlays */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>[ Map · Route + Segment Overlays ]</Text>
        {/* TODO: MapView with:
          - route polyline in #F5C842
          - segment overlays in gold (isPRTarget) or #888888
          - current location pin
          - tap to select Strava route from list
        */}
      </View>

      {/* Route method pills — absolute over map */}
      <View style={styles.routePills}>
        {(['strava', 'gpx', 'skip'] as RouteMethod[]).map(method => (
          <TouchableOpacity
            key={method}
            style={[styles.routePill, selectedRouteMethod === method && styles.routePillActive]}
            onPress={() => onRouteMethodSelect(method)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.routePillText,
              selectedRouteMethod === method && styles.routePillTextActive,
            ]}>
              {method === 'strava' ? '✦ Strava Route' : method === 'gpx' ? 'Import GPX' : 'Skip'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetRow}>
          <Text style={styles.sheetTitle}>{segmentsOnRoute.length} segments on route</Text>
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>{prTargets} PR targets</Text>
          </View>
        </View>

        <ScrollView style={styles.segmentList} scrollEnabled={false}>
          {segmentsOnRoute.map(seg => (
            <View key={seg.id} style={styles.segmentItem}>
              <View style={[styles.segDot, { backgroundColor: seg.isPRTarget ? '#F5C842' : '#888888' }]} />
              <View style={styles.segInfo}>
                <Text style={styles.segName}>{seg.name}</Text>
                <Text style={styles.segMeta}>
                  {seg.hasHistory
                    ? `${seg.distanceKm} km · ~${formatTime(seg.estimatedTimeSec)} est.`
                    : `No history yet · ${seg.distanceKm} km`}
                </Text>
              </View>
              {seg.isPRTarget && (
                <View style={styles.prTag}>
                  <Text style={styles.prTagText}>PR target</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <Text style={styles.goalLabel}>Goal for this ride</Text>
        <View style={styles.goalChips}>
          {(['pr', 'training', 'recovery'] as GoalMode[]).map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.goalChip, selectedGoalMode === mode && styles.goalChipSelected]}
              onPress={() => onGoalModeSelect(mode)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.goalChipText,
                selectedGoalMode === mode && styles.goalChipTextSelected,
              ]}>
                {GOAL_LABELS[mode]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btnGold} onPress={onGenerateCues} activeOpacity={0.85}>
          <Text style={styles.btnGoldText}>Generate Coaching Cues</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2030' },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2030',
  },
  mapPlaceholderText: { fontSize: 13, color: '#3A4A5A' },
  routePills: {
    position: 'absolute',
    top: 108,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  routePill: {
    flex: 1,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42,42,42,0.9)',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  routePillActive: {
    backgroundColor: '#F5C842',
    borderColor: '#F5C842',
  },
  routePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888888',
  },
  routePillTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#3A3A3A',
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F0F0F0',
    letterSpacing: -0.3,
  },
  prBadge: {
    backgroundColor: 'rgba(245,200,66,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  prBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F5C842',
  },
  segmentList: { marginBottom: 18 },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#363636',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  segDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  segInfo: { flex: 1 },
  segName: { fontSize: 14, fontWeight: '600', color: '#F0F0F0' },
  segMeta: { fontSize: 12, color: '#555555', marginTop: 1 },
  prTag: {
    backgroundColor: 'rgba(245,200,66,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.2)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  prTagText: { fontSize: 11, fontWeight: '600', color: '#F5C842' },
  goalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  goalChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  goalChip: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#363636',
  },
  goalChipSelected: {
    backgroundColor: '#F5C842',
    borderColor: '#F5C842',
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  goalChipTextSelected: {
    color: '#000000',
  },
  btnGold: {
    width: '100%',
    height: 54,
    backgroundColor: '#F5C842',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGoldText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
});
