import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import MapWebView from './MapWebView';
import { LatLng } from '../utils/polyline';
import { MatchedSegment } from '../services/routeMatching';
import { StravaActivitySummary } from '../services/stravaApi';

export type RouteMethod = 'strava' | 'gpx' | 'skip';
export type GoalMode = 'pr' | 'training' | 'recovery';

interface Props {
  // Map state
  routePolyline: LatLng[] | null;
  matchedSegments: MatchedSegment[];

  // Activity states
  recentActivities: StravaActivitySummary[];
  isLoadingActivities: boolean;
  previewedActivity: StravaActivitySummary | null;
  confirmedActivityId: number | null;
  onActivityPreview: (activity: StravaActivitySummary) => void;
  onConfirmActivity: () => void;
  onClearActivity: () => void;

  // Goal + navigation
  selectedGoalMode: GoalMode;
  onGoalModeSelect: (mode: GoalMode) => void;
  onGenerateCues: () => void;
  onBack: () => void;
}

const GOAL_LABELS: Record<GoalMode, string> = {
  pr: 'PR Attempt',
  training: 'Training',
  recovery: 'Recovery',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(metres: number): string {
  return `${(metres / 1000).toFixed(1)} km`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RouteSetupScreen({
  routePolyline,
  matchedSegments,
  recentActivities,
  isLoadingActivities,
  previewedActivity,
  confirmedActivityId,
  onActivityPreview,
  onConfirmActivity,
  onClearActivity,
  selectedGoalMode,
  onGoalModeSelect,
  onGenerateCues,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const isConfirmed = confirmedActivityId !== null;
  const canGenerate = matchedSegments.length > 0;

  return (
    <View style={styles.root}>

      {/* ── TOP HALF: Map ── */}
      <View style={styles.mapHalf}>
        <MapWebView
          routePolyline={routePolyline}
          matchedSegments={isConfirmed ? matchedSegments : []}
          topPad={insets.top + 56}
        />

        {/* Back button + pills overlay */}
        <View style={[styles.mapOverlay, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <View style={styles.topRow} pointerEvents="box-none">
            <View style={styles.pills} pointerEvents="box-none">
              <View style={[styles.pill, styles.pillActive]}>
                <Text style={[styles.pillText, styles.pillTextActive]}>✦ Strava Route</Text>
              </View>
              <TouchableOpacity
                style={styles.pill}
                onPress={() => Alert.alert('Coming soon', 'GPX import will be available in a future update.')}
                activeOpacity={0.8}
              >
                <Text style={styles.pillText}>Import GPX</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pill} onPress={onGenerateCues} activeOpacity={0.8}>
                <Text style={styles.pillText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* ── BOTTOM HALF: Panel ── */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>

        {!isConfirmed ? (
          /* ── Ride selection ── */
          <>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Select a ride</Text>
              {previewedActivity && (
                <Text style={styles.panelSub}>{previewedActivity.name}</Text>
              )}
            </View>

            {isLoadingActivities ? (
              <Text style={styles.statusText}>Loading recent rides…</Text>
            ) : recentActivities.length === 0 ? (
              <Text style={styles.statusText}>No recent rides with routes found.</Text>
            ) : (
              <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {recentActivities.map((activity, i) => {
                  const isSelected = previewedActivity?.id === activity.id;
                  return (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.row,
                        i === recentActivities.length - 1 && styles.rowLast,
                        isSelected && styles.rowSelected,
                      ]}
                      onPress={() => onActivityPreview(activity)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.rowContent}>
                        <Text style={[styles.rowName, isSelected && styles.rowNameSelected]} numberOfLines={1}>
                          {activity.name}
                        </Text>
                        <Text style={styles.rowMeta}>
                          {formatDate(activity.start_date)} · {formatDistance(activity.distance)}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.btnGold, !previewedActivity && styles.btnDisabled]}
              onPress={onConfirmActivity}
              disabled={!previewedActivity}
              activeOpacity={0.85}
            >
              <Text style={styles.btnGoldText}>
                {previewedActivity
                  ? `Use "${previewedActivity.name.length > 22 ? previewedActivity.name.slice(0, 22) + '…' : previewedActivity.name}"`
                  : 'Select a ride above'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ── Segments + goal + generate ── */
          <>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>
                  {matchedSegments.length} segment{matchedSegments.length !== 1 ? 's' : ''} on route
                </Text>
              </View>
              <TouchableOpacity onPress={onClearActivity} activeOpacity={0.7}>
                <Text style={styles.changeText}>← Change ride</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {matchedSegments.length === 0 ? (
                <Text style={styles.statusText}>No starred segments matched this route.</Text>
              ) : (
                matchedSegments.map(ms => {
                  const seg = ms.segment;
                  const hasHistory = seg.effortCount > 0;
                  return (
                    <View key={seg.id} style={styles.segRow}>
                      <View style={[styles.segDot, !hasHistory && styles.segDotDim]} />
                      <View style={styles.segInfo}>
                        <Text style={styles.segName}>{seg.name}</Text>
                        <Text style={styles.segMeta}>
                          {hasHistory
                            ? `${(seg.distanceM / 1000).toFixed(1)} km · best ${formatTime(seg.bestTimeSec ?? 0)}`
                            : `${(seg.distanceM / 1000).toFixed(1)} km · no history`}
                        </Text>
                      </View>
                      <Text style={styles.segKm}>{ms.distanceAlongRouteKm.toFixed(1)} km</Text>
                    </View>
                  );
                })
              )}
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
                  <Text style={[styles.goalChipText, selectedGoalMode === mode && styles.goalChipTextSelected]}>
                    {GOAL_LABELS[mode]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btnGold, !canGenerate && styles.btnDisabled]}
              onPress={onGenerateCues}
              disabled={!canGenerate}
              activeOpacity={0.85}
            >
              <Text style={styles.btnGoldText}>Generate Coaching Cues</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Map half ──
  mapHalf: {
    flex: 1,
    overflow: 'hidden',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  pills: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,28,30,0.85)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textOnGold,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderStrong,
  },

  // ── Panel ──
  panel: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  panelSub: {
    fontSize: 12,
    color: colors.gold,
    marginTop: 2,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gold,
    paddingTop: 2,
  },
  statusText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },

  // ── Activity list ──
  list: {
    flex: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowSelected: {
    backgroundColor: 'rgba(245,200,66,0.06)',
    borderBottomWidth: 0,
    marginBottom: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingLeft: 10,
  },
  rowContent: {
    flex: 1,
    paddingLeft: 4,
    gap: 3,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowNameSelected: {
    color: colors.gold,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 20,
    color: colors.textDim,
    paddingLeft: 8,
  },

  // ── Segment list ──
  segRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  segDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.gold,
    flexShrink: 0,
  },
  segDotDim: {
    backgroundColor: colors.textDim,
  },
  segInfo: { flex: 1 },
  segName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  segMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  segKm: { fontSize: 11, color: colors.textMuted },

  // ── Goal chips ──
  goalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  goalChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  goalChip: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalChipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  goalChipTextSelected: {
    color: colors.textOnGold,
  },

  // ── Buttons ──
  btnGold: {
    height: 52,
    backgroundColor: colors.gold,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnGoldText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnGold,
    letterSpacing: -0.2,
  },
});
