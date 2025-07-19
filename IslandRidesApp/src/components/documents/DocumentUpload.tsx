import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { StandardCard } from '../templates/StandardCard';
import { StandardButton } from '../templates/StandardButton';
import { StandardInput } from '../templates/StandardInput';
import { apiService } from '../../services/apiService';

interface DocumentUploadProps {
  documentType: 'vehicle' | 'host';
  vehicleId?: number;
  onUploadComplete?: (document: any) => void;
  onCancel?: () => void;
  requiredDocuments?: DocumentTemplate[];
}

interface DocumentTemplate {
  id: string;
  template_name: string;
  document_type: string;
  category: string;
  is_required: boolean;
  upload_instructions: string;
  file_type_restrictions: string[];
  max_file_size_mb: number;
}

interface DocumentFile {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

interface DocumentForm {
  document_type: string;
  document_name: string;
  document_description: string;
  document_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  renewal_required: boolean;
  category: string;
  is_required: boolean;
  is_public: boolean;
  regulatory_notes: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documentType,
  vehicleId,
  onUploadComplete,
  onCancel,
  requiredDocuments = []
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentForm, setDocumentForm] = useState<DocumentForm>({
    document_type: '',
    document_name: '',
    document_description: '',
    document_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    renewal_required: false,
    category: 'legal',
    is_required: false,
    is_public: false,
    regulatory_notes: ''
  });

  const documentTypes = [
    { id: 'registration', name: 'Registration', icon: 'document-text-outline' },
    { id: 'insurance', name: 'Insurance', icon: 'shield-outline' },
    { id: 'inspection', name: 'Inspection', icon: 'checkmark-circle-outline' },
    { id: 'license', name: 'License', icon: 'card-outline' },
    { id: 'permit', name: 'Permit', icon: 'ribbon-outline' },
    { id: 'maintenance', name: 'Maintenance', icon: 'construct-outline' },
    { id: 'warranty', name: 'Warranty', icon: 'time-outline' },
    { id: 'business_license', name: 'Business License', icon: 'business-outline' },
    { id: 'tax_certificate', name: 'Tax Certificate', icon: 'receipt-outline' },
    { id: 'identity', name: 'Identity', icon: 'person-outline' },
    { id: 'address_proof', name: 'Address Proof', icon: 'home-outline' },
    { id: 'bank_statement', name: 'Bank Statement', icon: 'card-outline' }
  ];

