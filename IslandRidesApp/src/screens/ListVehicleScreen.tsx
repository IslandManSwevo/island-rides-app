import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Picker } from '../components/Picker';
import { Card } from '../components/Card';
import { VehicleService } from '../services/vehicleService';
import { StorageService } from '../utils/storage';
import { colors, typography, spacing } from '../styles/theme';

interface ListVehicleScreenProps {
  navigation: any;
}

const CAR_MAKES = [
  { label: 'Toyota', value: 'Toyota' },
  { label: 'Honda', value: 'Honda' },
  { label: 'BMW', value: 'BMW' },
  { label: 'Nissan', value: 'Nissan' },
  { label: 'Ford', value: 'Ford' },
  { label: 'Jeep', value: 'Jeep' },
  { label: 'Mercedes-Benz', value: 'Mercedes-Benz' },
  { label: 'Audi', value: 'Audi' },
  { label: 'Volkswagen', value: 'Volkswagen' },
  { label: 'Hyundai', value: 'Hyundai' }
];

const DRIVE_SIDE_OPTIONS = [
  { label: 'Left-Hand Drive', value: 'LHD' },
  { label: 'Right-Hand Drive', value: 'RHD' }
];

const ISLAND_OPTIONS = [
  { label: 'Nassau', value: 'Nassau' },
  { label: 'Freeport', value: 'Freeport' },
  { label: 'Exuma', value: 'Exuma' }
];

export const ListVehicleScreen: React.FC<ListVehicleScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    location: '',
    daily_rate: '',
    drive_side: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.make) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.year) newErrors.year = 'Year is required';
    else if (parseInt(formData.year) < 1990 || parseInt(formData.year) > new Date().getFullYear() + 1) {
      newErrors.year = 'Year must be between 1990 and ' + (new Date().getFullYear() + 1);
    }
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.daily_rate) newErrors.daily_rate = 'Daily rate is required';
    else if (parseFloat(formData.daily_rate) <= 0) newErrors.daily_rate = 'Daily rate must be greater than 0';
    if (!formData.drive_side) newErrors.drive_side = 'Drive side is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await StorageService.getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again');
        navigation.navigate('Login');
        return;
      }

      await VehicleService.createVehicle({
        make: formData.make,
        model: formData.model.trim(),
        year: parseInt(formData.year),
        location: formData.location,
        daily_rate: parseFloat(formData.daily_rate),
        drive_side: formData.drive_side as 'LHD' | 'RHD',
        description: formData.description.trim() || undefined
      }, token);

      Alert.alert('Success', 'Vehicle listed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to list vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.primary, colors.gradientLight]} style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>🚗 List Your Car</Text>
            <Text style={styles.subtitle}>Add your vehicle to the rental fleet</Text>
          </View>
          
          <Card style={styles.cardContainer}>
            <View style={styles.form}>
              <Picker
                label="Make"
                value={formData.make}
                options={CAR_MAKES}
                onValueChange={(value) => setFormData({ ...formData, make: value })}
                placeholder="Select car make"
                error={errors.make}
              />
              
              <Input
                label="Model"
                value={formData.model}
                onChangeText={(value) => setFormData({ ...formData, model: value })}
                placeholder="Enter car model"
                error={errors.model}
              />
              
              <Input
                label="Year"
                value={formData.year}
                onChangeText={(value) => setFormData({ ...formData, year: value })}
                placeholder="Enter year"
                keyboardType="numeric"
                error={errors.year}
              />
              
              <Picker
                label="Location"
                value={formData.location}
                options={ISLAND_OPTIONS}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
                placeholder="Select island"
                error={errors.location}
              />
              
              <Input
                label="Daily Rate ($)"
                value={formData.daily_rate}
                onChangeText={(value) => setFormData({ ...formData, daily_rate: value })}
                placeholder="Enter daily rate"
                keyboardType="numeric"
                error={errors.daily_rate}
              />
              
              <Picker
                label="Drive Side"
                value={formData.drive_side}
                options={DRIVE_SIDE_OPTIONS}
                onValueChange={(value) => setFormData({ ...formData, drive_side: value })}
                placeholder="Select drive side"
                error={errors.drive_side}
              />
              
              <Input
                label="Description (Optional)"
                value={formData.description}
                onChangeText={(value) => setFormData({ ...formData, description: value })}
                placeholder="Describe your vehicle"
                multiline
                numberOfLines={3}
              />
              
              <Button title="List Vehicle" onPress={handleSubmit} loading={loading} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: colors.white,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.white,
  },
  cardContainer: {
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
});
