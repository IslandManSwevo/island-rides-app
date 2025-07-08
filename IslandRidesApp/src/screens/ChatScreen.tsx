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
  const socketRef = useRef<Socket | null>(null);

  const currentUser: User = {
    _id: currentUserId,
    name: currentUserName,
  };

  const otherUser: User = {
    _id: otherUserId,
    name: otherUserName,
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = await apiService.getToken();
        if (!token) {
          Alert.alert('Authentication Error', 'Please log in again');
          return;
        }

        // Create socket connection with authentication
        socketRef.current = io('ws://localhost:3000', {
          auth: {
            token: token,
          },
          transports: ['websocket'],
        });

        const socket = socketRef.current;

        // Connection event handlers
        socket.on('connect', () => {
          console.log('Connected to chat server');
          setIsConnected(true);
          
          // Join the conversation room
          socket.emit('join:conversation', { conversationId });
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from chat server');
          setIsConnected(false);
        });

        socket.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
          Alert.alert('Connection Error', 'Failed to connect to chat server');
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
          Alert.alert('Chat Error', error.message);
        });

      } catch (error) {
        console.error('Socket initialization error:', error);
        Alert.alert('Error', 'Failed to initialize chat connection');
      }
    };

    initializeSocket();

    // Cleanup on component unmount
    return () => {
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
  }, [conversationId, currentUserId]);

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

  // Handle sending messages
  const onSend = useCallback((newMessages: IMessage[] = []) => {
    const messageToSend = newMessages[0];
    
    if (socketRef.current && isConnected) {
      // Emit message to server
      socketRef.current.emit('message:send', {
        conversationId,
        text: messageToSend.text,
        receiverId: otherUserId,
        tempId: messageToSend._id, // For optimistic updates
      });

      // Optimistically add message to UI
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessages)
      );
    } else {
      Alert.alert('Connection Error', 'Not connected to chat server');
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
    <Send {...props}>
      <View style={styles.sendButton}>
        <MaterialIcons name="send" size={24} color="#007AFF" />
      </View>
    </Send>
  );

  // Custom loading component
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading messages...</Text>
    </View>
  );

  // Connection status indicator
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionStatusText}>
            Connecting to chat...
          </Text>
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
  connectionStatus: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectionStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  messagesContainer: {
    backgroundColor: '#f5f5f5',
  },
  sendButton: {
    marginRight: 10,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  quickReply: {
    borderRadius: 15,
    backgroundColor: '#007AFF',
  },
});

export default ChatScreen;