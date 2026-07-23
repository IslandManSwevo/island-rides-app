import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, DisplayText, Field } from '../components/ui';
import { useUnifiedAuth } from '../context/UnifiedAuthContext';
import { notificationService } from '../services/notificationService';
import { ROUTES } from '../navigation/routes';

interface LoginScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  /** RegistrationScreen renders this same component in create mode. */
  initialMode?: 'signIn' | 'create';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * KeyLo auth — one screen, sign in / create account toggle, guest browse.
 * design/02-user-flows.md. Wired to the existing useUnifiedAuth() contract.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, initialMode = 'signIn' }) => {
  const { login, register } = useUnifiedAuth();
  const [mode, setMode] = useState<'signIn' | 'create'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const creating = mode === 'create';

  const validate = () => {
    const next: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email';
    if (password.length < 8) next.password = 'At least 8 characters';
    if (creating && !firstName.trim()) next.firstName = 'Required';
    if (creating && !lastName.trim()) next.lastName = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (creating) {
        await register({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() });
        // New accounts land in onboarding; auth-state routing takes over from there.
        navigation.navigate(ROUTES.ONBOARDING);
      } else {
        await login({ email: email.trim(), password });
      }
    } catch (e) {
      notificationService.error(
        e instanceof Error ? e.message : 'Check your details and try again.',
        { title: creating ? "Couldn't create account" : "Couldn't sign in" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const browseAsGuest = () => navigation.navigate('CustomerApp');

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="flex-grow px-gutter pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-10">
            <Text className="font-display text-hero text-ink dark:text-night-text">
              Key<Text className="text-coral">Lo</Text>
            </Text>
            <DisplayText size="title" className="mt-3">
              {creating ? 'Create your account' : 'Keys to the island.'}
            </DisplayText>
            <Text className="mt-1 font-ui text-body text-stone dark:text-night-muted">
              {creating ? 'A minute to set up. Then you can book.' : 'Sign in to book cars across the Bahamas.'}
            </Text>
          </View>

          <View className="mt-8 gap-3.5">
            {creating && (
              <View className="flex-row gap-3">
                <Field
                  label="First name"
                  className="flex-1"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  error={errors.firstName}
                />
                <Field
                  label="Last name"
                  className="flex-1"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  error={errors.lastName}
                />
              </View>
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={creating ? 'new-password' : 'current-password'}
              error={errors.password}
            />
          </View>

          <Button
            label={creating ? 'Create account' : 'Sign in'}
            className="mt-6"
            loading={submitting}
            onPress={submit}
          />

          <Pressable className="mt-4 self-center" onPress={() => setMode(creating ? 'signIn' : 'create')}>
            <Text className="font-ui text-body text-stone dark:text-night-muted">
              {creating ? 'Already have an account? ' : 'New to KeyLo? '}
              <Text className="font-ui-semibold text-teal">{creating ? 'Sign in' : 'Create one'}</Text>
            </Text>
          </Pressable>

          <View className="mt-auto pt-8">
            <Button label="Browse cars first" variant="ghost" onPress={browseAsGuest} />
            <Text className="mt-3 text-center font-ui text-overline normal-case tracking-normal text-stone dark:text-night-muted">
              You can look around without an account · booking needs sign-in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
