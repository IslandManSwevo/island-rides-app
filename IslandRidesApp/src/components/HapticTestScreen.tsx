import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { hapticService, HapticType } from '../services/hapticService';

export const HapticTestScreen: React.FC = () => {
  const hapticTypes: { type: HapticType; label: string; description: string }[] = [
    { type: 'light', label: 'Light', description: 'Subtle feedback for light touches' },
    { type: 'medium', label: 'Medium', description: 'Standard button press feedback' },
    { type: 'heavy', label: 'Heavy', description: 'Strong feedback for important actions' },
    { type: 'selection', label: 'Selection', description: 'UI element selection feedback' },
    { type: 'success', label: 'Success', description: 'Positive action completion' },
    { type: 'warning', label: 'Warning', description: 'Caution or warning feedback' },
    { type: 'error', label: 'Error', description: 'Error or failure feedback' },
    { type: 'notification', label: 'Notification', description: 'Custom notification pattern' },
  ];

  const testSpecialHaptics = async () => {
    await hapticService.bookingConfirmed();
  };

  const testPaymentHaptics = async () => {
    await hapticService.paymentProcessing();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Haptic Feedback Test</Text>
      <Text style={styles.subtitle}>
        Test different haptic feedback types. Make sure your device supports haptics!
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Haptic Types</Text>
        {hapticTypes.map((item) => (
          <AnimatedButton
            key={item.type}
            style={styles.button}
            hapticType={item.type}
            onPress={() => console.log(`${item.label} haptic triggered`)}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>{item.label}</Text>
              <Text style={styles.buttonDescription}>{item.description}</Text>
            </View>
          </AnimatedButton>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special App Haptics</Text>
        
        <AnimatedButton
          style={[styles.button, styles.specialButton]}
          onPress={testSpecialHaptics}
          hapticType="success"
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Booking Confirmed</Text>
            <Text style={styles.buttonDescription}>Complex success pattern</Text>
          </View>
        </AnimatedButton>

        <AnimatedButton
          style={[styles.button, styles.specialButton]}
          onPress={testPaymentHaptics}
          hapticType="medium"
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Payment Processing</Text>
            <Text style={styles.buttonDescription}>Progressive intensity pattern</Text>
          </View>
        </AnimatedButton>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disabled Button Test</Text>
        <AnimatedButton
          style={[styles.button, styles.disabledButton]}
          disabled={true}
          hapticType="medium"
          onPress={() => console.log('This should not trigger')}
        >
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonText, styles.disabledText]}>Disabled Button</Text>
            <Text style={[styles.buttonDescription, styles.disabledText]}>
              No haptics when disabled
            </Text>
          </View>
        </AnimatedButton>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#E5E5EA',
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
  },
});