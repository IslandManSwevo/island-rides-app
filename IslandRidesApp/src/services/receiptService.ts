import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
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
      const response = await apiService.get<Receipt>(`/bookings/${bookingId}/receipt`);
      return response;
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
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/payments/history?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  generateReceiptHTML(receipt: Receipt): string {
    const { booking, vehicle, customer, payment, company } = receipt || {};
    
    // Helper function to safely format dates with null/undefined checks
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        return 'Invalid Date';
      }
    };

    // Helper function to safely format currency with null/undefined checks
    const formatCurrency = (amount: number | null | undefined, currency: string = 'USD') => {
      if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount);
      } catch (error) {
        return `$${amount.toFixed(2)}`;
      }
    };

    // Helper function to safely escape HTML
    const escapeHtml = (text: string | null | undefined) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Safe data extraction with fallbacks
    const safeBooking = {
      id: booking?.id ?? 'N/A',
      duration: booking?.duration || 0,
      startDate: booking?.startDate,
      endDate: booking?.endDate,
      totalAmount: booking?.totalAmount || 0,
      createdAt: booking?.createdAt
    };

    const safeVehicle = {
      make: escapeHtml(vehicle?.make) || 'Unknown',
      model: escapeHtml(vehicle?.model) || 'Vehicle',
      year: vehicle?.year,
      location: escapeHtml(vehicle?.location) || 'Unknown Location',
      dailyRate: vehicle?.dailyRate || 0
    };

    const safeCustomer = {
      firstName: escapeHtml(customer?.firstName) || 'Valued',
      lastName: escapeHtml(customer?.lastName) || 'Customer',
      email: escapeHtml(customer?.email) || 'N/A'
    };

    const safePayment = {
      transactionId: escapeHtml(payment?.transactionId) || 'N/A',
      method: escapeHtml(payment?.method) || 'N/A',
      date: payment?.date || safeBooking.createdAt,
      currency: payment?.currency || 'USD'
    };

    const safeCompany = {
      name: escapeHtml(company?.name) || 'Island Rides',
      address: escapeHtml(company?.address) || 'Bahamas',
      phone: escapeHtml(company?.phone) || 'N/A',
      email: escapeHtml(company?.email) || 'info@islandrides.com'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Receipt - ${safeCompany.name}</title>
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
                <h1>${safeCompany.name}</h1>
                <p>${safeCompany.address}</p>
                <p>${safeCompany.phone} • ${safeCompany.email}</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <div class="section-title">Payment Receipt</div>
                    <div class="detail-row">
                        <span class="detail-label">Receipt #:</span>
                        <span class="detail-value">${safeBooking.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">${safePayment.transactionId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Date:</span>
                        <span class="detail-value">${formatDate(safePayment.date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Method:</span>
                        <span class="detail-value">${safePayment.method}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Customer Information</div>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${safeCustomer.firstName} ${safeCustomer.lastName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${safeCustomer.email}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Vehicle & Rental Details</div>
                    <div class="vehicle-info">
                        <div class="vehicle-name">${safeVehicle.make} ${safeVehicle.model} ${safeVehicle.year || ''}</div>
                        <div class="vehicle-location">📍 ${safeVehicle.location}</div>
                    </div>
                    <br>
                    <div class="detail-row">
                        <span class="detail-label">Rental Start:</span>
                        <span class="detail-value">${formatDate(safeBooking.startDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Rental End:</span>
                        <span class="detail-value">${formatDate(safeBooking.endDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${safeBooking.duration} day${safeBooking.duration !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Daily Rate:</span>
                        <span class="detail-value">${formatCurrency(safeVehicle.dailyRate, safePayment.currency)}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Payment Summary</div>
                    <div class="detail-row">
                        <span class="detail-label">Subtotal (${safeBooking.duration} × ${formatCurrency(safeVehicle.dailyRate, safePayment.currency)}):</span>
                        <span class="detail-value">${formatCurrency(safeBooking.duration * safeVehicle.dailyRate, safePayment.currency)}</span>
                    </div>
                    <div class="total-amount">
                        <div class="detail-row">
                            <span class="detail-label"><strong>Total Paid:</strong></span>
                            <span class="detail-value">${formatCurrency(safeBooking.totalAmount, safePayment.currency)}</span>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for choosing ${safeCompany.name}!</p>
                    <p>Questions? Contact us at ${safeCompany.email} or ${safeCompany.phone}</p>
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
        dialogTitle: `Receipt - ${receipt.company?.name || 'Island Rides'}`,
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
      const fileName = `receipt_${receipt.booking?.id || 'unknown'}.pdf`;
      
      if (Platform.OS === 'android') {
        try {
          // Request media library permissions
          const { status } = await MediaLibrary.requestPermissionsAsync();
          
          if (status !== 'granted') {
            // Fall back to document directory if permissions denied
            const downloadDir = FileSystem.documentDirectory;
            const destinationPath = `${downloadDir}${fileName}`;
            
            await FileSystem.copyAsync({ from: pdfUri, to: destinationPath });
            notificationService.success(`Receipt saved to app directory: ${fileName}`);
            return destinationPath;
          }

          // Copy to cache directory first
          const cacheDir = FileSystem.cacheDirectory;
          const tempPath = `${cacheDir}${fileName}`;
          
          await FileSystem.copyAsync({ from: pdfUri, to: tempPath });
          
          // Create media library asset
          const asset = await MediaLibrary.createAssetAsync(tempPath);
          
          // Get or create Downloads album
          let album = await MediaLibrary.getAlbumAsync('Download');
          if (!album) {
            album = await MediaLibrary.createAlbumAsync('Download', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
          
          // Clean up temporary file
          await FileSystem.deleteAsync(tempPath, { idempotent: true });
          
          notificationService.success(`Receipt downloaded to Downloads/${fileName}`);
          return asset.uri;
        } catch (mediaError) {
          console.warn('Media library access failed, falling back to document directory:', mediaError);
          
          // Fallback to document directory
          const downloadDir = FileSystem.documentDirectory;
          const destinationPath = `${downloadDir}${fileName}`;
          
          await FileSystem.copyAsync({ from: pdfUri, to: destinationPath });
          notificationService.success(`Receipt saved to app directory: ${fileName}`);
          return destinationPath;
        }
      } else {
        // iOS - Files app integration works automatically
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