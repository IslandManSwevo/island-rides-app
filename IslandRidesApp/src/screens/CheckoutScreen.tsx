import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Button } from '../components/Button';
import { Vehicle } from '../types';
import { BookingService } from '../services/bookingService';

export const CheckoutScreen = ({ navigation, route }: any) => {
  const { vehicle } = route.params;
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const days = BookingService.calculateDays(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
  const basePrice = days * vehicle.daily_rate;
  const insuranceFee = days * 15;
  const serviceFee = 25;
  const taxRate = 0.10;
  const subtotal = basePrice + insuranceFee + serviceFee;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleDateChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
    if (selectedDate) {
      if (type === 'start') {
        setStartDate(selectedDate);
        if (selectedDate >= endDate) {
          setEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
        }
      } else {
        if (selectedDate > startDate) {
          setEndDate(selectedDate);
        }
      }
    }
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handlePayment = async (method: 'stripe' | 'paypal' | 'googlepay') => {
    try {
      setLoading(true);
      
      const bookingData = {
        vehicleId: vehicle.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      const response = await BookingService.createBooking(bookingData);
      
      Alert.alert(
        `${method.charAt(0).toUpperCase() + method.slice(1)} Payment`,
        `Payment processing with ${method} will be implemented soon. Your booking has been created with ID: ${response.booking.id}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingConfirmed', { 
              booking: response.booking,
              vehicle: vehicle 
            } as any)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Booking Error', error instanceof Error ? error.message : 'Failed to create booking');
      
      if (error instanceof Error && error.message.includes('token')) {
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
    }
  };

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
            ${vehicle.daily_rate}/day × {days} days
          </Text>
          <Text style={styles.priceValue}>${basePrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Insurance ($15/day)</Text>
          <Text style={styles.priceValue}>${insuranceFee.toFixed(2)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Service Fee</Text>
          <Text style={styles.priceValue}>${serviceFee.toFixed(2)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Tax (10%)</Text>
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
            title="Pay with Card (Stripe)"
            onPress={() => handlePayment('stripe')}
            loading={loading}
          />
          
          <Button
            title="PayPal"
            onPress={() => handlePayment('paypal')}
            loading={loading}
            variant="secondary"
          />
          
          <Button
            title="Google Pay"
            onPress={() => handlePayment('googlepay')}
            loading={loading}
            variant="secondary"
          />
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
});
