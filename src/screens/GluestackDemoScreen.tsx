import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Heading,
  Center,
  Divider,
} from '@gluestack-ui/themed';
import { Alert } from 'react-native';
import { 
  GluestackButton,
  GluestackInput,
  GluestackCard,
  GluestackThemeToggle,
} from '../components/templates';

export const GluestackDemoScreen: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [error, setError] = useState('');

  const handleTestButton = () => {
    Alert.alert('🚀 Gluestack Success!', 'Enhanced performance and animations working perfectly!');
  };

  const handleValidateEmail = () => {
    if (!emailValue.includes('@')) {
      setError('Please enter a valid email address');
    } else {
      setError('');
      Alert.alert('✅ Valid!', 'Gluestack validation working!');
    }
  };

  return (
    <Box flex={1} bg="$background">
      <ScrollView flex={1}>
        <VStack space="lg" p="$6" pb="$12">
          
          {/* Header */}
          <Center py="$6">
            <VStack space="sm" alignItems="center">
              <Heading 
                size="2xl" 
                color="$textLight900" 
                sx={{ _dark: { color: '$textDark' } }}
              >
                🚀 Gluestack UI
              </Heading>
              <Text 
                size="md" 
                color="$textLight600" 
                sx={{ _dark: { color: '$textSecondaryDark' } }} 
                textAlign="center"
              >
                Next-generation performance with 70% faster rendering
              </Text>
            </VStack>
          </Center>

          {/* Performance Benefits */}
          <GluestackCard title="⚡ Performance Improvements" variant="elevated">
            <VStack space="sm">
              <HStack space="sm" alignItems="center">
                <Text size="lg">📈</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight700" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  70% faster component rendering
                </Text>
              </HStack>
              <HStack space="sm" alignItems="center">
                <Text size="lg">📦</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight700" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  20% smaller bundle size with tree-shaking
                </Text>
              </HStack>
              <HStack space="sm" alignItems="center">
                <Text size="lg">🎯</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight700" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  Native 60fps animations
                </Text>
              </HStack>
              <HStack space="sm" alignItems="center">
                <Text size="lg">🌐</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight700" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  Universal components (RN + Web)
                </Text>
              </HStack>
            </VStack>
          </GluestackCard>

          {/* Theme System */}
          <GluestackCard title="🌙 Enhanced Theme System" variant="elevated">
            <VStack space="md">
              <Text 
                size="sm" 
                color="$textLight600" 
                sx={{ _dark: { color: '$textSecondaryDark' } }}
              >
                Advanced theme switching with Gluestack's color mode system:
              </Text>
              
              <VStack space="md">
                <HStack space="md" justifyContent="space-around" alignItems="center">
                  <GluestackThemeToggle variant="button" size="md" />
                  <GluestackThemeToggle variant="icon" size="lg" showLabel={false} />
                </HStack>
                
                <Center>
                  <GluestackThemeToggle variant="text" size="sm" layout="vertical" />
                </Center>
              </VStack>
            </VStack>
          </GluestackCard>

          {/* Enhanced Buttons */}
          <GluestackCard title="🎯 High-Performance Buttons" variant="elevated">
            <VStack space="md">
              <Text 
                size="sm" 
                color="$textLight600" 
                sx={{ _dark: { color: '$textSecondaryDark' } }}
              >
                Buttons with native animations and enhanced accessibility:
              </Text>
              
              <VStack space="md">
                <GluestackButton
                  title="Primary Performance"
                  onPress={handleTestButton}
                  variant="solid"
                  action="primary"
                  icon="rocket"
                  fullWidth
                />
                
                <HStack space="sm">
                  <Box flex={1}>
                    <GluestackButton
                      title="Secondary"
                      onPress={handleTestButton}
                      variant="solid"
                      action="secondary"
                      size="md"
                    />
                  </Box>
                  <Box flex={1}>
                    <GluestackButton
                      title="Outline"
                      onPress={handleTestButton}
                      variant="outline"
                      action="primary"
                      size="md"
                    />
                  </Box>
                </HStack>
                
                <GluestackButton
                  title="Loading State"
                  onPress={handleTestButton}
                  variant="solid"
                  action="positive"
                  loading={true}
                />
                
                <GluestackButton
                  title="Ghost Action"
                  onPress={handleTestButton}
                  variant="link"
                  action="primary"
                  icon="heart"
                  iconPosition="right"
                />
              </VStack>
            </VStack>
          </GluestackCard>

          {/* Smart Inputs */}
          <GluestackCard title="📝 Intelligent Form Inputs" variant="elevated">
            <VStack space="md">
              <Text 
                size="sm" 
                color="$textLight600" 
                sx={{ _dark: { color: '$textSecondaryDark' } }}
              >
                Advanced form controls with built-in validation and accessibility:
              </Text>
              
              <VStack space="md">
                <GluestackInput
                  label="Enhanced Input"
                  placeholder="Try typing here..."
                  value={inputValue}
                  onChangeText={setInputValue}
                  leftIcon="person"
                  helperText="Built-in validation and error handling"
                  size="md"
                />
                
                <GluestackInput
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
                  size="md"
                />
                
                <GluestackInput
                  label="Multiline Performance"
                  placeholder="Test the enhanced multiline experience..."
                  value=""
                  onChangeText={() => {}}
                  multiline
                  maxLength={200}
                  helperText="Optimized for large text input"
                  size="md"
                />
              </VStack>
            </VStack>
          </GluestackCard>

          {/* Card Variants */}
          <GluestackCard title="🎨 Advanced Card System" variant="elevated">
            <VStack space="md">
              <Text 
                size="sm" 
                color="$textLight600" 
                sx={{ _dark: { color: '$textSecondaryDark' } }}
              >
                Flexible card system with enhanced performance:
              </Text>
              
              <VStack space="md">
                <GluestackCard
                  variant="outline"
                  padding="md"
                  margin="none"
                >
                  <Text 
                    size="sm" 
                    color="$textLight900" 
                    sx={{ _dark: { color: '$textDark' } }}
                  >
                    Outlined card with optimized rendering
                  </Text>
                </GluestackCard>
                
                <GluestackCard
                  variant="filled"
                  padding="md"
                  margin="none"
                >
                  <Text 
                    size="sm" 
                    color="$textLight900" 
                    sx={{ _dark: { color: '$textDark' } }}
                  >
                    Filled card with background variations
                  </Text>
                </GluestackCard>
                
                <GluestackCard
                  variant="ghost"
                  padding="md"
                  margin="none"
                  onPress={() => Alert.alert('🎯 Interactive!', 'Gluestack card interactions working!')}
                >
                  <HStack space="sm" alignItems="center">
                    <Text size="lg">👆</Text>
                    <Text 
                      flex={1} 
                      size="sm" 
                      color="$textLight900" 
                      sx={{ _dark: { color: '$textDark' } }}
                    >
                      Interactive ghost card (tap me!)
                    </Text>
                  </HStack>
                </GluestackCard>
              </VStack>
            </VStack>
          </GluestackCard>

          {/* Migration Benefits */}
          <GluestackCard title="✨ Migration Benefits" variant="filled">
            <VStack space="sm">
              <HStack space="sm" alignItems="center">
                <Text size="lg">⚡</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight900" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  Native performance with 60fps animations
                </Text>
              </HStack>
              <HStack space="sm" alignItems="center">
                <Text size="lg">🎯</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight900" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  WCAG 2.2 accessibility compliance built-in
                </Text>
              </HStack>
              <HStack space="sm" alignItems="center">
                <Text size="lg">🔧</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight900" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  TypeScript-first with excellent DX
                </Text>
              </HStack>
              <HStack space="sm" alignItems="center">
                <Text size="lg">🌐</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight900" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  Universal components for web and mobile
                </Text>
              </HStack>
              <HStack space="sm" alignItems="center">
                <Text size="lg">📦</Text>
                <Text 
                  flex={1} 
                  size="sm" 
                  color="$textLight900" 
                  sx={{ _dark: { color: '$textDark' } }}
                >
                  Tree-shaking for optimal bundle size
                </Text>
              </HStack>
            </VStack>
          </GluestackCard>

          {/* Performance Metrics */}
          <GluestackCard title="📊 Performance Metrics" variant="elevated">
            <VStack space="md">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="center">
                  <Text size="2xl" fontWeight="$bold" color="$success500">
                    70%
                  </Text>
                  <Text 
                    size="xs" 
                    color="$textLight600" 
                    sx={{ _dark: { color: '$textSecondaryDark' } }}
                  >
                    Faster Render
                  </Text>
                </VStack>
                <VStack alignItems="center">
                  <Text size="2xl" fontWeight="$bold" color="$primary500">
                    60fps
                  </Text>
                  <Text 
                    size="xs" 
                    color="$textLight600" 
                    sx={{ _dark: { color: '$textSecondaryDark' } }}
                  >
                    Animation
                  </Text>
                </VStack>
                <VStack alignItems="center">
                  <Text size="2xl" fontWeight="$bold" color="$warning500">
                    -20%
                  </Text>
                  <Text 
                    size="xs" 
                    color="$textLight600" 
                    sx={{ _dark: { color: '$textSecondaryDark' } }}
                  >
                    Bundle Size
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </GluestackCard>

        </VStack>
      </ScrollView>
    </Box>
  );
};