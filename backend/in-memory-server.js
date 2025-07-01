const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let users = [
  {
    id: 1,
    email: 'john@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    first_name: 'John',
    last_name: 'Doe',
    role: 'customer'
  },
  {
    id: 2,
    email: 'jane@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'owner'
  }
];

let conversations = [];
let messages = [];
let nextUserId = 3;
let nextConversationId = 1;
let nextMessageId = 1;

function logError(context, error) {
  console.error(`${context}:`, error.message || 'Unknown error');
}

console.log('Using in-memory database for development');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'customer' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = {
      id: nextUserId++,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role
    };
    users.push(user);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    logError('Registration error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    logError('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const otherUsers = users
      .filter(u => u.id !== req.user.userId)
      .map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role
      }));
    res.json(otherUsers);
  } catch (error) {
    logError('Get users error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userConversations = conversations
      .filter(c => c.participant_1_id === req.user.userId || c.participant_2_id === req.user.userId)
      .map(c => {
        const participant1 = users.find(u => u.id === c.participant_1_id);
        const participant2 = users.find(u => u.id === c.participant_2_id);
        const lastMessage = messages
          .filter(m => m.conversation_id === c.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        return {
          id: c.id,
          participant_1_id: c.participant_1_id,
          participant_2_id: c.participant_2_id,
          created_at: c.created_at,
          participant_1_name: participant1?.first_name,
          participant_1_lastname: participant1?.last_name,
          participant_2_name: participant2?.first_name,
          participant_2_lastname: participant2?.last_name,
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at
        };
      })
      .sort((a, b) => {
        if (!a.last_message_time && !b.last_message_time) return 0;
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      });

    res.json(userConversations);
  } catch (error) {
    logError('Get conversations error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.userId;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    const existingConversation = conversations.find(c =>
      (c.participant_1_id === userId && c.participant_2_id === participantId) ||
      (c.participant_1_id === participantId && c.participant_2_id === userId)
    );

    if (existingConversation) {
      return res.json({ conversationId: existingConversation.id });
    }

    const conversation = {
      id: nextConversationId++,
      participant_1_id: userId,
      participant_2_id: participantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    conversations.push(conversation);

    res.status(201).json({ conversationId: conversation.id });
  } catch (error) {
    logError('Create conversation error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const conversation = conversations.find(c =>
      c.id === parseInt(conversationId) &&
      (c.participant_1_id === req.user.userId || c.participant_2_id === req.user.userId)
    );

    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const conversationMessages = messages
      .filter(m => m.conversation_id === parseInt(conversationId))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(offset, offset + parseInt(limit))
      .map(m => {
        const sender = users.find(u => u.id === m.sender_id);
        return {
          id: m.id,
          content: m.content,
          message_type: m.message_type,
          created_at: m.created_at,
          sender_id: m.sender_id,
          first_name: sender?.first_name,
          last_name: sender?.last_name
        };
      });

    res.json(conversationMessages);
  } catch (error) {
    logError('Get messages error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, users, conversations, messages };
