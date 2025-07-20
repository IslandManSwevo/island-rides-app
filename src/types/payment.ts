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

export interface PaymentInstructions {
  step: number;
  description: string;
  action?: string;
}

export interface PaymentIntentResponse {
  paymentUrl?: string;
  instructions?: PaymentInstructions[];
  reference?: string;
  walletAddress?: string;
  amount?: number;
  currency?: string;
  qrCode?: string;
}