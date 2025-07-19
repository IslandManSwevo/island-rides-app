const axios = require('axios');
const { query } = require('../db');

class PayPalService {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
  }

  async getAccessToken() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Accept-Language': 'en_US'
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting PayPal access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  async createOrder(bookingId, amount, currency = 'USD') {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: amount.toString()
            },
            reference_id: bookingId.toString(),
            description: `Car rental booking #${bookingId}`
          }],
          application_context: {
            brand_name: 'KeyLo',
            landing_page: 'BILLING',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: `${process.env.API_BASE_URL}/api/payments/paypal/success`,
            cancel_url: `${process.env.API_BASE_URL}/api/payments/paypal/cancel`
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const order = response.data;
      
      // Store PayPal order in database
      await query(
        `INSERT INTO paypal_transactions (booking_id, paypal_order_id, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [bookingId, order.id, amount, currency, 'created']
      );

      return {
        orderId: order.id,
        status: order.status,
        approveUrl: order.links.find(link => link.rel === 'approve')?.href,
        amount: amount,
        currency: currency
      };
    } catch (error) {
      console.error('Error creating PayPal order:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal order');
    }
  }

  async captureOrder(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const capture = response.data;
      
      if (capture.status === 'COMPLETED') {
        const captureId = capture.purchase_units[0].payments.captures[0].id;
        
        // Update PayPal transaction
        await query(
          `UPDATE paypal_transactions 
           SET status = 'captured', paypal_capture_id = $1, updated_at = CURRENT_TIMESTAMP
           WHERE paypal_order_id = $2`,
          [captureId, orderId]
        );

        return {
          success: true,
          captureId: captureId,
          amount: capture.purchase_units[0].payments.captures[0].amount.value,
          currency: capture.purchase_units[0].payments.captures[0].amount.currency_code
        };
      } else {
        throw new Error('PayPal capture failed');
      }
    } catch (error) {
      console.error('Error capturing PayPal order:', error.response?.data || error.message);
      throw new Error('Failed to capture PayPal order');
    }
  }

  async refundPayment(captureId, amount, currency = 'USD') {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        {
          amount: {
            currency_code: currency,
            value: amount.toString()
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const refund = response.data;
      
      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount.value,
        currency: refund.amount.currency_code,
        status: refund.status
      };
    } catch (error) {
      console.error('Error refunding PayPal payment:', error.response?.data || error.message);
      throw new Error('Failed to refund PayPal payment');
    }
  }

  async getOrderDetails(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting PayPal order details:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    }
  }

  async verifyWebhookSignature(headers, body) {
    // PayPal webhook signature verification
    // This is a placeholder for webhook verification
    // In production, implement proper signature verification
    return true;
  }

  async handleWebhook(event) {
    try {
      const { event_type, resource } = event;
      
      switch (event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCompleted(resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePaymentDenied(resource);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handlePaymentRefunded(resource);
          break;
        default:
          console.log(`Unhandled PayPal webhook event: ${event_type}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error handling PayPal webhook:', error);
      throw error;
    }
  }

  async handlePaymentCompleted(resource) {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    if (orderId) {
      await query(
        `UPDATE paypal_transactions 
         SET status = 'captured', updated_at = CURRENT_TIMESTAMP
         WHERE paypal_order_id = $1`,
        [orderId]
      );
    }
  }

  async handlePaymentDenied(resource) {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    if (orderId) {
      await query(
        `UPDATE paypal_transactions 
         SET status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE paypal_order_id = $1`,
        [orderId]
      );
    }
  }

  async handlePaymentRefunded(resource) {
    const captureId = resource.id;
    await query(
      `UPDATE paypal_transactions 
       SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
       WHERE paypal_capture_id = $1`,
      [captureId]
    );
  }

  async getTransactionHistory(bookingId) {
    try {
      const result = await query(
        `SELECT * FROM paypal_transactions WHERE booking_id = $1 ORDER BY created_at DESC`,
        [bookingId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting PayPal transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }
}

module.exports = new PayPalService();
