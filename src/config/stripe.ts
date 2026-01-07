// Stripe pricing configuration
// NOTE: Replace these placeholder IDs with your actual Stripe price IDs from your dashboard

export const STRIPE_PLANS = {
  hackathon_pass: {
    id: 'pass_48h',
    name: 'Hackathon Pass',
    price: 299, // cents
    currency: 'eur',
    priceId: 'price_1Sn5LULk0vZfnO7EtgVaKiYs',
    type: 'one_time' as const,
    duration: 48 * 60 * 60 * 1000, // 48 hours in ms
  },
  founder_pro: {
    id: 'pro',
    name: 'Founder Pro',
    price: 999, // cents
    currency: 'eur',
    priceId: 'price_1Sn5MFLk0vZfnO7E6aFnih1C',
    type: 'subscription' as const,
    interval: 'month' as const,
  },
} as const;

export type StripePlanType = keyof typeof STRIPE_PLANS;
