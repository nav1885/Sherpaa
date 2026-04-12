import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { colors } from '../constants/colors';

import HomeTab from '../screens/HomeTab';
// Placeholder screens for Phase 6
import { SegmentsScreenPlaceholder, HistoryScreenPlaceholder, SettingsScreenPlaceholder } from '../screens/placeholders';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '⌂',
    Segments: '◈',
    History: '◷',
    Settings: '⚙',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 26, color: focused ? colors.gold : colors.textDim }}>
        {icons[label]}
      </Text>
    </View>
  );
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.borderMuted,
          borderTopWidth: 1,
          paddingBottom: bottomPad,
          paddingTop: 10,
          height: 60 + bottomPad,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Segments" component={SegmentsScreenPlaceholder} />
      <Tab.Screen name="History" component={HistoryScreenPlaceholder} />
      <Tab.Screen name="Settings" component={SettingsScreenPlaceholder} />
    </Tab.Navigator>
  );
}
