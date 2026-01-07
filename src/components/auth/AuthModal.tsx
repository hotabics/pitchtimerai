// Auth Modal Component - Lazy Registration Trigger

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserStore } from '@/stores/userStore';
import { toast } from '@/hooks/use-toast';

// Simple SVG icons for social providers
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export const AuthModal = () => {
  const { showAuthModal, authModalTrigger, closeAuthModal, login } = useUserStore();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const triggerMessages = {
    save: 'Save your winning pitch',
    coach: 'Unlock AI Coach analysis',
    export: 'Export your script',
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    setIsLoading(true);
    
    // Mock social login
    setTimeout(() => {
      const mockUser = {
        id: `${provider}-${Date.now()}`,
        email: `demo@${provider}.com`,
        name: provider === 'google' ? 'Google User' : 'GitHub User',
        provider,
      };
      
      login(mockUser);
      setIsLoading(false);
      closeAuthModal();
      
      toast({
        title: 'Welcome! 🎉',
        description: `Signed in with ${provider === 'google' ? 'Google' : 'GitHub'}`,
      });
    }, 1000);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    
    // Mock email auth
    setTimeout(() => {
      const mockUser = {
        id: `email-${Date.now()}`,
        email,
        name: email.split('@')[0],
        provider: 'email' as const,
      };
      
      login(mockUser);
      setIsLoading(false);
      closeAuthModal();
      
      toast({
        title: mode === 'signup' ? 'Account created! 🎉' : 'Welcome back!',
        description: `Signed in as ${email}`,
      });
    }, 1000);
  };

  if (!showAuthModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={closeAuthModal}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with gradient */}
          <div className="relative px-8 pt-8 pb-6 text-center bg-gradient-to-b from-primary/10 to-transparent">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">
              {triggerMessages[authModalTrigger || 'save']}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {mode === 'signup' ? 'Create a free account to continue' : 'Sign in to your account'}
            </p>
          </div>

          {/* Auth options */}
          <div className="px-8 pb-8 space-y-4">
            {/* Social buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 gap-3 text-base font-medium"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <GoogleIcon />
                Continue with Google
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 gap-3 text-base font-medium"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
              >
                <GitHubIcon />
                Continue with GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || !email || !password}
              >
                <Mail className="w-4 h-4 mr-2" />
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-muted-foreground">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
