import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// TODO: animate sheet in with Reanimated spring (translateY from screenHeight to 0)

interface Props {
  segmentName: string;
  elapsedTimeSec: number;   // counting up
  progressPercent: number;  // 0–100
  gapToPreSeconds: number;  // negative = ahead, positive = behind
  speedKmh: number;
  powerWatts?: number;
  onDismiss: () => void;    // returns to InRideScreen; does NOT stop detection
}

export default function SegmentActiveOverlay({
  segmentName,
  elapsedTimeSec,
  progressPercent,
  gapToPreSeconds,
  speedKmh,
  powerWatts,
  onDismiss,
}: Props) {
  const gapAhead = gapToPreSeconds <= 0;
  const gapDisplay = gapAhead
    ? `−${Math.abs(gapToPreSeconds)}s`
    : `+${gapToPreSeconds}s`;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Tappable dismiss area over dimmed ride screen */}
      <TouchableOpacity style={styles.dismissArea} onPress={onDismiss} activeOpacity={1} />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.segmentName}>{segmentName}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Start</Text>
          <Text style={[styles.progressLabel, { color: '#F5C842' }]}>{Math.round(progressPercent)}%</Text>
          <Text style={styles.progressLabel}>Finish</Text>
        </View>

        {/* Elapsed time */}
        <View style={styles.elapsedWrap}>
          <Text style={styles.elapsedVal}>{formatTime(elapsedTimeSec)}</Text>
          <Text style={styles.elapsedLabel}>Elapsed</Text>
        </View>

        {/* Metric cards */}
        <View style={styles.gapRow}>
          <View style={styles.gapCard}>
            <Text style={[styles.gapVal, { color: gapAhead ? '#30A46C' : '#E5484D' }]}>
              {gapDisplay}
            </Text>
            <Text style={styles.gapLabel}>vs PR pace</Text>
          </View>
          <View style={styles.gapCard}>
            <Text style={styles.gapVal}>{Math.round(speedKmh)}</Text>
            <Text style={styles.gapLabel}>km/h</Text>
          </View>
          {powerWatts !== undefined && (
            <View style={styles.gapCard}>
              <Text style={styles.gapVal}>{powerWatts}</Text>
              <Text style={styles.gapLabel}>watts</Text>
            </View>
          )}
        </View>
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
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#2E2E2E',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#3A3A3A',
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  segmentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F0F0F0',
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 999,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5C842',
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444444',
  },
  elapsedWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  elapsedVal: {
    fontSize: 64,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: -3,
    lineHeight: 64,
    fontVariant: ['tabular-nums'],
  },
  elapsedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444444',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  gapRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gapCard: {
    flex: 1,
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  gapVal: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F0F0F0',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  gapLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#444444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
