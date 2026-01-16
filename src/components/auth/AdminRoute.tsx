// Admin Route component - checks admin role server-side before allowing access

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useUserStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!isLoggedIn || !user) {
        // Not logged in - redirect to auth
        const returnTo = encodeURIComponent(location.pathname + location.search);
        navigate(`/auth?returnTo=${returnTo}`, { replace: true });
        return;
      }

      setIsChecking(true);
      
      try {
        // Query the user_roles table to check admin status
        // RLS policy allows users to view their own roles
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Failed to check admin role:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Small delay to allow auth state to initialize
    const timer = setTimeout(checkAdminRole, 100);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, navigate, location]);

  // Show loading while checking auth/admin state
  if (!isLoggedIn || !user || isChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
