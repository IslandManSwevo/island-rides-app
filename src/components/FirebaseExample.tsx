import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, Alert, StyleSheet } from 'react-native';
import { User } from 'firebase/auth';
import FirebaseService from '../services/firebaseService';

/**
 * Example component demonstrating Firebase modular API usage
 * This shows how to use Firebase Authentication, Firestore, and Storage
 */
const FirebaseExample: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = FirebaseService.auth.onAuthStateChange((user) => {
      setUser(user);
      console.log('Auth state changed:', user?.email || 'No user');
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await FirebaseService.auth.signUp(email, password);
      console.log('User created:', userCredential.user.email);
      
      // Create user profile in Firestore
      await FirebaseService.examples.createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || 'New User',
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: Error | unknown) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await FirebaseService.auth.signIn(email, password);
      console.log('User signed in:', userCredential.user.email);
      Alert.alert('Success', 'Signed in successfully!');
    } catch (error: Error | unknown) {
      console.error('Sign in error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await FirebaseService.auth.signOut();
      Alert.alert('Success', 'Signed out successfully!');
    } catch (error: Error | unknown) {
      console.error('Sign out error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        pricePerHour: 25,
        ownerId: user.uid,
        isAvailable: true,
        location: 'Sample Location'
      };

      const vehicleId = await FirebaseService.firestore.createDocument('vehicles', vehicleData);
      console.log('Vehicle created with ID:', vehicleId);
      Alert.alert('Success', `Vehicle created with ID: ${vehicleId}`);
    } catch (error: Error | unknown) {
      console.error('Create vehicle error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetUserVehicles = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setLoading(true);
    try {
      const vehicles = await FirebaseService.examples.getUserVehicles(user.uid);
      console.log('User vehicles:', vehicles);
      Alert.alert('Vehicles', `Found ${vehicles.length} vehicles for user`);
    } catch (error: Error | unknown) {
      console.error('Get vehicles error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Modular API Example</Text>
      
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>Signed in as: {user.email}</Text>
          <Text style={styles.userText}>UID: {user.uid}</Text>
        </View>
      ) : (
        <Text style={styles.userText}>Not signed in</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.buttonContainer}>
        {!user ? (
          <>
            <Button title="Sign Up" onPress={handleSignUp} disabled={loading} />
            <Button title="Sign In" onPress={handleSignIn} disabled={loading} />
          </>
        ) : (
          <>
            <Button title="Sign Out" onPress={handleSignOut} disabled={loading} />
            <Button title="Create Vehicle" onPress={handleCreateVehicle} disabled={loading} />
            <Button title="Get My Vehicles" onPress={handleGetUserVehicles} disabled={loading} />
          </>
        )}
      </View>

      {loading && <Text style={styles.loadingText}>Loading...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  userInfo: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  userText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default FirebaseExample;