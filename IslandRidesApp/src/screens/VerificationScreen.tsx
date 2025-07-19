import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/apiService';
import { RootStackParamList } from '../navigation/routes';

interface VerificationStatus {
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  driving_license_verified: boolean;
  identity_document_url?: string;
  driving_license_document_url?: string;
  verification_score: number;
}

interface DocumentAsset {
  uri: string;
  name: string;
  type: string;
}

type VerificationScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type VerificationScreenRouteProp = RouteProp<RootStackParamList>;

interface VerificationScreenProps {
  navigation: VerificationScreenNavigationProp;
  route: VerificationScreenRouteProp;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ data: VerificationStatus }>('/api/profiles/me/verification');
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Failed to load verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async (documentType: 'identity' | 'driving_license') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const documentAsset = {
          uri: asset.uri,
          name: asset.name || `${documentType}_${Date.now()}.pdf`,
          type: asset.mimeType || 'application/pdf',
        };
        await uploadDocument(documentAsset, documentType);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async (documentType: 'identity' | 'driving_license') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const documentAsset = {
          uri: asset.uri,
          name: `${documentType}_${Date.now()}.jpg`,
          type: 'image/jpeg',
        };
        await uploadDocument(documentAsset, documentType);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadDocument = async (document: DocumentAsset, documentType: 'identity' | 'driving_license') => {
    try {
      setUploadingDocument(documentType);
      
      const formData = new FormData();
      formData.append('document', {
        uri: document.uri,
        type: document.type || 'image/jpeg',
        name: document.name || `${documentType}_${Date.now()}.jpg`,
      } as unknown as Blob); // React Native file object for FormData
      formData.append('documentType', documentType);

      const response = await fetch(`${apiService.baseURL}/api/verification/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await apiService.getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Document uploaded successfully');
        await loadVerificationStatus();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploadingDocument(null);
    }
  };

  const showDocumentOptions = (documentType: 'identity' | 'driving_license') => {
    Alert.alert(
      'Select Document Source',
      'Choose how you want to upload your document',
      [
        { text: 'Camera Roll', onPress: () => pickImage(documentType) },
        { text: 'Files', onPress: () => pickDocument(documentType) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getVerificationIcon = (isVerified: boolean, hasDocument: boolean) => {
    if (isVerified) {
      return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
    } else if (hasDocument) {
      return <Ionicons name="time-outline" size={24} color="#FF9800" />;
    } else {
      return <Ionicons name="close-circle" size={24} color="#F44336" />;
    }
  };

  const getVerificationText = (isVerified: boolean, hasDocument: boolean) => {
    if (isVerified) {
      return 'Verified';
    } else if (hasDocument) {
      return 'Pending Review';
    } else {
      return 'Not Verified';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading verification status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account Verification</Text>
        <Text style={styles.subtitle}>
          Verify your account to unlock all features and build trust with other users.
        </Text>
        {verificationStatus && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Verification Score:</Text>
            <Text style={styles.scoreValue}>{verificationStatus.verification_score}%</Text>
          </View>
        )}
      </View>

      {verificationStatus && (
        <View style={styles.verificationList}>
          {/* Email Verification */}
          <View style={styles.verificationItem}>
            <View style={styles.verificationInfo}>
              <Ionicons name="mail-outline" size={24} color="#666" />
              <View style={styles.verificationDetails}>
                <Text style={styles.verificationTitle}>Email Address</Text>
                <Text style={styles.verificationStatus}>
                  {getVerificationText(verificationStatus.email_verified, false)}
                </Text>
              </View>
            </View>
            {getVerificationIcon(verificationStatus.email_verified, false)}
          </View>

          {/* Phone Verification */}
          <View style={styles.verificationItem}>
            <View style={styles.verificationInfo}>
              <Ionicons name="call-outline" size={24} color="#666" />
              <View style={styles.verificationDetails}>
                <Text style={styles.verificationTitle}>Phone Number</Text>
                <Text style={styles.verificationStatus}>
                  {getVerificationText(verificationStatus.phone_verified, false)}
                </Text>
              </View>
            </View>
            {getVerificationIcon(verificationStatus.phone_verified, false)}
          </View>

          {/* Identity Document */}
          <View style={styles.verificationItem}>
            <View style={styles.verificationInfo}>
              <Ionicons name="card-outline" size={24} color="#666" />
              <View style={styles.verificationDetails}>
                <Text style={styles.verificationTitle}>Identity Document</Text>
                <Text style={styles.verificationSubtitle}>NIB Card or Passport</Text>
                <Text style={styles.verificationStatus}>
                  {getVerificationText(
                    verificationStatus.identity_verified,
                    !!verificationStatus.identity_document_url
                  )}
                </Text>
              </View>
            </View>
            <View style={styles.verificationActions}>
              {getVerificationIcon(
                verificationStatus.identity_verified,
                !!verificationStatus.identity_document_url
              )}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => showDocumentOptions('identity')}
                disabled={uploadingDocument === 'identity'}
              >
                {uploadingDocument === 'identity' ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Driving License */}
          <View style={styles.verificationItem}>
            <View style={styles.verificationInfo}>
              <Ionicons name="car-outline" size={24} color="#666" />
              <View style={styles.verificationDetails}>
                <Text style={styles.verificationTitle}>Driving License</Text>
                <Text style={styles.verificationSubtitle}>Valid Bahamas License</Text>
                <Text style={styles.verificationStatus}>
                  {getVerificationText(
                    verificationStatus.driving_license_verified,
                    !!verificationStatus.driving_license_document_url
                  )}
                </Text>
              </View>
            </View>
            <View style={styles.verificationActions}>
              {getVerificationIcon(
                verificationStatus.driving_license_verified,
                !!verificationStatus.driving_license_document_url
              )}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => showDocumentOptions('driving_license')}
                disabled={uploadingDocument === 'driving_license'}
              >
                {uploadingDocument === 'driving_license' ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Why Verify Your Account?</Text>
        <View style={styles.benefitItem}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Build trust with other users</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="star" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Access premium features</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="trending-up" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Increase booking success rate</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="lock-closed" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Enhanced account security</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  verificationList: {
    backgroundColor: '#fff',
    marginTop: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verificationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  verificationStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  verificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButton: {
    marginLeft: 12,
    padding: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

export default VerificationScreen;