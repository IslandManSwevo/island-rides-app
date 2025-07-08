const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
require('dotenv').config();

const { server } = require('./server');
const db = require('./db');

function logError(context, error) {
  console.error(`${context}:`, error.message || 'Unknown error');
}

const activeConnections = new Map();

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const token = url.parse(req.url, true).query.token;
  if (!token) {
    ws.close(1008, 'No token provided');
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      ws.close(1008, 'Invalid token');
      return;
    }

    const user = decoded;
    console.log(`User ${user.userId} (${user.email}) connected to WebSocket`);
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

    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, user.userId]
    );

    if (conversationResult.rows.length === 0) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Access denied to this conversation'
      }));
      return;
    }
    const conversation = conversationResult.rows[0];

    const insertMessageQuery = `
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, conversation_id, sender_id, content, message_type, created_at
    `;
    const savedMessageResult = await db.query(insertMessageQuery, [conversationId, user.userId, content, messageType]);
    const savedMessage = savedMessageResult.rows[0];

    const senderResult = await db.query('SELECT first_name, last_name FROM users WHERE id = $1', [user.userId]);
    const sender = senderResult.rows[0];

    const broadcastMessage = {
      type: 'new_message',
      id: savedMessage.id,
      conversationId: parseInt(conversationId),
      senderId: user.userId,
      senderName: `${sender?.first_name || 'Unknown'} ${sender?.last_name || 'User'}`,
      content: savedMessage.content,
      messageType: savedMessage.message_type,
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

    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, user.userId]
    );

    if (conversationResult.rows.length === 0) {
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

    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)',
      [conversationId, user.userId]
    );

    if (conversationResult.rows.length === 0) {
      return;
    }
    const conversation = conversationResult.rows[0];

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

console.log(`WebSocket server running on port ${process.env.WEBSOCKET_PORT || 3004}`);

module.exports = wss;
