import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from './types';

import WelcomeScreen from '../components/WelcomeScreen';
import CarouselScreen from '../components/CarouselScreen';
import ConnectedScreen from '../components/ConnectedScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator<AuthStackParamList>();

// ─── Screen wrappers with mock props (Phase 0) ────────────────────────────────

function WelcomeWrapper() {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  return (
    <WelcomeScreen
      onGetStarted={() => navigation.navigate('Carousel')}
      onSignIn={() => navigation.navigate('Carousel')}
    />
  );
}

function CarouselWrapper() {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  return (
    <CarouselScreen
      onComplete={() => navigation.navigate('Connected')}
    />
  );
}

function ConnectedWrapper() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return (
    <ConnectedScreen
      athleteName="Nav"
      locationGranted={true}
      statusLines={[
        { label: 'Strava connected', state: 'success' },
        { label: 'Starred segments synced', state: 'success' },
        { label: 'Location access granted', state: 'success' },
      ]}
      onContinue={() => {
        // Phase 0: mock auth to enter the main app
        setAuth('mock-jwt', {
          id: 'mock-rider-id',
          stravaAthleteId: '12345',
          name: 'Nav',
        });
      }}
    />
  );
}

// ─── Stack ────────────────────────────────────────────────────────────────────

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeWrapper} />
      <Stack.Screen name="Carousel" component={CarouselWrapper} />
      <Stack.Screen name="Connected" component={ConnectedWrapper} />
    </Stack.Navigator>
  );
}
