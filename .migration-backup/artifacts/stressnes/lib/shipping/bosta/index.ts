/**
 * Bosta Integration — Egypt Local Shipping
 *
 * This is a placeholder module for the Bosta courier integration.
 * Implementation will be added in a dedicated task.
 *
 * Bosta supports:
 * - Same-day and next-day delivery in major Egyptian cities
 * - Real-time shipment tracking
 * - Automatic SMS notifications to customers
 * - Cash on delivery (COD) collection
 *
 * Environment variables required:
 * - BOSTA_API_KEY
 *
 * @see https://app.bosta.co/docs
 */

export const BOSTA_BASE_URL = 'https://app.bosta.co/api/v2';

export type BostaDeliveryType =
  | 'SEND'         // Standard send
  | 'CASH_COLLECT' // Cash collection only
  | 'RETURN'       // Return from customer
  | 'EXCHANGE';    // Exchange item

export type BostaShipmentStatus =
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED';

export interface BostaAddress {
  firstLine: string;
  secondLine?: string;
  city: string;
  zone?: string;
  district?: string;
}

export interface BostaReceiver {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

// TODO (Bosta Task):
// - Implement createShipment()
// - Implement trackShipment()
// - Implement cancelShipment()
// - Implement webhook handler
// - Map internal city names to Bosta zone IDs
