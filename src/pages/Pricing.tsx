// Pricing Page Component

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown, Clock, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/userStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { STRIPE_PLANS } from '@/config/stripe';
import { trackEvent } from '@/utils/analytics';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: 'free' | 'pass_48h' | 'pro';
  name: string;
  tagline: string;
  price: string;
  period: string;
  highlight?: string;
  icon: typeof Sparkles;
  features: PlanFeature[];
  buttonText: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Hacker',
    tagline: 'For quick experiments',
    price: '€0',
    period: 'forever',
    icon: Sparkles,
    features: [
      { text: 'Unlimited Script Generation', included: true },
      { text: 'Basic Teleprompter', included: true },
      { text: 'Deep AI Analysis', included: false },
      { text: 'Save History', included: false },
      { text: 'Export without Watermark', included: false },
    ],
    buttonText: 'Current Plan',
  },
  {
    id: 'pass_48h',
    name: 'Hackathon Pass',
    tagline: 'Perfect for Demo Day',
    price: '€2.99',
    period: '48 hours',
    highlight: 'Best for Weekend',
    icon: Zap,
    features: [
      { text: 'Full AI Video Coach', included: true },
      { text: 'Eye Contact & Sentiment Analysis', included: true },
      { text: 'Remove Watermarks', included: true },
      { text: 'One-time Payment', included: true },
      { text: 'No Subscription', included: true },
    ],
    buttonText: 'Get 48h Access',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Founder Pro',
    tagline: 'For serious pitchers',
    price: '€9.99',
    period: 'month',
    icon: Crown,
    features: [
      { text: 'Everything in Pass', included: true },
      { text: 'Unlimited Projects', included: true },
      { text: 'Interview Mode', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Team Sharing (Soon)', included: true },
    ],
    buttonText: 'Subscribe',
  },
];

export const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userPlan, setUserPlan, isLoggedIn, openAuthModal, checkSubscription } = useUserStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Handle success/cancel redirects from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const plan = searchParams.get('plan');
    const canceled = searchParams.get('canceled');

    if (success === 'true' && plan) {
      trackEvent('subscription_purchased', { 
        plan, 
        source: 'stripe_redirect',
      });
      toast({
        title: '🎉 Payment successful!',
        description: `You now have access to ${plan === 'pass_48h' ? 'Hackathon Pass' : 'Founder Pro'}`,
      });
      checkSubscription();
      navigate('/pricing', { replace: true });
    } else if (canceled === 'true') {
      toast({
        title: 'Payment canceled',
        description: 'You can try again anytime.',
        variant: 'destructive',
      });
      navigate('/pricing', { replace: true });
    }
  }, [searchParams, checkSubscription, navigate]);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.id === 'free') return;
    if (userPlan === plan.id) return;

    trackEvent('pricing_plan_selected', { plan: plan.id, price: plan.price });
    setLoadingPlan(plan.id);

    // Simulate mock payment flow
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate expiration for 48h pass
    const expiresAt = plan.id === 'pass_48h' 
      ? new Date(Date.now() + 48 * 60 * 60 * 1000) 
      : null;

    // Update user plan in store (persisted to localStorage)
    setUserPlan(plan.id, expiresAt);

    // Track successful purchase
    trackEvent('subscription_purchased', { 
      plan: plan.id, 
      price: plan.price,
      source: 'pricing_page',
    });

    // Show success toast
    toast({
      title: '🚀 Payment Successful!',
      description: `Premium features unlocked. ${plan.id === 'pass_48h' ? 'Your 48h access starts now!' : 'Welcome to Founder Pro!'}`,
    });

    setLoadingPlan(null);

    // Redirect to AI Coach to experience unlocked features
    navigate('/ai-coach');
  };

  const handleManageSubscription = async () => {
    if (!isLoggedIn) {
      openAuthModal('save');
      return;
    }

    setLoadingPortal(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        openAuthModal('save');
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: 'Could not open portal',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNavigation onLogoClick={() => navigate('/')} />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-primary">Pitch Power</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From quick hackathon demos to investor-ready presentations. 
              Pick the plan that matches your ambition.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full flex flex-col ${
                  plan.popular 
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105 z-10' 
                    : 'border-border'
                }`}>
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 animate-pulse">
                        <Zap className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <plan.icon className="w-6 h-6" />
                    </div>

                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.tagline}</CardDescription>

                    {/* Price */}
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">/ {plan.period}</span>
                    </div>

                    {/* Highlight badge */}
                    {plan.highlight && (
                      <Badge variant="secondary" className="mt-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {plan.highlight}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-success flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={`w-full mt-6 h-12 text-base font-medium ${
                        plan.popular ? 'shadow-lg' : ''
                      }`}
                      variant={userPlan === plan.id ? 'outline' : plan.popular ? 'default' : 'secondary'}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={plan.id === 'free' || userPlan === plan.id || loadingPlan !== null}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {userPlan === plan.id 
                        ? '✓ Active Plan' 
                        : loadingPlan === plan.id 
                          ? 'Processing Payment...' 
                          : plan.id === 'free' 
                            ? 'Free Forever' 
                            : plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Manage Subscription & Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center space-y-4"
          >
            {isLoggedIn && userPlan !== 'free' && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="gap-2"
              >
                {loadingPortal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                Manage Subscription
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              🔒 Secure payment via Stripe • Cancel anytime • No hidden fees
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
