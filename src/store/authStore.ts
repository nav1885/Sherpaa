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

  setAuth: (jwt: string, rider: RiderProfile) => void;
  setSubscription: (tier: SubscriptionTier, expiresAt: string | null) => void;
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

      setAuth: (jwt, rider) =>
        set({ jwt, rider, isAuthenticated: true }),

      setSubscription: (tier, expiresAt) =>
        set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt }),

      clearAuth: () =>
        set({
          jwt: null,
          rider: null,
          subscriptionTier: 'free',
          subscriptionExpiresAt: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
