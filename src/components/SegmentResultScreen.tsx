import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../constants/colors';
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
          <Text style={[styles.gap, { color: colors.gold }]}>{gapLabel}</Text>
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
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: colors.goldGlow,
    // TODO: use radial gradient via expo-linear-gradient or react-native-svg
  },
  trophyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 40,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  segmentName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  time: {
    fontSize: 80,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -4,
    lineHeight: 80,
    marginBottom: 16,
    ...Platform.select({
      ios: { fontVariant: ['tabular-nums'] as const },
      android: { fontFamily: 'monospace' },
    }),
  },
  prBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 8,
  },
  prBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textOnGold,
    letterSpacing: 0.5,
  },
  neutralBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 8,
  },
  neutralBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  gap: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 48,
  },
  prRef: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 48,
  },
  dismissHint: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.borderStrong,
  },
});
