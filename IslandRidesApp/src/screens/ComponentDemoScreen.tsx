import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { StandardButton, StandardInput, StandardCard, ThemeToggle } from '../components/templates';

export const ComponentDemoScreen: React.FC = () => {
  const { colors, typography, spacing } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [error, setError] = useState('');

  const handleTestButton = () => {
    Alert.alert('Success!', 'Button animation and interaction working perfectly!');
  };

  const handleValidateEmail = () => {
    if (!emailValue.includes('@')) {
      setError('Please enter a valid email address');
    } else {
      setError('');
      Alert.alert('Valid!', 'Email validation working!');
    }
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
    }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Header */}
        <View style={{
          alignItems: 'center',
          marginBottom: spacing.xl,
          paddingTop: spacing.lg,
        }}>
          <Text style={{
            ...typography.heading1,
            color: colors.text,
            marginBottom: spacing.sm,
          }}>
            KeyLo UI Components
          </Text>
          <Text style={{
            ...typography.body,
            color: colors.textSecondary,
            textAlign: 'center',
          }}>
            Enhanced with dark mode & micro-interactions
          </Text>
        </View>

        {/* Theme Toggle Demo */}
        <StandardCard title="Theme System" variant="elevated" margin="medium">
          <Text style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}>
            Toggle between Light, Dark, and Auto themes:
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <ThemeToggle variant="button" size="medium" />
            <ThemeToggle variant="icon" size="large" showLabel={false} />
            <ThemeToggle variant="text" size="small" />
          </View>
        </StandardCard>

        {/* Button Demo */}
        <StandardCard title="Enhanced Buttons" variant="elevated" margin="medium">
          <Text style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}>
            Buttons with spring animations and theme awareness:
          </Text>
          
          <View style={{ gap: spacing.md }}>
            <StandardButton
              title="Primary with Animation"
              onPress={handleTestButton}
              variant="primary"
              icon="rocket"
              fullWidth
            />
            
            <View style={{
              flexDirection: 'row',
              gap: spacing.sm,
            }}>
              <View style={{ flex: 1 }}>
                <StandardButton
                  title="Secondary"
                  onPress={handleTestButton}
                  variant="secondary"
                  size="medium"
                />
              </View>
              <View style={{ flex: 1 }}>
                <StandardButton
                  title="Outline"
                  onPress={handleTestButton}
                  variant="outline"
                  size="medium"
                />
              </View>
            </View>
            
            <StandardButton
              title="Loading State"
              onPress={handleTestButton}
              variant="primary"
              loading={true}
              icon="download"
            />
            
            <StandardButton
              title="Ghost Button"
              onPress={handleTestButton}
              variant="ghost"
              icon="heart"
              iconPosition="right"
            />
          </View>
        </StandardCard>

        {/* Input Demo */}
        <StandardCard title="Smart Inputs" variant="elevated" margin="medium">
          <Text style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}>
            Inputs with focus states and theme support:
          </Text>
          
          <View style={{ gap: spacing.md }}>
            <StandardInput
              label="Basic Input"
              placeholder="Enter some text..."
              value={inputValue}
              onChangeText={setInputValue}
              leftIcon="person"
            />
            
            <StandardInput
              label="Email Validation"
              placeholder="your@email.com"
              value={emailValue}
              onChangeText={setEmailValue}
              error={error}
              keyboardType="email-address"
              leftIcon="mail"
              rightIcon="checkmark-circle"
              onRightIconPress={handleValidateEmail}
              required
            />
            
            <StandardInput
              label="Multiline Text"
              placeholder="Write your review..."
              value=""
              onChangeText={() => {}}
              multiline
              maxLength={200}
            />
            
            <StandardInput
              label="Disabled Input"
              placeholder="This is disabled"
              value="Cannot edit this"
              onChangeText={() => {}}
              disabled
              leftIcon="lock-closed"
            />
          </View>
        </StandardCard>

        {/* Card Variants Demo */}
        <StandardCard title="Card Variants" variant="elevated" margin="medium">
          <Text style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}>
            Different card styles with theme support:
          </Text>
          
          <View style={{ gap: spacing.md }}>
            <StandardCard
              variant="default"
              padding="medium"
              margin="none"
            >
              <Text style={{
                ...typography.body,
                color: colors.text,
              }}>
                Default card with border
              </Text>
            </StandardCard>
            
            <StandardCard
              variant="filled"
              padding="medium"
              margin="none"
            >
              <Text style={{
                ...typography.body,
                color: colors.text,
              }}>
                Filled card with background
              </Text>
            </StandardCard>
            
            <StandardCard
              variant="outlined"
              padding="medium"
              margin="none"
              onPress={() => Alert.alert('Card Pressed!', 'Interactive card working!')}
            >
              <Text style={{
                ...typography.body,
                color: colors.text,
              }}>
                Outlined interactive card (tap me!)
              </Text>
            </StandardCard>
          </View>
        </StandardCard>

        {/* Performance Info */}
        <StandardCard title="Performance Features" variant="filled" margin="medium">
          <View style={{ gap: spacing.sm }}>
            <Text style={{
              ...typography.body,
              color: colors.text,
            }}>
              ✨ Micro-interactions with 60fps animations
            </Text>
            <Text style={{
              ...typography.body,
              color: colors.text,
            }}>
              🌙 Automatic dark mode detection
            </Text>
            <Text style={{
              ...typography.body,
              color: colors.text,
            }}>
              💾 Theme preference persistence
            </Text>
            <Text style={{
              ...typography.body,
              color: colors.text,
            }}>
              ♿ WCAG 2.2 accessibility compliance
            </Text>
            <Text style={{
              ...typography.body,
              color: colors.text,
            }}>
              🎯 Consistent design tokens across themes
            </Text>
          </View>
        </StandardCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Dynamic styles are inline for theme support
});