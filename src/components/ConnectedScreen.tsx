import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

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
  success: '#30A46C',
  loading: '#555555',
  error: '#E5484D',
  warning: '#F5C842',
};

const STATUS_DOT = {
  success: '#30A46C',
  loading: '#2A2A2A',
  error: '#E5484D',
  warning: '#F5C842',
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
    backgroundColor: '#1C1C1E',
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
    backgroundColor: '#F5C842',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
  },
  stravaBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FC4C02',
    borderWidth: 2,
    borderColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stravaBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F0F0F0',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#555555',
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#363636',
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
    backgroundColor: 'rgba(245,200,66,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.2)',
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  locationWarningText: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
  },
  locationWarningLink: {
    color: '#F5C842',
    fontWeight: '600',
  },
  btnGold: {
    width: '100%',
    height: 52,
    backgroundColor: '#F5C842',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnGoldText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
});
