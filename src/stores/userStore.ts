// Zustand store for user state management with Supabase integration

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { identifyUser, resetAnalytics, trackEvent } from '@/utils/analytics';

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
  isCheckingSubscription: boolean;

  // Auth modal state
  showAuthModal: boolean;
  authModalTrigger: 'save' | 'coach' | 'export' | null;

  // Actions
  setUser: (user: User | null) => void;
  setUserPlan: (plan: UserPlan, expiresAt?: Date | null) => void;
  openAuthModal: (trigger: 'save' | 'coach' | 'export') => void;
  closeAuthModal: () => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  initializeAuth: () => Promise<void>;

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
      isCheckingSubscription: false,
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

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          // Ignore signOut errors (e.g. session_not_found) - still clear local state
          console.warn('SignOut error (ignored):', error);
        }
        resetAnalytics();
        trackEvent('user_logout');
        set({ 
          user: null, 
          isLoggedIn: false, 
          userPlan: 'free',
          planExpiresAt: null 
        });
      },

      checkSubscription: async () => {
        const { user, isLoggedIn } = get();
        if (!isLoggedIn || !user) return;

        set({ isCheckingSubscription: true });
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { data, error } = await supabase.functions.invoke('check-subscription', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) {
            console.error('Subscription check error:', error);
            return;
          }

          if (data) {
            const plan = data.plan as UserPlan;
            const expiresAt = data.subscription_end 
              ? new Date(data.subscription_end) 
              : data.pass_expires 
                ? new Date(data.pass_expires) 
                : null;
            
            set({ userPlan: plan, planExpiresAt: expiresAt });
          }
        } catch (error) {
          console.error('Failed to check subscription:', error);
        } finally {
          set({ isCheckingSubscription: false });
        }
      },

      initializeAuth: async () => {
        // Set up auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || 
                    session.user.user_metadata?.full_name || 
                    session.user.email?.split('@')[0] || 'User',
              avatar: session.user.user_metadata?.avatar_url,
              provider: session.user.app_metadata?.provider as User['provider'],
            };
            set({ user, isLoggedIn: true });
            
            // Identify user in PostHog for analytics
            identifyUser(session.user.id, {
              email: session.user.email,
              name: user.name,
              provider: user.provider,
              created_at: session.user.created_at,
            });
            
            // Track login event
            if (event === 'SIGNED_IN') {
              trackEvent('user_login', { provider: user.provider });
            }
            
            // Check subscription after login
            setTimeout(() => {
              get().checkSubscription();
            }, 0);
          } else {
            set({ user: null, isLoggedIn: false, userPlan: 'free', planExpiresAt: null });
          }
        });

        // Check existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 
                  session.user.user_metadata?.full_name || 
                  session.user.email?.split('@')[0] || 'User',
            avatar: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider as User['provider'],
          };
          set({ user, isLoggedIn: true });
          
          // Check subscription
          setTimeout(() => {
            get().checkSubscription();
          }, 0);
        }
      },

      // Plan access checks - All features unlocked for hackathon demo
      canAccessDeepAnalysis: () => true,

      canExportWithoutWatermark: () => true,

      canSaveHistory: () => true,
    }),
    {
      name: 'pitchperfect-user',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        userPlan: state.userPlan,
        planExpiresAt: state.planExpiresAt,
      }),
    }
  )
);

// Initialize auth on module load
useUserStore.getState().initializeAuth();
