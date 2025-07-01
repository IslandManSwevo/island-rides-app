const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
require('dotenv').config();

const serverModule = require('./server');
let users, conversations, messages;

const initializeDatabase = () => {
  users = require('./server').users || [];
  conversations = require('./server').conversations || [];
  messages = require('./server').messages || [];
};

let nextMessageId = 1;

function logError(context, error) {
  console.error(`${context}:`, error.message || 'Unknown error');
}

const activeConnections = new Map();

const wss = new WebSocket.Server({
  port: process.env.WEBSOCKET_PORT || 3001,
  verifyClient: (info) => {
    try {
      const query = url.parse(info.req.url, true).query;
      const token = query.token;

      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token', error.message);
      return false;
    }
  }
});

wss.on('connection', (ws, req) => {
  const user = req.user;
  console.log(`User ${user.userId} (${user.email}) connected to WebSocket`);

  if (!users || users.length === 0) {
    initializeDatabase();
  }

  activeConnections.set(user.userId, ws);

  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to messaging server',
    userId: user.userId
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'send_message':
          await handleSendMessage(ws, user, message);
          break;
        case 'join_conversation':
          await handleJoinConversation(ws, user, message);
          break;
        case 'typing':
          await handleTyping(ws, user, message);
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      logError('Error processing message', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`User ${user.userId} disconnected from WebSocket`);
    activeConnections.delete(user.userId);
  });

  ws.on('error', (error) => {
    logError('WebSocket error', error);
    activeConnections.delete(user.userId);
  });
});

async function handleSendMessage(ws, user, message) {
  try {
    const { conversationId, content, messageType = 'text' } = message;

    if (!conversationId || !content) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Conversation ID and content are required'
      }));
      return;
    }

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === user.userId || c.participant_2_id === user.userId)
    );

    if (!conversation) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Access denied to this conversation'
      }));
      return;
    }

    const savedMessage = {
      id: nextMessageId++,
      conversation_id: parseInt(conversationId),
      sender_id: user.userId,
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    messages.push(savedMessage);

    const sender = users.find(u => u.id === user.userId);

    const broadcastMessage = {
      type: 'new_message',
      id: savedMessage.id,
      conversationId: parseInt(conversationId),
      senderId: user.userId,
      senderName: `${sender?.first_name || 'Unknown'} ${sender?.last_name || 'User'}`,
      content,
      messageType,
      timestamp: savedMessage.created_at
    };

    ws.send(JSON.stringify({
      ...broadcastMessage,
      type: 'message_sent'
    }));

    const otherParticipantId = conversation.participant_1_id === user.userId 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const otherConnection = activeConnections.get(otherParticipantId);
    if (otherConnection && otherConnection.readyState === WebSocket.OPEN) {
      otherConnection.send(JSON.stringify(broadcastMessage));
    }

    console.log(`Message sent in conversation ${conversationId} from user ${user.userId}`);

  } catch (error) {
    logError('Error handling send message', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message'
    }));
  }
}

async function handleJoinConversation(ws, user, message) {
  try {
    const { conversationId } = message;

    if (!conversationId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Conversation ID is required'
      }));
      return;
    }

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === user.userId || c.participant_2_id === user.userId)
    );

    if (!conversation) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Access denied to this conversation'
      }));
      return;
    }

    ws.send(JSON.stringify({
      type: 'conversation_joined',
      conversationId: parseInt(conversationId),
      message: 'Successfully joined conversation'
    }));

  } catch (error) {
    logError('Error handling join conversation', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to join conversation'
    }));
  }
}

async function handleTyping(ws, user, message) {
  try {
    const { conversationId, isTyping } = message;

    if (!conversationId) {
      return;
    }

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === user.userId || c.participant_2_id === user.userId)
    );

    if (!conversation) {
      return;
    }

    const otherParticipantId = conversation.participant_1_id === user.userId 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    const otherConnection = activeConnections.get(otherParticipantId);
    if (otherConnection && otherConnection.readyState === WebSocket.OPEN) {
      otherConnection.send(JSON.stringify({
        type: 'typing_indicator',
        conversationId: parseInt(conversationId),
        userId: user.userId,
        isTyping
      }));
    }

  } catch (error) {
    logError('Error handling typing indicator', error);
  }
}

console.log(`WebSocket server running on port ${process.env.WEBSOCKET_PORT || 3001}`);

module.exports = wss;
