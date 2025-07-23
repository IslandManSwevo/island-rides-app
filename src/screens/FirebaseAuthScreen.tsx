import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';

/**
 * Firebase Authentication Screen demonstrating the exact patterns from Firebase documentation
 * 
 * This component implements:
 * 1. Initialize Firebase Authentication and get a reference to the service
 * 2. Sign up new users using createUserWithEmailAndPassword
 * 3. Sign in existing users using signInWithEmailAndPassword
 * 4. Set an authentication state observer using onAuthStateChanged
 */

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth();

const FirebaseAuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Set an authentication state observer and get user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log('Firebase Auth: User is signed in', { uid, email: user.email });
        setUser(user);
      } else {
        // User is signed out
        console.log('Firebase Auth: User is signed out');
        setUser(null);
      }
      if (initializing) setInitializing(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [initializing]);

  // Sign up new users
  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // Create a form that allows new users to register with your app using their email address and a password.
      // When a user completes the form, validate the email address and password provided by the user,
      // then pass them to the createUserWithEmailAndPassword method:
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Signed up 
      const user = userCredential.user;
      console.log('Sign up successful', { uid: user.uid, email: user.email });
      Alert.alert('Success', 'Account created successfully!');
      
      // Clear form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign up error:', { errorCode, errorMessage });
      Alert.alert('Sign Up Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign in existing users
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // Create a form that allows existing users to sign in using their email address and password.
      // When a user completes the form, call the signInWithEmailAndPassword method:
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Signed in 
      const user = userCredential.user;
      console.log('Sign in successful', { uid: user.uid, email: user.email });
      Alert.alert('Success', 'Signed in successfully!');
      
      // Clear form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error:', { errorCode, errorMessage });
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sign out current user
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      Alert.alert('Success', 'Signed out successfully!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Firebase Auth...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Firebase Authentication</Text>
      <Text style={styles.subtitle}>JS SDK Modular API Demo</Text>

      {user ? (
        // User is signed in - show user information
        <View style={styles.userSection}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userText}>
              <Text style={styles.label}>Email:</Text> {user.email}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.label}>UID:</Text> {user.uid}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.label}>Email Verified:</Text> {user.emailVerified ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.label}>Provider:</Text> {user.providerData[0]?.providerId || 'N/A'}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.label}>Created:</Text> {user.metadata.creationTime}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.label}>Last Sign In:</Text> {user.metadata.lastSignInTime}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.signOutButton]} 
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        // User is not signed in - show authentication form
        <View style={styles.authSection}>
          <Text style={styles.sectionTitle}>Authentication Form</Text>
          
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.signInButton]} 
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.signUpButton]} 
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Implementation Details</Text>
        <Text style={styles.infoText}>
          • Uses Firebase JS SDK v11.10.0 with modular API{'\n'}
          • Implements createUserWithEmailAndPassword for sign up{'\n'}
          • Implements signInWithEmailAndPassword for sign in{'\n'}
          • Uses onAuthStateChanged for real-time auth state monitoring{'\n'}
          • Demonstrates proper error handling with error codes
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  userSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  authSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 20,
  },
  userText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  label: {
    fontWeight: '600',
    color: '#007AFF',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  signInButton: {
    backgroundColor: '#007AFF',
    flex: 1,
  },
  signUpButton: {
    backgroundColor: '#34C759',
    flex: 1,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default FirebaseAuthScreen;