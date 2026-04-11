import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// TODO: animate in with scale spring from Reanimated; auto-dismiss after 4s

interface Props {
  segmentName: string;
  finalTimeSec: number;
  isNewPR: boolean;
  gapToPreSeconds: number; // negative = new PR, positive = off PR
  onDismiss: () => void;   // returns to InRideScreen
  autoDismissMs?: number;  // default 4000
}

export default function SegmentResultScreen({
  segmentName,
  finalTimeSec,
  isNewPR,
  gapToPreSeconds,
  onDismiss,
  autoDismissMs = 4000,
}: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, []);

  const gapAbs = Math.abs(gapToPreSeconds);
  const gapLabel = isNewPR ? `−${gapAbs} seconds` : `+${gapAbs}s off PR`;

  return (
    <TouchableOpacity style={styles.container} onPress={onDismiss} activeOpacity={1}>
      {isNewPR && <View style={styles.glow} />}

      {isNewPR ? (
        <Text style={styles.trophyIcon}>🏆</Text>
      ) : (
        <Text style={styles.checkIcon}>✓</Text>
      )}

      <Text style={styles.segmentName}>{segmentName}</Text>
      <Text style={styles.time}>{formatTime(finalTimeSec)}</Text>

      {isNewPR ? (
        <>
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>NEW PR</Text>
          </View>
          <Text style={[styles.gap, { color: '#F5C842' }]}>{gapLabel}</Text>
        </>
      ) : (
        <>
          <View style={styles.neutralBadge}>
            <Text style={styles.neutralBadgeText}>{gapLabel}</Text>
          </View>
          <Text style={styles.prRef}>PR: {formatTime(finalTimeSec - gapToPreSeconds)}</Text>
        </>
      )}

      <Text style={styles.dismissHint}>Tap anywhere · auto-dismiss in 4s</Text>
    </TouchableOpacity>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(245,200,66,0.12)',
    // TODO: use radial gradient via expo-linear-gradient or react-native-svg
  },
  trophyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 40,
    color: '#888888',
    marginBottom: 16,
  },
  segmentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  time: {
    fontSize: 80,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: -4,
    lineHeight: 80,
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  prBadge: {
    backgroundColor: '#F5C842',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 8,
  },
  prBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
  neutralBadge: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#363636',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 8,
  },
  neutralBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888888',
  },
  gap: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 48,
  },
  prRef: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555555',
    marginBottom: 48,
  },
  dismissHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3A3A3A',
  },
});
