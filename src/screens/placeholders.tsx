/**
 * Placeholder screens for tabs not yet built (Phase 6).
 * Replaced one by one as real screens are implemented.
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../constants/colors';

function Placeholder({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>{title}</Text>
      <Text style={styles.sub}>Coming in Phase 6</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.textMuted },
});

export const SegmentsScreenPlaceholder = () => <Placeholder title="Segments Explorer" />;
export const HistoryScreenPlaceholder = () => <Placeholder title="Ride History" />;
export const SettingsScreenPlaceholder = () => <Placeholder title="Settings" />;
