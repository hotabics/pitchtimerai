// Paywall Overlay Component - Glass effect blur with unlock CTA

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentModal } from './PaymentModal';

interface PaywallOverlayProps {
  title?: string;
  description?: string;
  ctaText?: string;
  price?: string;
}

export const PaywallOverlay = ({
  title = 'Unlock Deep Analysis',
  description = 'Get detailed AI feedback on your pitch delivery',
  ctaText = 'Unlock with Hackathon Pass',
  price = '€2.99',
}: PaywallOverlayProps) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-20 flex items-center justify-center"
      >
        {/* Glassmorphism backdrop */}
        <div className="absolute inset-0 backdrop-blur-md bg-background/60" />
        
        {/* Content card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 text-center p-8 rounded-2xl bg-background/80 border border-primary/20 shadow-2xl max-w-sm mx-4"
        >
          {/* Lock icon with glow */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-6">{description}</p>

          {/* Price badge */}
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold">
            <Zap className="w-4 h-4" />
            {price} for 48 hours
          </div>

          {/* CTA Button - Opens modal instead of navigating */}
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="w-full h-12 text-base font-medium shadow-lg shadow-primary/30"
          >
            <Zap className="w-4 h-4 mr-2" />
            {ctaText}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            One-time payment • No subscription
          </p>
        </motion.div>
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </>
  );
};