  const handleSelectDocumentType = () => {
    setShowTemplateModal(true);
  };

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setDocumentForm({
      ...documentForm,
      document_type: template.document_type,
      category: template.category,
      is_required: template.is_required,
      document_name: template.template_name
    });
    setShowTemplateModal(false);
  };

  const processSelectedFile = (file: DocumentFile, fileName: string): boolean => {
    // Validate file size
    const maxSize = selectedTemplate?.max_file_size_mb || 10;
    if (file.size && file.size > maxSize * 1024 * 1024) {
      Alert.alert('File Too Large', `Maximum file size is ${maxSize}MB`);
      return false;
    }

    // Validate file type
    const allowedTypes = selectedTemplate?.file_type_restrictions || ['pdf', 'jpg', 'jpeg', 'png'];
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (fileExtension && !allowedTypes.includes(fileExtension)) {
      Alert.alert('Invalid File Type', `Only ${allowedTypes.join(', ')} files are allowed`);
      return false;
    }

    setSelectedFile(file);
    
    // Auto-fill document name if not set
    if (!documentForm.document_name) {
      setDocumentForm({
        ...documentForm,
        document_name: fileName
      });
    }
    
    return true;
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedTemplate(null);
    setDocumentForm({
      document_type: '',
      document_name: '',
      document_description: '',
      document_number: '',
      issuing_authority: '',
      issue_date: '',
      expiry_date: '',
      renewal_required: false,
      category: 'legal',
      is_required: false,
      is_public: false,
      regulatory_notes: ''
    });
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const file: DocumentFile = {
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name,
          size: asset.size
        };
        
        processSelectedFile(file, asset.name);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleImageSelect = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        const fileName = `document_${Date.now()}.jpg`;
        
        const file: DocumentFile = {
          uri: image.uri,
          type: 'image/jpeg',
          name: fileName,
          size: image.fileSize
        };

        processSelectedFile(file, fileName);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    if (!documentForm.document_type) {
      Alert.alert('Error', 'Please select a document type');
      return;
    }

    if (!documentForm.document_name.trim()) {
      Alert.alert('Error', 'Please enter a document name');
      return;
    }

    // Check for API URL environment variable
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      Alert.alert('Configuration Error', 'API URL is not configured. Please contact support.');
      return;
    }

    try {
      setIsUploading(true);

      // Get auth token
      const authToken = await apiService.getAuthToken();
      if (!authToken) {
        Alert.alert('Authentication Error', 'Please log in to upload documents');
        return;
      }

      const formData = new FormData();
      // Create blob for form data
      const fileBlob = {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name
      } as any; // FormData expects this format for React Native
      formData.append('document', fileBlob);
      formData.append('document_type', documentForm.document_type);
      formData.append('document_name', documentForm.document_name);
      formData.append('document_description', documentForm.document_description);
      formData.append('document_number', documentForm.document_number);
      formData.append('issuing_authority', documentForm.issuing_authority);
      formData.append('issue_date', documentForm.issue_date);
      formData.append('expiry_date', documentForm.expiry_date);
      formData.append('renewal_required', documentForm.renewal_required.toString());
      formData.append('category', documentForm.category);
      formData.append('is_required', documentForm.is_required.toString());
      formData.append('is_public', documentForm.is_public.toString());
      formData.append('regulatory_notes', documentForm.regulatory_notes);

      const endpoint = documentType === 'vehicle' 
        ? `/documents/vehicle/${vehicleId}`
        : '/documents/host';

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Document uploaded successfully');
        resetForm(); // Reset form after successful upload
        onUploadComplete?.(result.data);
      } else {
        // Improved error handling based on status codes
        let errorMessage = 'Failed to upload document';
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to upload this document.';
        } else if (response.status === 413) {
          errorMessage = 'File is too large. Please select a smaller file.';
        } else if (response.status === 422) {
          errorMessage = 'Invalid document data. Please check your inputs.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (result.message) {
          errorMessage = result.message;
        }
        
        Alert.alert('Upload Failed', errorMessage);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // Distinguish between network and other errors
      let errorMessage = 'Failed to upload document';
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = `Upload error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const updateFormField = (field: keyof DocumentForm, value: any) => {
    setDocumentForm({
      ...documentForm,
      [field]: value
    });
  };

  const renderTemplateModal = () => (
    <Modal visible={showTemplateModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Document Type</Text>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={documentTypes.filter(type => 
              documentType === 'vehicle' 
                ? ['registration', 'insurance', 'inspection', 'license', 'permit', 'maintenance', 'warranty'].includes(type.id)
                : ['business_license', 'tax_certificate', 'identity', 'address_proof', 'bank_statement'].includes(type.id)
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.templateItem}
                onPress={() => handleTemplateSelect({
                  id: item.id,
                  template_name: item.name,
                  document_type: item.id,
                  category: 'legal',
                  is_required: false,
                  upload_instructions: '',
                  file_type_restrictions: ['pdf', 'jpg', 'jpeg', 'png'],
                  max_file_size_mb: 10
                })}
              >
                <View style={styles.templateIcon}>
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                </View>
                <Text style={styles.templateName}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderFileSelector = () => (
    <StandardCard variant="outlined" margin="medium">
      <Text style={styles.sectionTitle}>Select File</Text>
      
      {selectedFile ? (
        <View style={styles.selectedFile}>
          <Ionicons name="document-attach" size={24} color={colors.primary} />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileSize}>
              {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Unknown size'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeFileButton}
            onPress={() => setSelectedFile(null)}
          >
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.fileSelectors}>
          <TouchableOpacity style={styles.fileSelector} onPress={handleFileSelect}>
            <Ionicons name="document-outline" size={32} color={colors.primary} />
            <Text style={styles.fileSelectorText}>Select Document</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fileSelector} onPress={handleImageSelect}>
            <Ionicons name="camera-outline" size={32} color={colors.primary} />
            <Text style={styles.fileSelectorText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </StandardCard>
  );

  return (
    <View style={styles.container}>
      <StandardCard variant="default" margin="medium">
        <Text style={styles.title}>Upload Document</Text>
        
        <TouchableOpacity
          style={styles.documentTypeSelector}
          onPress={handleSelectDocumentType}
        >
          <Text style={styles.documentTypeSelectorText}>
            {documentForm.document_type || 'Select Document Type'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {selectedTemplate && (
          <Text style={styles.instructionText}>
            {selectedTemplate.upload_instructions || 'Please upload the required document.'}
          </Text>
        )}
      </StandardCard>

      {renderFileSelector()}

      <StandardCard variant="default" margin="medium">
        <Text style={styles.sectionTitle}>Document Details</Text>
        
        <StandardInput
          label="Document Name"
          value={documentForm.document_name}
          onChangeText={(value) => updateFormField('document_name', value)}
          placeholder="Enter document name"
        />

        <StandardInput
          label="Document Number"
          value={documentForm.document_number}
          onChangeText={(value) => updateFormField('document_number', value)}
          placeholder="Enter document number"
        />

        <StandardInput
          label="Issuing Authority"
          value={documentForm.issuing_authority}
          onChangeText={(value) => updateFormField('issuing_authority', value)}
          placeholder="Enter issuing authority"
        />

        <StandardInput
          label="Issue Date"
          value={documentForm.issue_date}
          onChangeText={(value) => updateFormField('issue_date', value)}
          placeholder="YYYY-MM-DD"
        />

        <StandardInput
          label="Expiry Date"
          value={documentForm.expiry_date}
          onChangeText={(value) => updateFormField('expiry_date', value)}
          placeholder="YYYY-MM-DD"
        />

        <StandardInput
          label="Description"
          value={documentForm.document_description}
          onChangeText={(value) => updateFormField('document_description', value)}
          placeholder="Enter description (optional)"
          multiline
        />
      </StandardCard>

      <View style={styles.buttonContainer}>
        <StandardButton
          title="Cancel"
          onPress={onCancel || (() => {})}
          variant="outline"
        />
        
        <StandardButton
          title={isUploading ? 'Uploading...' : 'Upload Document'}
          onPress={handleUpload}
          disabled={isUploading || !selectedFile}
          loading={isUploading}
        />
      </View>

      {renderTemplateModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  documentTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  documentTypeSelectorText: {
    ...typography.body,
    color: colors.text,
  },
  instructionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  fileSelectors: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fileSelector: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
  },
  fileSelectorText: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.md,
  },
  fileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fileName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  fileSize: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  removeFileButton: {
    padding: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.heading4,
    color: colors.text,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  templateName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});