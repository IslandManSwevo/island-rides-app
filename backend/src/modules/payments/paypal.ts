import { env } from '../../config/env.js';
import type { CreateOrderResult, PaymentGateway } from './gateway.js';

const BASE = env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function accessToken(): Promise<string> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal is not configured (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)');
  }
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function paypalFetch(path: string, init: RequestInit = {}): Promise<any> {
  const token = await accessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal ${path} failed: ${res.status} ${body}`);
  }
  return res.status === 204 ? undefined : res.json();
}

const cents = (amountCents: number) => (amountCents / 100).toFixed(2);

/** PayPal Orders v2 + Payouts (design/04-backend-architecture.md). */
export const paypalGateway: PaymentGateway = {
  name: 'paypal',

  async createOrder(amountCents, intent, bookingId): Promise<CreateOrderResult> {
    const order = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent,
        purchase_units: [
          {
            reference_id: bookingId,
            amount: { currency_code: 'USD', value: cents(amountCents) },
          },
        ],
      }),
    });
    const approveUrl = order.links?.find((l: { rel: string }) => l.rel === 'approve')?.href ?? '';
    return { gatewayRef: order.id, approveUrl };
  },

  async captureOrder(gatewayRef) {
    await paypalFetch(`/v2/checkout/orders/${gatewayRef}/capture`, { method: 'POST' });
  },

  async voidAuthorization(gatewayRef) {
    // Authorization id is retrieved from the order; scaffold keeps the order-level ref.
    const order = await paypalFetch(`/v2/checkout/orders/${gatewayRef}`);
    const authId = order.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;
    if (authId) await paypalFetch(`/v2/payments/authorizations/${authId}/void`, { method: 'POST' });
  },

  async refund(gatewayRef, amountCents) {
    const order = await paypalFetch(`/v2/checkout/orders/${gatewayRef}`);
    const captureId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    if (!captureId) throw new Error(`No capture found for order ${gatewayRef}`);
    await paypalFetch(`/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      body: JSON.stringify(
        amountCents !== undefined ? { amount: { currency_code: 'USD', value: cents(amountCents) } } : {}
      ),
    });
  },

  async payout(email, amountCents, note) {
    const batch = await paypalFetch('/v1/payments/payouts', {
      method: 'POST',
      body: JSON.stringify({
        sender_batch_header: { email_subject: 'Your KeyLo payout' },
        items: [
          {
            recipient_type: 'EMAIL',
            receiver: email,
            note,
            amount: { currency: 'USD', value: cents(amountCents) },
          },
        ],
      }),
    });
    return batch.batch_header?.payout_batch_id ?? '';
  },

  async verifyWebhookSignature(headers, body) {
    if (!env.PAYPAL_WEBHOOK_ID) return false;
    const result = await paypalFetch('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: body,
      }),
    });
    return result.verification_status === 'SUCCESS';
  },
};
