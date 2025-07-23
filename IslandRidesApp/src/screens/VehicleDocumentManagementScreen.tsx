import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { ComponentProps } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';
import { AppHeader } from '../components/AppHeader';
import { RootStackParamList } from '../navigation/routes';

interface VehicleDocuments {
  title_document_url?: string;
  insurance_document_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
}

interface VehicleDocumentManagementScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'VehicleDocumentManagement'>;
  route: RouteProp<RootStackParamList, 'VehicleDocumentManagement'>;
}

export const VehicleDocumentManagementScreen: React.FC<VehicleDocumentManagementScreenProps> = ({
  navigation,
  route,
}) => {
  const { vehicleId } = route.params;
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<VehicleDocuments | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  useEffect(() => {
    loadVehicleDocuments();
  }, []);

  const loadVehicleDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/vehicles/${vehicleId}/documents`) as any;
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load vehicle documents:', error);
      notificationService.error('Failed to load vehicle documents');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async (documentType: 'title' | 'insurance') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        await uploadDocument(document, documentType);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadDocument = async (document: DocumentPicker.DocumentPickerAsset, documentType: 'title' | 'insurance') => {
    try {
      setUploadingDocument(documentType);

      const formData = new FormData();
      formData.append('document', {
        uri: document.uri,
        type: document.mimeType || 'application/pdf',
        name: document.name || `${documentType}_${Date.now()}.pdf`,
      } as unknown as Blob); // React Native file object for FormData
      formData.append('documentType', documentType);

      const response = await fetch(`${apiService.baseURL}/api/vehicles/${vehicleId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await apiService.getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        notificationService.success(`${documentType === 'title' ? 'Title' : 'Insurance'} document uploaded successfully`);
        await loadVehicleDocuments();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Error', `Failed to upload ${documentType} document`);
    } finally {
      setUploadingDocument(null);
    }
  };

  const getDocumentStatus = (hasDocument: boolean, verificationStatus: string): {
    text: string;
    color: string;
    icon: ComponentProps<typeof Ionicons>['name'];
  } => {
    if (!hasDocument) {
      return { text: 'Not Uploaded', color: colors.textSecondary, icon: 'document-outline' };
    }
    
    switch (verificationStatus) {
      case 'verified':
        return { text: 'Verified', color: colors.success, icon: 'checkmark-circle' };
      case 'pending':
        return { text: 'Pending Review', color: colors.warning, icon: 'time-outline' };
      case 'rejected':
        return { text: 'Rejected', color: colors.error, icon: 'close-circle' };
      default:
        return { text: 'Uploaded', color: colors.info, icon: 'document' };
    }
  };

  const renderDocumentSection = (title: string, documentType: 'title' | 'insurance', hasDocument: boolean) => {
    const status = getDocumentStatus(hasDocument, documents?.verification_status || 'pending');
    const isUploading = uploadingDocument === documentType;

    return (
      <View style={styles.documentSection}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>{title}</Text>
          <View style={styles.statusContainer}>
            <Ionicons name={status.icon} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>
        
        <Text style={styles.documentDescription}>
          {documentType === 'title' 
            ? 'Upload your vehicle title or registration document'
            : 'Upload your current vehicle insurance certificate'
          }
        </Text>

        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={() => pickDocument(documentType)}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
          )}
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : hasDocument ? 'Replace Document' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Vehicle Documents" navigation={navigation} showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Vehicle Documents" navigation={navigation} showBackButton={true} onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Upload your vehicle title and insurance documents to complete verification. 
            Both documents are required before your vehicle can be listed as active.
          </Text>
        </View>

        {renderDocumentSection(
          'Vehicle Title/Registration',
          'title',
          !!documents?.title_document_url
        )}

        {renderDocumentSection(
          'Insurance Certificate',
          'insurance',
          !!documents?.insurance_document_url
        )}

        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsTitle}>Document Requirements:</Text>
          <View style={styles.requirement}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={styles.requirementText}>Clear, readable images or PDF files</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={styles.requirementText}>Documents must be current and valid</Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={styles.requirementText}>File size should be under 10MB</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.body,
    color: colors.info,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  documentSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  documentTitle: {
    ...typography.heading4,
    color: colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  documentDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  uploadButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  uploadButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  requirementsSection: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  requirementsTitle: {
    ...typography.heading4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requirementText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default VehicleDocumentManagementScreen;