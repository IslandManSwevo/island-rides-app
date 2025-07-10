import { apiService } from './apiService';

export interface PricingConfig {
  insuranceFeePerDay: number;
  serviceFee: number;
  taxRate: number;
  minRentalDays: number;
  maxRentalDays: number;
  minAdvanceBookingHours: number;
}

export interface BusinessRules {
  minRentalPeriod: number; // in days
  maxRentalPeriod: number; // in days
  minAdvanceBooking: number; // in hours
  maxAdvanceBooking: number; // in days
}

class PricingConfigService {
  private static instance: PricingConfigService;
  private cachedConfig: PricingConfig | null = null;
  private cachedBusinessRules: BusinessRules | null = null;
  private configCacheExpiry: number = 0;
  private rulesCacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): PricingConfigService {
    if (!PricingConfigService.instance) {
      PricingConfigService.instance = new PricingConfigService();
    }
    return PricingConfigService.instance;
  }

  async getPricingConfig(): Promise<PricingConfig> {
    const now = Date.now();
    
    if (this.cachedConfig && now < this.configCacheExpiry) {
      return this.cachedConfig;
    }

    try {
      const config = await apiService.get<PricingConfig>('/api/config/pricing');
      this.cachedConfig = config;
      this.configCacheExpiry = now + this.CACHE_DURATION;
      return config;
    } catch (error) {
      console.warn('Failed to fetch pricing config from API, using defaults:', error);
      // Fallback to default values if API fails
      const defaultConfig: PricingConfig = {
        insuranceFeePerDay: 15,
        serviceFee: 25,
        taxRate: 0.10,
        minRentalDays: 1,
        maxRentalDays: 30,
        minAdvanceBookingHours: 2
      };
      this.cachedConfig = defaultConfig;
      this.configCacheExpiry = now + this.CACHE_DURATION;
      return defaultConfig;
    }
  }

  async getBusinessRules(): Promise<BusinessRules> {
    const now = Date.now();
    
    if (this.cachedBusinessRules && now < this.rulesCacheExpiry) {
      return this.cachedBusinessRules;
    }

    try {
      const rules = await apiService.get<BusinessRules>('/api/config/business-rules');
      this.cachedBusinessRules = rules;
      this.rulesCacheExpiry = now + this.CACHE_DURATION;
      return rules;
    } catch (error) {
      console.warn('Failed to fetch business rules from API, using defaults:', error);
      // Fallback to default values if API fails
      const defaultRules: BusinessRules = {
        minRentalPeriod: 1, // 1 day minimum
        maxRentalPeriod: 30, // 30 days maximum
        minAdvanceBooking: 2, // 2 hours minimum advance booking
        maxAdvanceBooking: 365 // 1 year maximum advance booking
      };
      this.cachedBusinessRules = defaultRules;
      this.rulesCacheExpiry = now + this.CACHE_DURATION;
      return defaultRules;
    }
  }

  clearCache(): void {
    this.cachedConfig = null;
    this.cachedBusinessRules = null;
    this.configCacheExpiry = 0;
    this.rulesCacheExpiry = 0;
  }
}

export const pricingConfigService = PricingConfigService.getInstance();