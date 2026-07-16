/**
 * Paymob Integration — Egypt Local Payments
 *
 * This is a placeholder module for the Paymob payment gateway.
 * Implementation will be added in a dedicated task.
 *
 * Paymob supports:
 * - Card payments (Visa / Mastercard)
 * - Mobile wallets (Vodafone Cash, Etisalat Cash, Orange Money, WE Pay)
 * - Installments (Valu, Sympl, Souhoola)
 * - Cash on delivery
 *
 * Environment variables required:
 * - PAYMOB_API_KEY
 * - PAYMOB_INTEGRATION_ID
 * - PAYMOB_IFRAME_ID
 *
 * @see https://docs.paymob.com
 */

export const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

export interface PaymobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
}

export function getPaymobConfig(): PaymobConfig {
  const apiKey = process.env.PAYMOB_API_KEY;
  const integrationId = process.env.PAYMOB_INTEGRATION_ID;
  const iframeId = process.env.PAYMOB_IFRAME_ID;

  if (!apiKey || !integrationId || !iframeId) {
    throw new Error(
      'Paymob configuration is incomplete. Set PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, and PAYMOB_IFRAME_ID.',
    );
  }

  return { apiKey, integrationId, iframeId };
}

// TODO (Paymob Task):
// - Implement authentication token retrieval
// - Implement order registration
// - Implement payment key generation
// - Implement webhook signature verification
// - Handle all payment method types
