import { apiService } from '../apiService';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  isDefault: boolean;
  cardInfo?: {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  paypalInfo?: {
    email: string;
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  clientSecret?: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  bookingId?: string;
  paymentMethodId?: string;
  createdAt: string;
  description: string;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

/**
 * PaymentService - Domain service for payment-related operations
 * Consolidates all payment API calls into a single service layer
 */
export class PaymentService {
  
  /**
   * Get user's payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiService.get<{ paymentMethods: PaymentMethod[] }>('/api/payments/methods');
    return response.paymentMethods;
  }

  /**
   * Add a new payment method
   */
  async addPaymentMethod(paymentMethodData: {
    type: PaymentMethod['type'];
    token: string;
    isDefault?: boolean;
  }): Promise<PaymentMethod> {
    return await apiService.post<PaymentMethod>('/api/payments/methods', paymentMethodData);
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(methodId: string, updateData: {
    isDefault?: boolean;
  }): Promise<PaymentMethod> {
    return await apiService.put<PaymentMethod>(`/api/payments/methods/${methodId}`, updateData);
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: string): Promise<{ success: boolean }> {
    return await apiService.delete<{ success: boolean }>(`/api/payments/methods/${methodId}`);
  }

  /**
   * Create payment intent for booking
   */
  async createPaymentIntent(paymentRequest: PaymentRequest): Promise<PaymentIntent> {
    return await apiService.post<PaymentIntent>('/api/payments/intent', paymentRequest);
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    return await apiService.post<{
      success: boolean;
      transactionId?: string;
      error?: string;
    }>(`/api/payments/confirm/${paymentIntentId}`, { paymentMethodId });
  }

  /**
   * Process refund
   */
  async processRefund(transactionId: string, amount?: number, reason?: string): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    return await apiService.post<{
      success: boolean;
      refundId?: string;
      error?: string;
    }>(`/api/payments/refund/${transactionId}`, { amount, reason });
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(filters?: {
    type?: Transaction['type'];
    status?: Transaction['status'];
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> {
    const response = await apiService.get<{ transactions: Transaction[] }>('/api/payments/transactions', filters);
    return response.transactions;
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(transactionId: string): Promise<Transaction> {
    return await apiService.get<Transaction>(`/api/payments/transactions/${transactionId}`);
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(bookingId: string, paypalData: {
    paymentId: string;
    payerId: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    return await apiService.post<{
      success: boolean;
      transactionId?: string;
      error?: string;
    }>('/api/payments/paypal/process', {
      bookingId,
      ...paypalData
    });
  }

  /**
   * Create PayPal payment
   */
  async createPayPalPayment(bookingId: string, amount: number): Promise<{
    paymentId: string;
    approvalUrl: string;
  }> {
    return await apiService.post<{
      paymentId: string;
      approvalUrl: string;
    }>('/api/payments/paypal/create', { bookingId, amount });
  }

  /**
   * Get payment receipt
   */
  async getPaymentReceipt(transactionId: string): Promise<{
    receiptUrl: string;
    receiptData: any;
  }> {
    return await apiService.get<{
      receiptUrl: string;
      receiptData: any;
    }>(`/api/payments/receipt/${transactionId}`);
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(methodId: string): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    return await apiService.post<{
      isValid: boolean;
      error?: string;
    }>(`/api/payments/validate/${methodId}`, {});
  }

  /**
   * Get payment status for booking
   */
  async getBookingPaymentStatus(bookingId: string): Promise<{
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    amount: number;
    currency: string;
    transactions: Transaction[];
  }> {
    return await apiService.get(`/api/payments/booking/${bookingId}/status`);
  }

  /**
   * Request payout (for hosts)
   */
  async requestPayout(amount: number, payoutMethodId?: string): Promise<{
    success: boolean;
    payoutId?: string;
    estimatedArrival?: string;
    error?: string;
  }> {
    return await apiService.post<{
      success: boolean;
      payoutId?: string;
      estimatedArrival?: string;
      error?: string;
    }>('/api/payments/payout', { amount, payoutMethodId });
  }
}

export const paymentService = new PaymentService();