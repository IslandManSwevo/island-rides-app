import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { GiftedChat, IMessage, User, Send } from 'react-native-gifted-chat';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';
import { getEnvironmentConfig } from '../config/environment';
import { notificationService } from '../services/notificationService';
import { colors } from '../styles/theme';

interface ChatScreenProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  currentUserName: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  otherUserId,
  otherUserName,
  currentUserId,
  currentUserName,
}) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mounted = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelayBase = 1000; // Start with 1 second, exponential backoff

  const currentUser: User = {
    _id: currentUserId,
    name: currentUserName,
  };

  const otherUser: User = {
    _id: otherUserId,
    name: otherUserName,
  };

  // Clear reconnection timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Reconnection mechanism
  const attemptReconnection = useCallback(async () => {
    if (!mounted.current || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        notificationService.error('Unable to reconnect to chat. Please refresh the page.', {
          duration: 0, // Persistent notification
          closable: true
        });
      }
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    reconnectAttemptsRef.current += 1;

    const delay = reconnectDelayBase * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff
    console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(async () => {
      if (!mounted.current) return;
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        await initializeSocket();
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        if (mounted.current) {
          attemptReconnection(); // Try again
        }
      }
    }, delay);
  }, []);

  // Initialize WebSocket connection
  const initializeSocket = useCallback(async () => {
    try {
      const token = await apiService.getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again');
        return;
      }

      // Get WebSocket URL from environment configuration
      const envConfig = await getEnvironmentConfig();
      const wsUrl = envConfig.WS_URL;

      console.log('Connecting to WebSocket server:', wsUrl);

      // Create socket connection with authentication
      socketRef.current = io(wsUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true, // Force new connection for reconnections
      });

      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0; // Reset reconnection attempts on successful connection
        clearReconnectTimeout();
        
        // Join the conversation room
        socket.emit('join:conversation', { conversationId });
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from chat server:', reason);
        setIsConnected(false);
        
        // Only attempt reconnection for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
          console.log('Attempting to reconnect due to:', reason);
          attemptReconnection();
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        
        // Attempt reconnection on connection errors
        if (reconnectAttemptsRef.current === 0) {
          // Only show alert on first connection error, not during reconnection attempts
          console.log('Initial connection failed, attempting to reconnect...');
        }
        attemptReconnection();
      });

      // Message event handlers
      socket.on('message:received', (messageData: ChatMessage) => {
        const newMessage: IMessage = {
          _id: messageData._id,
          text: messageData.text,
          createdAt: new Date(messageData.createdAt),
          user: messageData.user,
        };

        setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, [newMessage])
        );
      });

      // Typing indicators
      socket.on('typing:start', (data: { userId: string; userName: string }) => {
        if (data.userId !== currentUserId) {
          setIsTyping(true);
        }
      });

      socket.on('typing:stop', (data: { userId: string }) => {
        if (data.userId !== currentUserId) {
          setIsTyping(false);
        }
      });

      // Error handling
      socket.on('error', (error: { message: string }) => {
        console.error('Chat error:', error);
        notificationService.error(`Chat Error: ${error.message}`, {
          duration: 5000
        });
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
      Alert.alert('Error', 'Failed to initialize chat connection');
      attemptReconnection();
    }
  }, [conversationId, currentUserId, attemptReconnection, clearReconnectTimeout]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    initializeSocket();

    // Cleanup on component unmount
    return () => {
      clearReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('message:received');
        socketRef.current.off('typing:start');
        socketRef.current.off('typing:stop');
        socketRef.current.off('error');
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket, clearReconnectTimeout]);

  // Load conversation history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.get<{ messages: ChatMessage[] }>(
          `/conversations/${conversationId}/messages`
        );

        // Transform backend messages to GiftedChat format
        const formattedMessages: IMessage[] = response.messages.map((msg: ChatMessage) => ({
          _id: msg._id,
          text: msg.text,
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.user._id,
            name: msg.user.name,
          },
        }));

        // GiftedChat expects messages in reverse chronological order
        setMessages(formattedMessages.reverse());
      } catch (error) {
        console.error('Failed to load messages:', error);
        Alert.alert('Error', 'Failed to load conversation history');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, currentUserId, currentUserName, otherUserName]);

  // Handle sending messages with acknowledgment and error handling
  const onSend = useCallback((newMessages: IMessage[] = []) => {
    const messageToSend = newMessages[0];
    
    if (socketRef.current && isConnected) {
      // Optimistically add message to UI first
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessages)
      );

      // Emit message to server with acknowledgment callback
      socketRef.current.emit('message:send', {
        conversationId,
        text: messageToSend.text,
        receiverId: otherUserId,
        tempId: messageToSend._id, // For optimistic updates
      }, (acknowledgment: { success: boolean; error?: string; messageId?: string }) => {
        if (!acknowledgment.success) {
          // Remove the optimistically added message on failure
          setMessages((previousMessages) => 
            previousMessages.filter(msg => msg._id !== messageToSend._id)
          );
          
          // Show error notification
          const errorMessage = acknowledgment.error || 'Failed to send message';
          notificationService.error(errorMessage, {
            duration: 5000,
            action: {
              label: 'Retry',
              handler: () => onSend(newMessages) // Retry sending the message
            }
          });
          
          console.error('Message send failed:', acknowledgment.error);
        } else {
          // Optionally update the message with the server-generated ID
          if (acknowledgment.messageId) {
            setMessages((previousMessages) => 
              previousMessages.map(msg => 
                msg._id === messageToSend._id 
                  ? { ...msg, _id: acknowledgment.messageId! }
                  : msg
              )
            );
          }
          console.log('Message sent successfully');
        }
      });
    } else {
      notificationService.warning('Not connected to chat server. Please wait for connection.', {
        duration: 3000
      });
    }
  }, [conversationId, otherUserId, isConnected]);

  // Handle typing indicators
  const handleInputTextChanged = useCallback((text: string) => {
    if (socketRef.current && isConnected) {
      if (text.length > 0) {
        socketRef.current.emit('typing:start', { conversationId });
      } else {
        socketRef.current.emit('typing:stop', { conversationId });
      }
    }
  }, [conversationId, isConnected]);

  // Custom send button
  const renderSend = (props: any) => (
    <Send {...props} disabled={!isConnected}>
      <View style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]}>
        <MaterialIcons 
          name="send" 
          size={24} 
          color={isConnected ? colors.primary : colors.lightGrey} 
        />
      </View>
    </Send>
  );

  // Custom loading component
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading messages...</Text>
    </View>
  );

  // Connection status indicator
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <View style={[
          styles.connectionStatus, 
          isReconnecting ? styles.reconnectingStatus : styles.disconnectedStatus
        ]}>
          <Text style={styles.connectionStatusText}>
            {isReconnecting 
              ? `Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
              : 'Disconnected from chat'
            }
          </Text>
          {isReconnecting && (
            <ActivityIndicator size="small" color="white" style={styles.statusIndicator} />
          )}
        </View>
      );
    }
    return null;
  };

  if (isLoading) {
    return renderLoading();
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderConnectionStatus()}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          onInputTextChanged={handleInputTextChanged}
          user={currentUser}
          renderSend={renderSend}
          placeholder="Type a message..."
          showUserAvatar={false}
          isTyping={isTyping}
          messagesContainerStyle={styles.messagesContainer}
          quickReplyStyle={styles.quickReply}
          renderUsernameOnMessage={false}
          dateFormat="MMM DD, YYYY"
          timeFormat="HH:mm"
          showAvatarForEveryMessage={false}
          renderAvatarOnTop={false}
          maxComposerHeight={100}
          minComposerHeight={40}
          bottomOffset={Platform.OS === 'ios' ? 34 : 0}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sectionBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.sectionBackground,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.grey,
  },
  connectionStatus: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disconnectedStatus: {
    backgroundColor: colors.error,
  },
  reconnectingStatus: {
    backgroundColor: colors.warning,
  },
  connectionStatusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    marginLeft: 8,
  },
  messagesContainer: {
    backgroundColor: colors.sectionBackground,
  },
  sendButton: {
    marginRight: 10,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  quickReply: {
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
});

export default ChatScreen;