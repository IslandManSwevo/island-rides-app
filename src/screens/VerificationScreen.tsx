import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Card, DisplayText, Field, SectionLabel, VehicleImage } from '../components/ui';
import { keyloApi, photoUrl, KeyloApiError } from '../services/keyloApi';
import { pickAndUpload } from '../services/uploadService';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { RootStackParamList } from '../navigation/routes';

interface VerificationScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
}

const MIN_RENTAL_AGE = 21;

const parseDob = (input: string): Date | null => {
  // MM/DD/YYYY, forgiving of single-digit month/day.
  const m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
};

const ageOf = (dob: Date) => (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

/**
 * Driver verification — license photo, selfie, date of birth. The Bahamas
 * requires renters to be 21+; this screen enforces it client-side before
 * submit, and the API enforces it again server-side at booking time.
 */
export const VerificationScreen: React.FC<VerificationScreenProps> = ({ navigation }) => {
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [selfieKey, setSelfieKey] = useState<string | null>(null);
  const [dobText, setDobText] = useState('');
  const [uploading, setUploading] = useState<'license' | 'selfie' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);

  const capture = async (which: 'license' | 'selfie') => {
    setUploading(which);
    try {
      const uploaded = await pickAndUpload('document');
      if (uploaded) (which === 'license' ? setLicenseKey : setSelfieKey)(uploaded.key);
    } catch {
      notificationService.error('Upload failed — try again.');
    } finally {
      setUploading(null);
    }
  };

  const onDobChange = (text: string) => {
    setDobText(text);
    setAgeError(null);
  };

  const submit = async () => {
    setAgeError(null);
    const dob = parseDob(dobText);
    if (!dob) {
      setAgeError('Enter your date of birth as MM/DD/YYYY.');
      return;
    }
    if (ageOf(dob) < MIN_RENTAL_AGE) {
      setAgeError('You must be 21 or older to rent a vehicle in the Bahamas.');
      return;
    }
    if (!licenseKey || !selfieKey) {
      notificationService.error('Add both your license photo and a selfie.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await apiService.getToken();
      if (!token) {
        notificationService.error('Sign in to verify your account');
        return;
      }
      await keyloApi.submitVerification({ licenseKey, selfieKey, dateOfBirth: dob.toISOString() }, token);
      notificationService.success("We'll confirm shortly — usually within a day.", { title: 'Submitted for review' });
      navigation.goBack();
    } catch (e) {
      notificationService.error(
        e instanceof KeyloApiError ? e.message : "Couldn't submit — try again.",
        { title: 'Verification failed' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!licenseKey && !!selfieKey && dobText.length === 10;

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={['bottom']}>
      <ScrollView className="flex-1 px-gutter" showsVerticalScrollIndicator={false} contentContainerClassName="pt-5">
        <DisplayText size="title">Verify your license</DisplayText>
        <Text className="mt-1 font-ui text-body text-stone dark:text-night-muted">
          Required before your first booking. Renters must be 21 or older in the Bahamas.
        </Text>

        <SectionLabel className="mt-6">Driver's license</SectionLabel>
        <Pressable
          onPress={() => capture('license')}
          disabled={uploading === 'license'}
          className={`mt-2 overflow-hidden rounded-card border ${
            licenseKey ? 'border-teal' : 'border-2 border-dashed border-coral'
          }`}
        >
          {licenseKey ? (
            <VehicleImage url={photoUrl(licenseKey)} className="h-36 w-full" />
          ) : (
            <View className="h-36 items-center justify-center gap-1.5">
              <Ionicons
                name={uploading === 'license' ? 'cloud-upload-outline' : 'card-outline'}
                size={26}
                color="#E04326"
              />
              <Text className="font-ui-semibold text-meta text-coral-pressed">Add license photo</Text>
            </View>
          )}
        </Pressable>

        <SectionLabel className="mt-6">Selfie</SectionLabel>
        <Pressable
          onPress={() => capture('selfie')}
          disabled={uploading === 'selfie'}
          className={`mt-2 overflow-hidden rounded-card border ${
            selfieKey ? 'border-teal' : 'border-2 border-dashed border-coral'
          }`}
        >
          {selfieKey ? (
            <VehicleImage url={photoUrl(selfieKey)} className="h-36 w-full" />
          ) : (
            <View className="h-36 items-center justify-center gap-1.5">
              <Ionicons
                name={uploading === 'selfie' ? 'cloud-upload-outline' : 'person-circle-outline'}
                size={26}
                color="#E04326"
              />
              <Text className="font-ui-semibold text-meta text-coral-pressed">Add a selfie</Text>
            </View>
          )}
        </Pressable>

        <SectionLabel className="mt-6">Date of birth</SectionLabel>
        <Field
          className="mt-2"
          value={dobText}
          onChangeText={onDobChange}
          placeholder="MM/DD/YYYY"
          keyboardType="number-pad"
          maxLength={10}
          error={ageError ?? undefined}
        />

        <Card className="mb-8 mt-6 flex-row items-center gap-3 p-card-pad">
          <Ionicons name="shield-checkmark-outline" size={20} color="#0E7C7B" />
          <Text className="flex-1 font-ui text-meta text-stone dark:text-night-muted">
            Reviewed by a person, usually within a day. Your documents are never shared with hosts.
          </Text>
        </Card>
      </ScrollView>

      <View className="border-t border-sand px-gutter py-3 dark:border-night-line">
        <Button label="Submit for verification" disabled={!canSubmit} loading={submitting} onPress={submit} />
      </View>
    </SafeAreaView>
  );
};

export default VerificationScreen;
