// Zustand store for user state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserPlan = 'free' | 'pass_48h' | 'pro';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider?: 'email' | 'google' | 'github';
}

interface UserState {
  // User data
  user: User | null;
  isLoggedIn: boolean;
  userPlan: UserPlan;
  planExpiresAt: Date | null;

  // Auth modal state
  showAuthModal: boolean;
  authModalTrigger: 'save' | 'coach' | 'export' | null;

  // Actions
  setUser: (user: User | null) => void;
  setUserPlan: (plan: UserPlan, expiresAt?: Date | null) => void;
  openAuthModal: (trigger: 'save' | 'coach' | 'export') => void;
  closeAuthModal: () => void;
  login: (user: User) => void;
  logout: () => void;

  // Plan checks
  canAccessDeepAnalysis: () => boolean;
  canExportWithoutWatermark: () => boolean;
  canSaveHistory: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoggedIn: false,
      userPlan: 'free',
      planExpiresAt: null,
      showAuthModal: false,
      authModalTrigger: null,

      // Actions
      setUser: (user) => set({ user, isLoggedIn: !!user }),
      
      setUserPlan: (plan, expiresAt = null) => set({ 
        userPlan: plan, 
        planExpiresAt: expiresAt 
      }),

      openAuthModal: (trigger) => set({ 
        showAuthModal: true, 
        authModalTrigger: trigger 
      }),

      closeAuthModal: () => set({ 
        showAuthModal: false, 
        authModalTrigger: null 
      }),

      login: (user) => set({ 
        user, 
        isLoggedIn: true 
      }),

      logout: () => set({ 
        user: null, 
        isLoggedIn: false, 
        userPlan: 'free',
        planExpiresAt: null 
      }),

      // Plan access checks
      canAccessDeepAnalysis: () => {
        const { userPlan, planExpiresAt } = get();
        if (userPlan === 'free') return false;
        if (userPlan === 'pass_48h' && planExpiresAt) {
          return new Date() < new Date(planExpiresAt);
        }
        return userPlan === 'pro';
      },

      canExportWithoutWatermark: () => {
        const { userPlan, planExpiresAt } = get();
        if (userPlan === 'free') return false;
        if (userPlan === 'pass_48h' && planExpiresAt) {
          return new Date() < new Date(planExpiresAt);
        }
        return userPlan === 'pro';
      },

      canSaveHistory: () => {
        const { userPlan, planExpiresAt } = get();
        if (userPlan === 'free') return false;
        if (userPlan === 'pass_48h' && planExpiresAt) {
          return new Date() < new Date(planExpiresAt);
        }
        return userPlan === 'pro';
      },
    }),
    {
      name: 'pitchdeck-user',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        userPlan: state.userPlan,
        planExpiresAt: state.planExpiresAt,
      }),
    }
  )
);
