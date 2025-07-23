import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { notificationService } from '../services/notificationService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { StandardButton } from '../components/templates/StandardButton';
import { Vehicle } from '../types';
import { BookingService } from '../services/bookingService';
import { hapticService } from '../services/hapticService';
import { pricingConfigService, PricingConfig, BusinessRules } from '../services/pricingConfigService';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, ROUTES } from '../navigation/routes';

type CheckoutScreenProps = StackScreenProps<RootStackParamList, typeof ROUTES.CHECKOUT>;

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation, route }) => {
  const { vehicle } = route.params;
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [businessRules, setBusinessRules] = useState<BusinessRules | null>(null);

  const days = BookingService.calculateDays(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
  const basePrice = days * vehicle.dailyRate;
  const insuranceFee = pricingConfig ? days * pricingConfig.insuranceFeePerDay : days * 15;
  const serviceFee = pricingConfig ? pricingConfig.serviceFee : 25;
  const taxRate = pricingConfig ? pricingConfig.taxRate : 0.10;
  const subtotal = basePrice + insuranceFee + serviceFee;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const validateDateSelection = (newStartDate: Date, newEndDate: Date): { isValid: boolean; errorMessage?: string } => {
    if (!businessRules) {
      return { isValid: true }; // Allow if rules not loaded yet
    }

    const now = new Date();
    const minAdvanceTime = new Date(now.getTime() + businessRules.minAdvanceBookingHours * 60 * 60 * 1000);
    const maxAdvanceTime = new Date(now.getTime() + businessRules.maxAdvanceBookingHours * 60 * 60 * 1000);
    
    // Check minimum advance booking
    if (newStartDate < minAdvanceTime) {
      return {
        isValid: false,
        errorMessage: `Booking must be made at least ${businessRules.minAdvanceBookingHours} hours in advance`
      };
    }
    
    // Check maximum advance booking
    if (newStartDate > maxAdvanceTime) {
      return {
        isValid: false,
        errorMessage: `Booking cannot be made more than ${Math.floor(businessRules.maxAdvanceBookingHours / 24)} days in advance`
      };
    }
    
    // Check rental period length
    const rentalDays = BookingService.calculateDays(
      newStartDate.toISOString().split('T')[0],
      newEndDate.toISOString().split('T')[0]
    );
    
    if (rentalDays < businessRules.minRentalDays) {
      return {
        isValid: false,
        errorMessage: `Minimum rental period is ${businessRules.minRentalDays} day${businessRules.minRentalDays > 1 ? 's' : ''}`
      };
    }
    
    if (rentalDays > businessRules.maxRentalDays) {
      return {
        isValid: false,
        errorMessage: `Maximum rental period is ${businessRules.maxRentalDays} days`
      };
    }
    
    return { isValid: true };
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, type: 'start' | 'end') => {
    if (selectedDate) {
      let newStartDate = startDate;
      let newEndDate = endDate;
      
      if (type === 'start') {
        newStartDate = selectedDate;
        if (selectedDate >= endDate) {
          newEndDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
        }
      } else {
        if (selectedDate > startDate) {
          newEndDate = selectedDate;
        } else {
          setShowStartPicker(false);
          setShowEndPicker(false);
          return; // Don't update if end date is not after start date
        }
      }
      
      // Validate the new date selection
      const validation = validateDateSelection(newStartDate, newEndDate);
      
      if (validation.isValid) {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
      } else {
        notificationService.error(validation.errorMessage || 'Invalid date selection', {
          title: 'Date Selection Error',
          duration: 4000
        });
      }
    }
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Haptic feedback for payment processing
      await hapticService.paymentProcessing();
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        notificationService.error('Please log in to continue', {
          title: 'Authentication Required',
          duration: 4000
        });
        navigation.navigate(ROUTES.LOGIN);
        return;
      }

      const bookingData = {
        vehicleId: vehicle.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      const response = await BookingService.createBooking(bookingData);
      
      navigation.navigate(ROUTES.PAYMENT, {
        booking: {
          ...response.booking,
          vehicle: vehicle
        }
      });
      
    } catch (error: unknown) {
      notificationService.error(error instanceof Error ? error.message : String(error), {
        title: 'Booking Error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load pricing configuration and business rules
    const loadConfigurations = async () => {
      try {
        const [config, rules] = await Promise.all([
          pricingConfigService.getPricingConfig(),
          pricingConfigService.getBusinessRules()
        ]);
        setPricingConfig(config);
        setBusinessRules(rules);
      } catch (error) {
        console.warn('Failed to load configurations:', error);
        // Fallback values are handled in the service
      }
    };
    
    loadConfigurations();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Booking</Text>
        <Text style={styles.vehicleInfo}>
          {vehicle.make} {vehicle.model} ({vehicle.year})
        </Text>
        <Text style={styles.location}>📍 {vehicle.location}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Rental Period</Text>
        
        <TouchableOpacity style={styles.calendarSelector} onPress={() => setShowStartPicker(true)}>
          <View style={styles.calendarHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.calendarTitle}>Select Rental Period</Text>
            <View style={styles.availabilityBadge}>
              <View style={styles.availabilityDot} />
              <Text style={styles.availabilityText}>Available</Text>
            </View>
          </View>
          
          <View style={styles.selectedDates}>
            <View style={styles.dateSelection}>
              <Text style={styles.dateType}>Check-in</Text>
              <Text style={styles.selectedDate}>{startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
            
            <View style={styles.dateSeparator}>
              <View style={styles.separatorLine} />
              <Ionicons name="arrow-forward" size={16} color={colors.lightGrey} />
              <View style={styles.separatorLine} />
            </View>
            
            <View style={styles.dateSelection}>
              <Text style={styles.dateType}>Check-out</Text>
              <Text style={styles.selectedDate}>{endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.durationText}>
          Duration: {days} day{days !== 1 ? 's' : ''}
        </Text>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => handleDateChange(event, date, 'start')}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
            onChange={(event, date) => handleDateChange(event, date, 'end')}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.pricingHeader}>
          <Text style={styles.sectionTitle}>Transparent Pricing</Text>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.verified} />
            <Text style={styles.trustText}>No Hidden Fees</Text>
          </View>
        </View>
        
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              ${vehicle.dailyRate}/day × {days} days
            </Text>
            <Text style={styles.priceValue}>${basePrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <View style={styles.priceWithInfo}>
              <Text style={styles.priceLabel}>Insurance</Text>
              <Text style={styles.includedText}>✅ Included</Text>
            </View>
            <Text style={styles.priceValue}>$0.00</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Fee</Text>
            <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${(basePrice + serviceFee).toFixed(2)}</Text>
          </View>
          
          <Text style={styles.savingsText}>
            💰 You save ${(insuranceFee + tax).toFixed(2)} on fees!
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Options</Text>
        
        <View style={styles.paymentMethods}>
          <TouchableOpacity style={[styles.paymentMethod, styles.selectedPayment]}>
            <View style={styles.paymentInfo}>
              <Ionicons name="card" size={24} color={colors.primary} />
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
                <Text style={styles.paymentSubtitle}>Visa, Mastercard, American Express</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.paymentMethod}>
            <View style={styles.paymentInfo}>
              <Ionicons name="phone-portrait" size={24} color={colors.lightGrey} />
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentTitle}>Apple Pay</Text>
                <Text style={styles.paymentSubtitle}>Quick & secure payment</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.paymentMethod}>
            <View style={styles.paymentInfo}>
              <Ionicons name="logo-bitcoin" size={24} color={colors.lightGrey} />
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentTitle}>Cryptocurrency</Text>
                <Text style={styles.paymentSubtitle}>Bitcoin, Ethereum & more</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.securityFeatures}>
          <View style={styles.securityItem}>
            <Ionicons name="shield-checkmark" size={16} color={colors.verified} />
            <Text style={styles.securityText}>🔒 Bank-level encryption</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.verified} />
            <Text style={styles.securityText}>Instant confirmation</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="refresh" size={16} color={colors.verified} />
            <Text style={styles.securityText}>Free cancellation 24h</Text>
          </View>
        </View>
        
        <StandardButton
          title={`🔒 Secure Checkout - $${(basePrice + serviceFee).toFixed(2)}`}
          onPress={handlePayment}
          loading={loading}
          variant="primary"
          fullWidth
          style={styles.secureCheckoutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  calendarSelector: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendarTitle: {
    ...typography.subheading,
    flex: 1,
    marginLeft: spacing.sm,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.verified + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.verified,
  },
  availabilityText: {
    ...typography.caption,
    color: colors.verified,
    fontWeight: '600',
  },
  selectedDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelection: {
    flex: 1,
    alignItems: 'center',
  },
  dateType: {
    ...typography.caption,
    color: colors.lightGrey,
    marginBottom: spacing.xs,
  },
  selectedDate: {
    ...typography.body,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
  separatorLine: {
    width: 20,
    height: 1,
    backgroundColor: colors.lightGrey,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.verified + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  trustText: {
    ...typography.caption,
    color: colors.verified,
    fontWeight: '600',
  },
  priceBreakdown: {
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  priceWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  includedText: {
    ...typography.caption,
    color: colors.verified,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGrey,
    marginVertical: spacing.sm,
  },
  savingsText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  paymentMethods: {
    marginBottom: spacing.lg,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    marginBottom: spacing.sm,
  },
  selectedPayment: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentDetails: {
    marginLeft: spacing.md,
  },
  paymentTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentSubtitle: {
    ...typography.caption,
    color: colors.lightGrey,
  },
  securityFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.verified + '08',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  securityItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  securityText: {
    ...typography.caption,
    color: colors.verified,
    fontWeight: '600',
    textAlign: 'center',
  },
  secureCheckoutButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  vehicleInfo: {
    ...typography.subheading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.body,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dateField: {
    flex: 0.48,
  },
  dateLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  durationText: {
    ...typography.body,
    textAlign: 'center',
    fontWeight: '600',
    color: colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    ...typography.body,
  },
  priceValue: {
    ...typography.body,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...typography.subheading,
  },
  totalValue: {
    ...typography.subheading,
    color: colors.primary,
  },
  paymentButtons: {
    gap: spacing.md,
  },
  paymentNote: {
    ...typography.body,
    textAlign: 'center',
  },
});
