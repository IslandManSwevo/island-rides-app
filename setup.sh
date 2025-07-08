#!/bin/bash

# Island Rides Gemini + MCP Quick Setup Script
# This script sets up everything you need to get started

set -e

echo "🏝️ Island Rides Development Environment Setup"
echo "============================================"

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Get Gemini API key
read -p "Enter your Gemini API key: " GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Gemini API key is required"
    exit 1
fi

# Create root directory
PROJECT_ROOT="island-rides-dev"
echo "📁 Creating project structure in ./$PROJECT_ROOT"
mkdir -p $PROJECT_ROOT
cd $PROJECT_ROOT

# Get absolute path
ABSOLUTE_ROOT=$(pwd)

# Create workspace for the actual app
echo "📁 Creating Island Rides app workspace..."
mkdir -p island-rides-app
WORKSPACE_ROOT="$ABSOLUTE_ROOT/island-rides-app"

# Setup MCP Server
echo "🔧 Setting up MCP Server..."
mkdir -p mcp-server/src

cat > mcp-server/package.json << 'EOF'
{
  "name": "island-rides-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "@babel/parser": "latest",
    "@babel/traverse": "latest",
    "dotenv": "latest"
  },
  "devDependencies": {
    "typescript": "latest",
    "@types/node": "latest",
    "tsx": "latest"
  }
}
EOF

cat > mcp-server/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

# Copy MCP server code (simplified version)
cat > mcp-server/src/index.ts << 'EOF'
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();

const server = new Server(
  { name: 'island-rides-mcp', version: '1.0.0' },
  { capabilities: { resources: {}, tools: {} } }
);

function sanitizePath(filePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, filePath);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new McpError(ErrorCode.InvalidParams, 'Path traversal detected');
  }
  return resolved;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'read_file',
      description: 'Read file contents',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write to file',
      inputSchema: {
        type: 'object',
        properties: { 
          path: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'list_directory',
      description: 'List directory contents',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
      },
    },
    {
      name: 'run_command',
      description: 'Run shell command',
      inputSchema: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'read_file': {
      const content = await fs.readFile(sanitizePath(args.path), 'utf-8');
      return { content: [{ type: 'text', text: content }] };
    }
    case 'write_file': {
      const filePath = sanitizePath(args.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, args.content, 'utf-8');
      return { content: [{ type: 'text', text: 'File written successfully' }] };
    }
    case 'list_directory': {
      const entries = await fs.readdir(sanitizePath(args.path || '.'), { withFileTypes: true });
      const listing = entries.map(e => `[${e.isDirectory() ? 'DIR' : 'FILE'}] ${e.name}`).join('\n');
      return { content: [{ type: 'text', text: listing }] };
    }
    case 'run_command': {
      const { stdout, stderr } = await execAsync(args.command, { cwd: WORKSPACE_ROOT });
      return { content: [{ type: 'text', text: stderr || stdout }] };
    }
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

async function main() {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server started');
}

main().catch(console.error);
EOF

# Setup Gemini Bridge
echo "🌉 Setting up Gemini Bridge..."
mkdir -p gemini-bridge/src

cat > gemini-bridge/package.json << 'EOF'
{
  "name": "gemini-mcp-bridge",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "latest",
    "@google/generative-ai": "latest",
    "@modelcontextprotocol/sdk": "latest",
    "dotenv": "latest"
  },
  "devDependencies": {
    "typescript": "latest",
    "@types/node": "latest",
    "@types/express": "latest",
    "tsx": "latest"
  }
}
EOF

cat > gemini-bridge/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

# Create .env file
cat > gemini-bridge/.env << EOF
GEMINI_API_KEY=$GEMINI_API_KEY
WORKSPACE_ROOT=$WORKSPACE_ROOT
MCP_SERVER_PATH=../mcp-server/dist/index.js
PORT=3001
EOF

# Copy bridge code (simplified)
cat > gemini-bridge/src/index.ts << 'EOF'
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
let mcpClient: Client | null = null;

async function initializeMCP() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.resolve(process.env.MCP_SERVER_PATH!)],
    env: { ...process.env },
  });

  mcpClient = new Client(
    { name: 'gemini-bridge', version: '1.0.0' },
    { capabilities: {} }
  );

  await mcpClient.connect(transport);
  console.log('MCP connected');
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!mcpClient) throw new Error('MCP not initialized');
    
    const { prompt } = req.body;
    const { tools } = await mcpClient.listTools();
    
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      tools: [{
        functionDeclarations: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        }))
      }],
    });
    
    const chat = model.startChat();
    let result = await chat.sendMessage(prompt);
    let response = result.response;
    
    while (response.functionCalls()?.length) {
      const calls = response.functionCalls()!;
      const responses = await Promise.all(
        calls.map(async call => ({
          name: call.name,
          response: (await mcpClient!.callTool(call.name, call.args)).content[0].text,
        }))
      );
      
      result = await chat.sendMessage(
        responses.map(r => ({
          functionResponse: { name: r.name, response: { result: r.response } }
        }))
      );
      response = result.response;
    }
    
    res.json({ response: response.text() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mcp: !!mcpClient });
});

initializeMCP().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Bridge running on http://localhost:${process.env.PORT}`);
  });
}).catch(console.error);
EOF

# Install dependencies
echo "📦 Installing MCP Server dependencies..."
cd mcp-server
npm install
echo "🔨 Building MCP Server..."
npm run build
cd ..

echo "📦 Installing Gemini Bridge dependencies..."
cd gemini-bridge
npm install
cd ..

# Create sample Island Rides app
echo "🏝️ Creating sample Island Rides app..."
cd island-rides-app

cat > package.json << 'EOF'
{
  "name": "island-rides-app",
  "version": "1.0.0",
  "description": "Island Rides Transportation App"
}
EOF

cat > README.md << 'EOF'
# Island Rides App

This is your Island Rides application workspace.

## Getting Started

1. The Gemini Bridge is running at http://localhost:3001
2. Use the API to interact with your codebase
3. Create your Tamagui components here

## Example Commands

```bash
# Ask Gemini to create a component
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a Tamagui GlassButton component"}'

# List files
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "List all files in the current directory"}'
```
EOF

mkdir -p src/components

cd ../..

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Island Rides Development Environment"
echo "=============================================="
echo ""
echo "Starting Gemini-MCP Bridge..."
cd island-rides-dev/gemini-bridge
npm run dev
EOF

chmod +x start.sh

# Create test script
cat > test-setup.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Island Rides Setup"
echo "============================"
echo ""

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:3001/health | jq .

echo ""
echo "Testing chat endpoint..."
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "List all files in the current directory"}' | jq .

echo ""
echo "✅ Setup test complete!"
EOF

chmod +x test-setup.sh

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📁 Project structure created in: $ABSOLUTE_ROOT"
echo ""
echo "🚀 To start the development environment:"
echo "   ./start.sh"
echo ""
echo "🧪 To test the setup (in another terminal):"
echo "   ./test-setup.sh"
echo ""
echo "🎉 Happy coding!"