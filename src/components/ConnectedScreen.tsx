import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

type StatusLine = {
  label: string;
  state: 'success' | 'loading' | 'error' | 'warning';
};

interface Props {
  athleteName: string; // TODO: from Strava profile fetch
  locationGranted: boolean;
  statusLines: StatusLine[]; // TODO: driven by async auth + fetch results
  onContinue: () => void;
  onEnableLocation?: () => void; // deep-links to Settings if locationGranted is false
}

const STATUS_COLOR = {
  success: colors.success,
  loading: colors.textMuted,
  error: colors.error,
  warning: colors.gold,
};

const STATUS_DOT = {
  success: colors.success,
  loading: colors.surface,
  error: colors.error,
  warning: colors.gold,
};

export default function ConnectedScreen({ athleteName, locationGranted, statusLines, onContinue, onEnableLocation }: Props) {
  const initials = athleteName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {/* TODO: replace with actual Strava avatar image when available */}
          <View style={styles.stravaBadge}>
            <Text style={styles.stravaBadgeText}>S</Text>
          </View>
        </View>

        <Text style={styles.title}>You're all set</Text>
        <Text style={styles.subtitle}>{athleteName} · Connected to Strava</Text>

        {/* Status card */}
        <View style={styles.statusCard}>
          {statusLines.map((line, i) => (
            <View key={i} style={styles.statusLine}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_DOT[line.state] }]} />
              <Text style={[styles.statusText, { color: STATUS_COLOR[line.state] }]}>{line.label}</Text>
            </View>
          ))}
        </View>

        {/* Location warning if denied */}
        {!locationGranted && (
          <TouchableOpacity style={styles.locationWarning} onPress={onEnableLocation} activeOpacity={0.7}>
            <Text style={styles.locationWarningText}>
              Location access needed for in-ride coaching.{' '}
              <Text style={styles.locationWarningLink}>Enable in Settings →</Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnGold} onPress={onContinue} activeOpacity={0.85}>
          <Text style={styles.btnGoldText}>Let's Go</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textOnGold,
  },
  stravaBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.stravaOrange,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stravaBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
  },
  statusCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    gap: 14,
    marginVertical: 8,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  locationWarning: {
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  locationWarningText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  locationWarningLink: {
    color: colors.gold,
    fontWeight: '600',
  },
  btnGold: {
    width: '100%',
    height: 56,
    backgroundColor: colors.gold,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnGoldText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textOnGold,
  },
});
