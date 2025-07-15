import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { notificationService } from '../services/notificationService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, borderRadius } from '../styles/Theme';
import Button from '../components/Button';
import { Vehicle } from '../types';
import { BookingService } from '../services/bookingService';
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

  const handleDateChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
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
      
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Failed to create booking', {
        title: 'Booking Error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    notificationService.setupNotificationListeners(navigation);
    
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
        
        <View style={styles.dateContainer}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Button
              title={startDate.toLocaleDateString()}
              onPress={() => setShowStartPicker(true)}
              variant="secondary"
            />
          </View>
          
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Button
              title={endDate.toLocaleDateString()}
              onPress={() => setShowEndPicker(true)}
              variant="secondary"
            />
          </View>
        </View>

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
        <Text style={styles.sectionTitle}>Price Summary</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            ${vehicle.dailyRate}/day × {days} days
          </Text>
          <Text style={styles.priceValue}>${basePrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Insurance (${pricingConfig?.insuranceFeePerDay || 15}/day)</Text>
          <Text style={styles.priceValue}>${insuranceFee.toFixed(2)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Service Fee</Text>
          <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Tax ({((pricingConfig?.taxRate || 0.10) * 100).toFixed(0)}%)</Text>
          <Text style={styles.priceValue}>${tax.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <View style={styles.paymentButtons}>
          <Button
            title="Pay Securely with Transfi"
            onPress={handlePayment}
            loading={loading}
          />
          
          <Text style={styles.paymentNote}>
            Secure payment powered by Transfi - accepts cards, bank transfers, and crypto
          </Text>
        </View>
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
