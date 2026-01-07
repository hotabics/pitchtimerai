import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Sun, Menu, X, User, LogIn, Crown, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/stores/userStore";

interface HeaderProps {
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onLogoClick?: () => void;
  showNavigation?: boolean;
}

const navItems = [
  { label: "Features", href: "#features" },
  { label: "AI Coach", href: "#ai-coach" },
  { label: "Pricing", href: "/pricing", isRoute: true },
];

export const Header = ({ showProgress, currentStep = 0, totalSteps = 7, onLogoClick, showNavigation = false }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, user, userPlan, logout, openAuthModal } = useUserStore();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isRoute?: boolean) => {
    if (isRoute) {
      // Let the Link component handle it
      setMobileMenuOpen(false);
      return;
    }
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getPlanBadge = () => {
    if (userPlan === 'pro') return { label: 'PRO', icon: Crown, variant: 'default' as const };
    if (userPlan === 'pass_48h') return { label: '48H', icon: Zap, variant: 'secondary' as const };
    return null;
  };

  const planBadge = getPlanBadge();

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                PitchDeck<span className="text-primary">AI</span>
              </span>
            </button>

            {/* Desktop Navigation Links */}
            {showNavigation && !showProgress && (
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                  item.isRoute ? (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </a>
                  )
                ))}
              </nav>
            )}

            <div className="flex items-center gap-2">
              {showProgress && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* User Avatar / Login Button */}
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 px-2 gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {planBadge && (
                        <Badge variant={planBadge.variant} className="h-5 px-1.5 text-[10px] gap-0.5">
                          <planBadge.icon className="w-3 h-3" />
                          {planBadge.label}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/pricing" className="cursor-pointer">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => openAuthModal('save')}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Log In</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Mobile Menu Button */}
              {showNavigation && !showProgress && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="h-8 w-8 md:hidden"
                >
                  <AnimatePresence mode="wait">
                    {mobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <X className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Menu className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span className="sr-only">Toggle menu</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && showNavigation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg md:hidden"
            style={{ top: "57px" }}
          >
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center justify-center gap-8 pt-20"
            >
              {navItems.map((item, index) => (
                item.isRoute ? (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xl font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="text-xl font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </motion.a>
                )
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
