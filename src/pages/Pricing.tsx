// Pricing Page Component

import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

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
  const { userPlan, setUserPlan, isLoggedIn, openAuthModal } = useUserStore();

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.id === 'free') {
      // Already on free
      return;
    }

    if (!isLoggedIn) {
      openAuthModal('save');
      return;
    }

    // Mock Stripe checkout
    toast({
      title: 'Redirecting to checkout...',
      description: `Setting up payment for ${plan.name}`,
    });

    // Simulate checkout completion
    setTimeout(() => {
      const expiresAt = plan.id === 'pass_48h' 
        ? new Date(Date.now() + 48 * 60 * 60 * 1000) 
        : null;
      
      setUserPlan(plan.id, expiresAt);
      
      toast({
        title: '🎉 Payment successful!',
        description: `You now have access to ${plan.name}`,
      });
      
      navigate('/');
    }, 1500);
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
                      disabled={userPlan === plan.id}
                    >
                      {userPlan === plan.id ? 'Current Plan' : plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* FAQ or trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
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
