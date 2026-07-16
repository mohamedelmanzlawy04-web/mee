import Stripe from 'stripe';

/**
 * Stripe SDK — International Payment Abstraction
 *
 * Primary payment provider for international orders.
 * For Egypt-local orders, use Paymob (lib/payments/paymob/).
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY
 * - STRIPE_PUBLISHABLE_KEY
 * - STRIPE_WEBHOOK_SECRET
 *
 * Note: Stripe is optional in this project (Paymob is primary for EG).
 * The stripe instance is lazily initialized to avoid build errors when
 * STRIPE_SECRET_KEY is not yet configured.
 */

function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to your environment variables.',
    );
  }
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
    appInfo: {
      name: 'STRESSNES',
      version: '1.0.0',
    },
  });
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return createStripeClient()[prop as keyof Stripe];
  },
});

/* ── Amount helpers ──────────────────────────────────────────── */

/**
 * Convert a display price (e.g. 99.99) to the smallest currency unit
 * (e.g. 9999 cents for USD, or 9999 piastres for EGP).
 */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert a Stripe amount (smallest unit) back to display price.
 */
export function fromStripeAmount(amount: number): number {
  return amount / 100;
}

/* ── Webhook verification ────────────────────────────────────── */

/**
 * Verify and parse a Stripe webhook event.
 * Always verify webhooks — never trust raw POST bodies.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
