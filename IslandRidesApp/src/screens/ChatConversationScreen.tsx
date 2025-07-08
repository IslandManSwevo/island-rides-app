import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { notificationService } from '../services/notificationService';
import { 
  GiftedChat, 
  IMessage, 
  User as GiftedChatUser, 
  Actions, 
  Composer, 
  Send, 
  MessageImage,
  Bubble,
  InputToolbar
} from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';

import { ChatContext, ChatMessage, ConversationResponse } from '../types';
import { RootStackParamList } from '../navigation/routes';
import conversationService from '../services/conversationService';
import chatService from '../services/chatService';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

// Quick reply templates for car rental context
const QUICK_REPLIES = [
  { id: 1, text: "👋 Hello! I'm interested in this vehicle", category: 'greeting' },
  { id: 2, text: "📅 What dates is it available?", category: 'availability' },
  { id: 3, text: "💰 Is the price negotiable?", category: 'pricing' },
  { id: 4, text: "🚗 Can I see more photos?", category: 'details' },
  { id: 5, text: "📍 Where can I pick it up?", category: 'logistics' },
  { id: 6, text: "🆔 What documents do I need?", category: 'requirements' },
  { id: 7, text: "✅ Looks good! How do we proceed?", category: 'confirmation' },
  { id: 8, text: "🙏 Thank you for your time!", category: 'closing' },
];

// Navigation types
type ChatConversationScreenProps = StackScreenProps<RootStackParamList, 'Chat'>;

