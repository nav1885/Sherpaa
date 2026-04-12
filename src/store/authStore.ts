import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface RiderProfile {
  id: string;
  stravaAthleteId: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  jwt: string | null;
  rider: RiderProfile | null;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: string | null;
  isAuthenticated: boolean;

  // Strava tokens (stored securely — never expired in store, we check expiresAt)
  stravaAccessToken: string | null;
  stravaRefreshToken: string | null;
  stravaTokenExpiresAt: number | null; // unix timestamp

  setAuth: (
    jwt: string,
    rider: RiderProfile,
    strava: { accessToken: string; refreshToken: string; expiresAt: number },
  ) => void;
  setSubscription: (tier: SubscriptionTier, expiresAt: string | null) => void;
  setStravaToken: (accessToken: string, expiresAt: number) => void;
  clearAuth: () => void;
}

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      jwt: null,
      rider: null,
      subscriptionTier: 'free',
      subscriptionExpiresAt: null,
      isAuthenticated: false,
      stravaAccessToken: null,
      stravaRefreshToken: null,
      stravaTokenExpiresAt: null,

      setAuth: (jwt, rider, strava) =>
        set({
          jwt,
          rider,
          isAuthenticated: true,
          stravaAccessToken: strava.accessToken,
          stravaRefreshToken: strava.refreshToken,
          stravaTokenExpiresAt: strava.expiresAt,
        }),

      setSubscription: (tier, expiresAt) =>
        set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt }),

      setStravaToken: (accessToken, expiresAt) =>
        set({ stravaAccessToken: accessToken, stravaTokenExpiresAt: expiresAt }),

      clearAuth: () =>
        set({
          jwt: null,
          rider: null,
          subscriptionTier: 'free',
          subscriptionExpiresAt: null,
          isAuthenticated: false,
          stravaAccessToken: null,
          stravaRefreshToken: null,
          stravaTokenExpiresAt: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
