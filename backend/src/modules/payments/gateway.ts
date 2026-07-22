/**
 * Gateway-neutral payment interface (design/04-backend-architecture.md).
 * PayPal is the interim rail; a future processor implements this same
 * interface and the rest of the codebase doesn't change.
 */
export interface CreateOrderResult {
  gatewayRef: string;
  approveUrl: string;
}

export interface PaymentGateway {
  readonly name: string;
  /** intent=AUTHORIZE for request-to-book, CAPTURE for Instant Book. */
  createOrder(amountCents: number, intent: 'AUTHORIZE' | 'CAPTURE', bookingId: string): Promise<CreateOrderResult>;
  captureOrder(gatewayRef: string): Promise<void>;
  voidAuthorization(gatewayRef: string): Promise<void>;
  refund(gatewayRef: string, amountCents?: number): Promise<void>;
  /** PayPal Payouts to the host's PayPal email; returns the batch ref. */
  payout(email: string, amountCents: number, note: string): Promise<string>;
  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<boolean>;
}