const ChatConversationScreen: React.FC<ChatConversationScreenProps> = ({ route, navigation }) => {
  const { currentUser: authUser } = useAuth();
  const { context, title: initialTitle } = route.params;

  // State management
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [conversationData, setConversationData] = useState<ConversationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced chat features
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);

  // Refs for cleanup
  const isMountedRef = useRef(true);

  /**
   * Initialize conversation and chat connection
   */
  useEffect(() => {
    initializeChat();
    requestPermissions();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [context]);

  /**
   * Request necessary permissions
   */
  const requestPermissions = async () => {
    try {
      // Request microphone permission for voice messages
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === 'granted');

      // Request camera/photo library permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        console.warn('Camera/Library permissions not granted');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  /**
   * Set up navigation header
   */
  useEffect(() => {
    if (conversationData) {
      const headerTitle = initialTitle || 
        conversationService.getConversationTitle(
          context,
          conversationData.participant,
          conversationData.vehicle
        );

      navigation.setOptions({
        headerTitle: headerTitle,
        headerTitleStyle: { fontSize: 16 },
      });
    }
  }, [conversationData, initialTitle, context, navigation]);

  /**
   * Initialize chat system
   */
  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Initializing chat with context:', context);

      // Step 1: Resolve conversation context
      const resolvedConversation = await conversationService.resolveConversation(context);
      
      if (!isMountedRef.current) return;
      
      setConversationData(resolvedConversation);
      console.log('✅ Conversation resolved:', resolvedConversation);

      // Step 2: Load message history
      await loadMessageHistory(resolvedConversation.conversationId);

      // Step 3: Connect to chat server
      await connectToChat(resolvedConversation.conversationId);

    } catch (error) {
      console.error('❌ Failed to initialize chat:', error);
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to initialize chat');
        setIsLoading(false);
      }
    }
  };

  /**
   * Load message history from API
   */
  const loadMessageHistory = async (conversationId: number) => {
    try {
      console.log('📚 Loading message history...');
      
      const chatMessages = await chatService.loadMessageHistory(conversationId);
      
      if (!isMountedRef.current) return;

      // Transform to GiftedChat format
      const giftedMessages: IMessage[] = chatMessages.map(transformToGiftedMessage);
      
      setMessages(giftedMessages);
      console.log(`✅ Loaded ${giftedMessages.length} messages`);

    } catch (error) {
      console.error('❌ Failed to load message history:', error);
      // Continue without history - not a critical error
    }
  };

  /**
   * Connect to WebSocket chat server
   */
  const connectToChat = async (conversationId: number) => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');

      console.log('🔌 Connecting to chat server...');

      // Connect to WebSocket
      await chatService.connect();
      
      if (!isMountedRef.current) return;

      // Join conversation room
      await chatService.joinConversation(conversationId);
      
      if (!isMountedRef.current) return;

      // Set up message listener
      chatService.onMessage(handleNewMessage);
      
      // Set up connection listeners
      chatService.onConnect(() => {
        if (isMountedRef.current) {
          setConnectionStatus('connected');
        }
      });

      chatService.onDisconnect(() => {
        if (isMountedRef.current) {
          setConnectionStatus('disconnected');
        }
      });

      chatService.onError((error) => {
        if (isMountedRef.current) {
          console.error('❌ Chat error:', error);
          setError(error);
        }
      });

      setConnectionStatus('connected');
      console.log('✅ Connected to chat server');

    } catch (error) {
      console.error('❌ Failed to connect to chat:', error);
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to connect to chat');
        setConnectionStatus('disconnected');
      }
    } finally {
      if (isMountedRef.current) {
        setIsConnecting(false);
        setIsLoading(false);
      }
    }
  };

  /**
   * Handle new incoming messages
   */
  const handleNewMessage = useCallback((message: ChatMessage) => {
    if (!isMountedRef.current) return;

    console.log('📨 New message received:', message);
    
    // Show notification if message is from other user and app is not focused
    if (message.user._id !== getCurrentUser()._id) {
      notificationService.info(`${message.user.name}: ${message.text}`, {
        title: 'New Message',
        duration: 3000,
        action: {
          label: 'Reply',
          handler: () => {} // Already in chat screen
        }
      });
    }
    
    const giftedMessage = transformToGiftedMessage(message);
    
    setMessages(previousMessages => 
      GiftedChat.append(previousMessages, [giftedMessage])
    );
  }, []);

  /**
   * Transform ChatMessage to GiftedChat IMessage format
   */
  const transformToGiftedMessage = (chatMessage: ChatMessage): IMessage => {
    const baseMessage: IMessage = {
      _id: chatMessage._id,
      text: chatMessage.text,
      createdAt: new Date(chatMessage.createdAt),
      user: {
        _id: chatMessage.user._id,
        name: chatMessage.user.name,
        avatar: chatMessage.user.avatar,
      },
    };

    // Add image if present
    if (chatMessage.image) {
      baseMessage.image = chatMessage.image;
    }

    // Add audio if present
    if (chatMessage.audio) {
      baseMessage.audio = chatMessage.audio;
    }

    return baseMessage;
  };

  /**
   * Handle sending messages
   */
  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!chatService.isConnected()) {
      notificationService.error('Not connected to chat server. Please check your connection and try again.', {
        title: 'Connection Error',
        duration: 5000,
        action: {
          label: 'Retry',
          handler: () => onSend(newMessages)
        }
      });
      return;
    }

    const message = newMessages[0];
    if (!message?.text?.trim() && !message?.image && !message?.audio) return;

    try {
      // Optimistically update UI
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, newMessages)
      );

      // Send via WebSocket
      await chatService.sendMessage(message.text || '');
      
      console.log('✅ Message sent successfully');

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Remove optimistic message on failure
      setMessages(previousMessages =>
        previousMessages.filter(msg => msg._id !== message._id)
      );

      notificationService.error('Failed to send message', {
        title: 'Send Failed',
        duration: 4000,
        action: {
          label: 'Retry',
          handler: () => onSend(newMessages)
        }
      });
    }
  }, []);

  /**
   * Handle quick reply selection
   */
  const handleQuickReply = (reply: typeof QUICK_REPLIES[0]) => {
    const message: IMessage = {
      _id: Math.round(Math.random() * 1000000),
      text: reply.text,
      createdAt: new Date(),
      user: getCurrentUser(),
    };
    
    onSend([message]);
    setShowQuickReplies(false);
  };

  /**
   * Handle image picking
   */
  const pickImage = async (useCamera: boolean = false) => {
    try {
      const result = useCamera 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        const message: IMessage = {
          _id: Math.round(Math.random() * 1000000),
          text: '',
          createdAt: new Date(),
          user: getCurrentUser(),
          image: imageUri,
        };
        
        onSend([message]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      notificationService.error('Failed to select image', { duration: 3000 });
    }
  };

  /**
   * Handle voice recording
   */
  const startRecording = async () => {
    if (!audioPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable microphone permission in settings to send voice messages.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      notificationService.error('Failed to start recording', { duration: 3000 });
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const message: IMessage = {
          _id: Math.round(Math.random() * 1000000),
          text: '',
          createdAt: new Date(),
          user: getCurrentUser(),
          audio: uri,
        };
        
        onSend([message]);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      notificationService.error('Failed to save voice message', { duration: 3000 });
    }
  };

  /**
   * Get current user for GiftedChat
   */
  const getCurrentUser = (): GiftedChatUser => {
    if (!authUser) {
      // Fallback if user is not available
      return {
        _id: 1,
        name: 'You',
      };
    }

    return {
      _id: authUser.id,
      name: `${authUser.firstName} ${authUser.lastName}`,
    };
  };

  /**
   * Cleanup function
   */
  const cleanup = () => {
    console.log('🧹 Cleaning up chat screen...');
    
    try {
      chatService.disconnect();
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  };

  /**
   * Retry connection
   */
  const retryConnection = () => {
    setError(null);
    initializeChat();
  };

  /**
   * Custom Actions component
   */
  const renderActions = (props: any) => (
    <Actions
      {...props}
      options={{
        'Camera': () => pickImage(true),
        'Photo Library': () => pickImage(false),
        'Voice Message': isRecording ? stopRecording : startRecording,
        'Quick Replies': () => setShowQuickReplies(true),
        'Cancel': () => {},
      }}
      icon={() => (
        <View style={styles.actionsButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </View>
      )}
      onSend={onSend}
    />
  );

  /**
   * Custom Send component
   */
  const renderSend = (props: any) => (
    <Send {...props}>
      <View style={styles.sendButton}>
        <Ionicons name="send" size={20} color={colors.primary} />
      </View>
    </Send>
  );

  /**
   * Custom Bubble component
   */
  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: colors.primary,
        },
        left: {
          backgroundColor: '#f0f0f0',
        },
      }}
      textStyle={{
        right: {
          color: '#fff',
        },
        left: {
          color: '#000',
        },
      }}
    />
  );

  /**
   * Custom Input Toolbar
   */
  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={{ alignItems: 'center' }}
    />
  );

  /**
   * Custom Message Image component
   */
  const renderMessageImage = (props: any) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedImage(props.currentMessage.image);
        setShowImageViewer(true);
      }}
    >
      <MessageImage
        {...props}
        imageStyle={{
          width: 200,
          height: 200,
          borderRadius: borderRadius.md,
        }}
      />
    </TouchableOpacity>
  );

  /**
   * Custom Message Audio component (simplified - no built-in audio player)
   */
  const renderMessageAudio = (props: any) => (
    <View style={styles.audioMessage}>
      <Ionicons name="play-circle" size={40} color={colors.primary} />
      <Text style={styles.audioText}>Voice Message</Text>
    </View>
  );

  /**
   * Render Quick Replies Modal
   */
  const renderQuickRepliesModal = () => (
    <Modal
      visible={showQuickReplies}
      transparent
      animationType="slide"
      onRequestClose={() => setShowQuickReplies(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.quickRepliesModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Replies</Text>
            <TouchableOpacity onPress={() => setShowQuickReplies(false)}>
              <Ionicons name="close" size={24} color={colors.lightGrey} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {QUICK_REPLIES.map((reply) => (
              <TouchableOpacity
                key={reply.id}
                style={styles.quickReplyItem}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={styles.quickReplyText}>{reply.text}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.lightGrey} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  /**
   * Render Image Viewer Modal
   */
  const renderImageViewer = () => (
    <Modal
      visible={showImageViewer}
      transparent
      animationType="fade"
      onRequestClose={() => setShowImageViewer(false)}
    >
      <View style={styles.imageViewerOverlay}>
        <TouchableOpacity
          style={styles.imageViewerClose}
          onPress={() => setShowImageViewer(false)}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        
        {selectedImage && (
          <Image 
            source={{ uri: selectedImage }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <AppHeader 
          title="Loading Chat..." 
          navigation={navigation}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {isConnecting ? 'Connecting to chat...' : 'Setting up conversation...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <AppHeader 
          title="Chat Error" 
          navigation={navigation}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to start chat</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
            <Text style={styles.retryButtonText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render connection status indicator
   */
  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') return null;

    return (
      <View style={styles.connectionStatus}>
        <Text style={styles.connectionStatusText}>
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </Text>
        {connectionStatus === 'connecting' && (
          <ActivityIndicator size="small" color="#fff" style={styles.connectionIndicator} />
        )}
      </View>
    );
  };

  /**
   * Main render
   */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <AppHeader 
        title={conversationData ? 
          conversationService.getConversationTitle(
            context,
            conversationData.participant,
            conversationData.vehicle
          ) : 'Chat'
        }
        navigation={navigation}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      {renderConnectionStatus()}

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={getCurrentUser()}
        placeholder="Type a message..."
        alwaysShowSend
        renderActions={renderActions}
        renderSend={renderSend}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderMessageImage={renderMessageImage}
        renderMessageAudio={renderMessageAudio}
        isKeyboardInternallyHandled={false}
        bottomOffset={Platform.select({ ios: 34, android: 0 })}
        minInputToolbarHeight={60}
      />

      {/* Quick Replies Modal */}
      {renderQuickRepliesModal()}
      
      {/* Image Viewer Modal */}
      {renderImageViewer()}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording... Tap Actions to stop</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.lightGrey,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.lightGrey,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionStatus: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  connectionIndicator: {
    marginLeft: spacing.sm,
  },
  // Enhanced chat components
  actionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  inputToolbar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
    paddingVertical: spacing.xs,
  },
  // Quick Replies Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  quickRepliesModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  quickReplyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  quickReplyText: {
    fontSize: 16,
    color: colors.darkGrey,
    flex: 1,
  },
  // Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullScreenImage: {
    width: screenWidth,
    height: '80%',
  },
  // Recording Indicator
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: spacing.sm,
  },
     recordingText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
   },
   // Audio Message Styles
   audioMessage: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: spacing.md,
     backgroundColor: colors.offWhite,
     borderRadius: borderRadius.md,
     margin: spacing.sm,
   },
   audioText: {
     marginLeft: spacing.sm,
     fontSize: 16,
     color: colors.darkGrey,
     fontWeight: '500',
   },
 });

export default ChatConversationScreen;
