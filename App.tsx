import 'react-native-gesture-handler'; // must be first import
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from './src/navigation/RootNavigator';
import { runMigrations } from './src/db/migrations';
import { colors } from './src/constants/colors';
import { loadStarredSegments } from './src/services/segmentService';
import { useSegmentStore } from './src/store/segmentStore';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    runMigrations()
      .then(async () => {
        console.log('[App] migrations done');
        const segs = await loadStarredSegments();
        console.log('[App] segments loaded from DB:', segs.length);
        if (segs.length > 0) {
          useSegmentStore.getState().setStarredSegments(segs);
        }
        setDbReady(true);
      })
      .catch((err) => {
        console.error('[App] DB migration failed:', err);
        setDbReady(true);
      });
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
