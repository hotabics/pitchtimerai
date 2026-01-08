// Payment Modal Component - In-place payment for seamless upgrade flow

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2, Check, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/utils/analytics';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentModal = ({ isOpen, onClose, onSuccess }: PaymentModalProps) => {
  const { setUserPlan } = useUserStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    trackEvent('payment_initiated', { plan: 'pass_48h', price: 2.99 });

    // Simulate payment processing (mock for hackathon)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate expiration for 48h pass
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Update global user state - this triggers React re-renders
    setUserPlan('pass_48h', expiresAt);

    setIsProcessing(false);

    // Track successful purchase
    trackEvent('subscription_purchased', { 
      plan: 'pass_48h', 
      price: 2.99, 
      currency: 'EUR',
      duration_hours: 48,
    });

    // Show success toast
    toast({
      title: '🎉 Features Unlocked!',
      description: 'Your 48h Hackathon Pass is now active. Enjoy full analysis!',
    });

    // Close modal
    onClose();

    // Optional callback
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>

                <h2 className="text-2xl font-bold mb-2">Hackathon Pass</h2>
                <p className="text-muted-foreground text-sm">
                  Unlock full AI analysis for your pitch
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Price */}
                <div className="text-center">
                  <span className="text-4xl font-bold">€2.99</span>
                  <span className="text-muted-foreground ml-2">/ 48 hours</span>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {[
                    'Deep AI Video Analysis',
                    'Content Coverage Insights',
                    'Jury Verdict & Score',
                    'Detailed Recommendations',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Timer badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Perfect for Demo Day weekend</span>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-medium shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Pay €2.99 & Unlock
                    </>
                  )}
                </Button>

                {/* Trust signals */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Secure payment • No subscription • One-time only</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
