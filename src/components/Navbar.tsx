// Global Responsive Navbar Component with glassmorphism and mobile drawer

import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Sparkles, LogOut, User, CreditCard, Zap, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

// Navigation links configuration
const guestLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
];

const userLinks = [
  { label: 'Dashboard', href: '/' },
  { label: 'My Projects', href: '/profile' },
];

const aiCoachLink = { label: 'AI Coach', href: '/ai-coach' };

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, isLoggedIn, userPlan, logout } = useUserStore();
  const { toggleTheme, isDark } = useTheme();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    return location.pathname === href;
  };

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      e.preventDefault();
      const hash = href.substring(1); // Get '#features' from '/#features'
      
      if (location.pathname === '/') {
        // Already on home page, just scroll to section
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to home page then scroll
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  const navLinks = isLoggedIn ? userLinks : guestLinks;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/80">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <Link 
          to={isLoggedIn ? '/' : '/'} 
          className="flex items-center gap-2 font-bold text-xl"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            PitchPerfect
          </span>
        </Link>

        {/* Center: Navigation (Desktop Only) */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={(e) => handleHashClick(e, link.href)}
              className={({ isActive: active }) =>
                cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  active || isActive(link.href)
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          
          {/* AI Coach - Special styling */}
          <NavLink
            to={aiCoachLink.href}
            className={({ isActive: active }) =>
              cn(
                'px-4 py-2 rounded-md text-sm font-semibold transition-colors',
                active || isActive(aiCoachLink.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-primary/80 hover:text-primary hover:bg-primary/5'
              )
            }
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {aiCoachLink.label}
            </span>
          </NavLink>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Upgrade Button for Free Users */}
                {userPlan === 'free' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Upgrade
                  </Button>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {user?.name ? getInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile & Stats
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pricing" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-background">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  PitchPerfect
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-8 flex flex-col gap-4">
                {/* User Info (if logged in) */}
                {isLoggedIn && user && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={(e) => {
                        handleHashClick(e, link.href);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive(link.href)
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  {/* AI Coach Link */}
                  <Link
                    to={aiCoachLink.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2',
                      isActive(aiCoachLink.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-primary/80 hover:bg-primary/5 hover:text-primary'
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiCoachLink.label}
                  </Link>
                </div>

                {/* Theme Toggle in Mobile */}
                <button
                  onClick={toggleTheme}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center gap-2 w-full text-left"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="h-px bg-border my-2" />

                {/* Actions */}
                {isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    {userPlan === 'free' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate('/pricing');
                          setMobileOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    )}
                    
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Profile & Stats
                    </Link>
                    
                    <Link
                      to="/pricing"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Subscription
                    </Link>
                    
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        navigate('/auth');
                        setMobileOpen(false);
                      }}
                    >
                      Log In
                    </Button>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        navigate('/auth');
                        setMobileOpen(false);
                      }}
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
