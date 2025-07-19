const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class TransFiService {
  constructor() {
    this.baseURL = process.env.TRANSFI_API_URL || 'https://api.transfi.com/v1';
    this.apiKey = process.env.TRANSFI_API_KEY;
    this.secretKey = process.env.TRANSFI_SECRET_KEY;
    this.webhookSecret = process.env.TRANSFI_WEBHOOK_SECRET;
  }

  generateSignature(payload) {
    const message = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('hex');
  }

  async createPaymentIntent(booking) {
    try {
      const payload = {
        amount: booking.total_amount,
        currency: 'USD',
        description: `KeyLo Booking #${booking.id}`,
        reference_id: `booking-${booking.id}`,
        customer: {
          email: booking.user_email,
          name: `${booking.user_first_name} ${booking.user_last_name}`,
          id: booking.user_id.toString()
        },
        metadata: {
          booking_id: booking.id,
          vehicle_id: booking.vehicle_id,
          user_id: booking.user_id,
          start_date: booking.start_date,
          end_date: booking.end_date
        },
        payment_methods: ['card', 'bank_transfer', 'crypto'],
        return_url: `${process.env.FRONTEND_URL}/booking-confirmed`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout`
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(
        `${this.baseURL}/payments/intent`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Signature': signature,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        paymentIntentId: response.data.id,
        clientSecret: response.data.client_secret,
        paymentUrl: response.data.payment_url,
        expiresAt: response.data.expires_at
      };
    } catch (error) {
      console.error('TransFi payment intent error:', error.response?.data || error);
      throw new Error('Failed to create payment intent');
    }
  }

  verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async getPaymentStatus(paymentIntentId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payments/intent/${paymentIntentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        paymentMethod: response.data.payment_method,
        paidAt: response.data.paid_at
      };
    } catch (error) {
      console.error('TransFi get payment status error:', error);
      throw new Error('Failed to get payment status');
    }
  }

  async processRefund(paymentIntentId, amount, reason) {
    try {
      const payload = {
        payment_intent_id: paymentIntentId,
        amount: amount,
        reason: reason || 'customer_request',
        reference_id: `refund-${uuidv4()}`
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(
        `${this.baseURL}/refunds`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Signature': signature,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        processedAt: response.data.processed_at
      };
    } catch (error) {
      console.error('TransFi refund error:', error);
      throw new Error('Failed to process refund');
    }
  }
}

module.exports = new TransFiService(); 
