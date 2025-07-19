const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class PayPalService {
  constructor() {
    this.baseURL = process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.webhookId = process.env.PAYPAL_WEBHOOK_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 90% of actual expiry to ensure we refresh before it expires
      this.tokenExpiry = Date.now() + (response.data.expires_in * 900);
      
      return this.accessToken;
    } catch (error) {
      console.error('PayPal token error:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal access token');
    }
  }

  async createOrder(booking) {
    try {
      const accessToken = await this.getAccessToken();
      
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `booking-${booking.id}`,
          amount: {
            currency_code: 'USD',
            value: booking.total_amount.toFixed(2)
          },
          description: `KeyLo Booking #${booking.id} - ${booking.vehicle_make} ${booking.vehicle_model}`,
          custom_id: booking.id.toString(),
          invoice_id: `IR-${booking.id}-${Date.now()}`
        }],
        application_context: {
          brand_name: 'KeyLo',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment-success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': uuidv4()
          }
        }
      );

      const order = response.data;
      const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;

      return {
        orderId: order.id,
        paymentUrl: approvalUrl,
        status: order.status
      };
    } catch (error) {
      console.error('PayPal order creation error:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal order');
    }
  }

  async captureOrder(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': uuidv4()
          }
        }
      );

      const captureData = response.data;
      const capture = captureData.purchase_units[0].payments.captures[0];

      return {
        orderId: captureData.id,
        captureId: capture.id,
        status: capture.status,
        amount: capture.amount.value,
        currency: capture.amount.currency_code,
        paidAt: capture.create_time,
        paymentMethod: 'paypal'
      };
    } catch (error) {
      console.error('PayPal capture error:', error.response?.data || error.message);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  async getOrderDetails(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayPal order details error:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    }
  }

  async processRefund(captureId, amount, reason) {
    try {
      const accessToken = await this.getAccessToken();
      
      const refundData = {
        amount: {
          value: amount.toFixed(2),
          currency_code: 'USD'
        },
        note_to_payer: reason || 'Refund for KeyLo booking cancellation'
      };

      const response = await axios.post(
        `${this.baseURL}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': uuidv4()
          }
        }
      );

      return {
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.amount.value,
        currency: response.data.amount.currency_code
      };
    } catch (error) {
      console.error('PayPal refund error:', error.response?.data || error.message);
      throw new Error('Failed to process PayPal refund');
    }
  }

  verifyWebhookSignature(headers, body) {
    try {
      // PayPal webhook verification would go here
      // For now, we'll implement basic verification
      const authAlgo = headers['paypal-auth-algo'];
      const transmission = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const signature = headers['paypal-transmission-sig'];
      const timestamp = headers['paypal-transmission-time'];
      
      // In production, you would verify the signature using PayPal's SDK
      // For now, we'll just check if required headers are present
      return authAlgo && transmission && certId && signature && timestamp;
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }
}

module.exports = new PayPalService();
