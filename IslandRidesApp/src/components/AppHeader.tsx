import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing } from '../styles/theme';
import { NavigationProp } from '@react-navigation/native';
import { BusinessLogicError } from '../services/errors/BusinessLogicError';

interface AppHeaderProps {
  title: string;
  navigation: NavigationProp<any>;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showProfileButton?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  navigation,
  showBackButton = false,
  onBackPress,
  showProfileButton = true
}) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 User confirmed logout from header');
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              if (error instanceof BusinessLogicError) {
                Alert.alert('Logout Failed', error.message);
              } else {
                Alert.alert('Logout Failed', 'An unexpected error occurred. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={onBackPress || (() => navigation.goBack())}
            style={styles.iconButton}
            accessibilityLabel="Back"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {showProfileButton && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            style={styles.iconButton}
            accessibilityLabel="Profile"
          >
            <MaterialIcons name="person" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.iconButton}
          accessibilityLabel="Logout"
        >
          <MaterialIcons name="logout" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48, // Account for status bar
    height: 88,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
});

