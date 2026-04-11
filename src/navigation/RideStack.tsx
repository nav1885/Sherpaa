import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RideStackParamList } from './types';

import {
  RouteSetupScreenWrapper,
  CueGenerationScreenWrapper,
  PreRideBriefScreenWrapper,
  InRideScreenWrapper,
  SegmentResultScreenWrapper,
  PostRideSummaryScreenWrapper,
  PaywallScreenWrapper,
} from '../screens/wrappers';

const Stack = createStackNavigator<RideStackParamList>();

export default function RideStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RouteSetup" component={RouteSetupScreenWrapper} />
      <Stack.Screen name="CueGeneration" component={CueGenerationScreenWrapper} />
      <Stack.Screen name="PreRideBrief" component={PreRideBriefScreenWrapper} />
      <Stack.Screen
        name="InRide"
        component={InRideScreenWrapper}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="SegmentResult"
        component={SegmentResultScreenWrapper}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="PostRideSummary" component={PostRideSummaryScreenWrapper} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreenWrapper}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
