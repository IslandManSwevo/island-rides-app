import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { apiService } from './apiService';
import { notificationService } from './notificationService';
import { generateReceiptHTML as generateReceiptHTMLTemplate } from './receiptHtmlTemplate';

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
    return generateReceiptHTMLTemplate(receipt);
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
        return await this._downloadToAndroid(pdfUri, fileName);
      } else {
        // For iOS, sharing the file URI is often sufficient as it opens in the Files app context
        notificationService.success('Receipt ready to be saved to Files.');
        return pdfUri;
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      notificationService.error('Failed to download receipt');
      throw error;
    }
  }

  private async _downloadToAndroid(pdfUri: string, fileName: string): Promise<string> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return this._fallbackToDocumentDirectory(pdfUri, fileName);
      }

      const cacheDir = FileSystem.cacheDirectory;
      const tempPath = `${cacheDir}${fileName}`;
      await FileSystem.copyAsync({ from: pdfUri, to: tempPath });

      const asset = await MediaLibrary.createAssetAsync(tempPath);
      let album = await MediaLibrary.getAlbumAsync('Download');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      await FileSystem.deleteAsync(tempPath, { idempotent: true });
      notificationService.success(`Receipt downloaded to Downloads/${fileName}`);
      return asset.uri;
    } catch (mediaError) {
      console.warn('Media library access failed, falling back to document directory:', mediaError);
      return this._fallbackToDocumentDirectory(pdfUri, fileName);
    }
  }

  private async _fallbackToDocumentDirectory(pdfUri: string, fileName: string): Promise<string> {
    const downloadDir = FileSystem.documentDirectory;
    const destinationPath = `${downloadDir}${fileName}`;
    await FileSystem.copyAsync({ from: pdfUri, to: destinationPath });
    notificationService.success(`Receipt saved to app directory: ${fileName}`);
    return destinationPath;
  }
}

export const receiptService = new ReceiptService();