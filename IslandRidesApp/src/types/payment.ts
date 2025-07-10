import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export interface PaymentMethod {
  id: string;
  name: string;
  icon: IconName;
  processingTime: string;
}

export interface PaymentMethodsResponse {
  methods: PaymentMethod[];
}

export interface PaymentIntentResponse {
  paymentUrl?: string;
  instructions?: any;
  reference?: string;
  walletAddress?: string;
  amount?: number;
  currency?: string;
  qrCode?: string;
}

export type RootStackParamList = {
  Payment: {
    booking: {
      id: number;
      total_amount: number;
      start_date: string;
      end_date: string;
      vehicle: any;
    };
  };
  BookingConfirmed: { booking: any };
  BankTransferInstructions: any;
  CryptoPayment: any;
};