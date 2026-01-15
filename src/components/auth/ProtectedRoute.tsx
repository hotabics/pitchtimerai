// Protected Route component - redirects to /auth if not logged in

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useUserStore();

  useEffect(() => {
    // Small delay to allow auth state to initialize
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        // Redirect to auth with return URL
        const returnTo = encodeURIComponent(location.pathname + location.search);
        navigate(`/auth?returnTo=${returnTo}`, { replace: true });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoggedIn, navigate, location]);

  // Show loading while checking auth state
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
