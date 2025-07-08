import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { apiService } from './apiService';
import { notificationService } from './notificationService';

export interface Receipt {
  booking: {
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    duration: number;
    totalAmount: number;
    createdAt: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    location: string;
    dailyRate: number;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payment: {
    transactionId: string;
    amount: number;
    currency: string;
    method: string;
    date: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export interface PaymentHistory {
  bookingId: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  make: string;
  model: string;
  year: number;
  transactionId: string;
  paymentMethod: string;
  paymentDate: string;
}

class ReceiptService {
  async getReceipt(bookingId: number): Promise<Receipt> {
    try {
      const response = await apiService.get<{ receipt: Receipt }>(`/payments/receipt/${bookingId}`);
      return response.receipt;
    } catch (error) {
      console.error('Failed to fetch receipt:', error);
      throw new Error('Failed to fetch receipt');
    }
  }

  async getPaymentHistory(page: number = 1, limit: number = 10): Promise<{
    payments: PaymentHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await apiService.get<{
        payments: PaymentHistory[];
        pagination: any;
      }>(`/payments/history?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  generateReceiptHTML(receipt: Receipt): string {
    const { booking, vehicle, customer, payment, company } = receipt;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Receipt - ${company.name}</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f8f9fa;
                color: #333;
            }
            .receipt-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: #007AFF;
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .header p {
                margin: 5px 0 0 0;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .section {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }
            .section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #007AFF;
                margin-bottom: 15px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                align-items: center;
            }
            .detail-label {
                color: #666;
                font-weight: 500;
            }
            .detail-value {
                font-weight: 600;
                text-align: right;
            }
            .total-amount {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-top: 10px;
            }
            .total-amount .detail-value {
                font-size: 20px;
                color: #007AFF;
            }
            .vehicle-info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 6px;
                text-align: center;
            }
            .vehicle-name {
                font-size: 20px;
                font-weight: 600;
                color: #333;
                margin-bottom: 5px;
            }
            .vehicle-location {
                color: #666;
            }
            .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            @media print {
                body { margin: 0; background: white; }
                .receipt-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <h1>${company.name}</h1>
                <p>${company.address}</p>
                <p>${company.phone} • ${company.email}</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <div class="section-title">Payment Receipt</div>
                    <div class="detail-row">
                        <span class="detail-label">Receipt #:</span>
                        <span class="detail-value">${booking.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">${payment.transactionId || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Date:</span>
                        <span class="detail-value">${formatDate(payment.date || booking.createdAt)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Method:</span>
                        <span class="detail-value">${payment.method || 'Transfi'}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Customer Information</div>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${customer.firstName} ${customer.lastName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${customer.email}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Vehicle & Rental Details</div>
                    <div class="vehicle-info">
                        <div class="vehicle-name">${vehicle.make} ${vehicle.model} ${vehicle.year}</div>
                        <div class="vehicle-location">📍 ${vehicle.location}</div>
                    </div>
                    <br>
                    <div class="detail-row">
                        <span class="detail-label">Rental Start:</span>
                        <span class="detail-value">${formatDate(booking.startDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Rental End:</span>
                        <span class="detail-value">${formatDate(booking.endDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${booking.duration} day${booking.duration !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Daily Rate:</span>
                        <span class="detail-value">${formatCurrency(vehicle.dailyRate)}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Payment Summary</div>
                    <div class="detail-row">
                        <span class="detail-label">Subtotal (${booking.duration} × ${formatCurrency(vehicle.dailyRate)}):</span>
                        <span class="detail-value">${formatCurrency(booking.duration * vehicle.dailyRate)}</span>
                    </div>
                    <div class="total-amount">
                        <div class="detail-row">
                            <span class="detail-label"><strong>Total Paid:</strong></span>
                            <span class="detail-value">${formatCurrency(booking.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for choosing ${company.name}!</p>
                    <p>Questions? Contact us at ${company.email} or ${company.phone}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async generatePDF(receipt: Receipt): Promise<string> {
    try {
      const html = this.generateReceiptHTML(receipt);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      return uri;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw new Error('Failed to generate receipt PDF');
    }
  }

  async shareReceipt(receipt: Receipt): Promise<void> {
    try {
      notificationService.info('Generating receipt...', { duration: 2000 });
      
      const pdfUri = await this.generatePDF(receipt);
      
      // Check if sharing is available on this platform
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        notificationService.error('Sharing is not available on this platform');
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Receipt - ${receipt.company.name}`,
      });
      
      notificationService.success('Receipt shared successfully!');
    } catch (error) {
      console.error('Failed to share receipt:', error);
      notificationService.error('Failed to share receipt');
    }
  }

  async printReceipt(receipt: Receipt): Promise<void> {
    try {
      const html = this.generateReceiptHTML(receipt);
      
      await Print.printAsync({
        html,
      });
      
      notificationService.success('Receipt sent to printer!');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      notificationService.error('Failed to print receipt');
    }
  }

  async downloadReceipt(receipt: Receipt): Promise<string> {
    try {
      notificationService.info('Downloading receipt...', { duration: 2000 });
      
      const pdfUri = await this.generatePDF(receipt);
      const fileName = `receipt_${receipt.booking.id}.pdf`;
      
      if (Platform.OS === 'android') {
        const downloadDir = FileSystem.documentDirectory;
        const destinationPath = `${downloadDir}/${fileName}`;
        
        await FileSystem.copyAsync({ from: pdfUri, to: destinationPath });
        notificationService.success(`Receipt downloaded to Downloads/${fileName}`);
        return destinationPath;
      } else {
        notificationService.success('Receipt saved to Files app');
        return pdfUri;
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      notificationService.error('Failed to download receipt');
      throw error;
    }
  }
}

export const receiptService = new ReceiptService(); 