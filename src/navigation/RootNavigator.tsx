import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import RideStack from './RideStack';

const Root = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Root.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Root.Screen name="Main" component={MainTabs} />
            <Root.Screen
              name="Ride"
              component={RideStack}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
