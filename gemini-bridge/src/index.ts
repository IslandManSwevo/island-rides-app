import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Type definitions for MCP responses
interface MCPToolResponse {
  content?: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

const app = express();
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// MCP Client instance
let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

// Initialize MCP client
async function initializeMCP() {
  try {
    const serverPath = process.env.MCP_SERVER_PATH || path.join(__dirname, '../mcp-server/dist/index.js');
    console.log('Starting MCP server at:', serverPath);
    
    mcpTransport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        ...process.env,
        WORKSPACE_ROOT: process.env.WORKSPACE_ROOT || process.cwd(),
      },
    });

    mcpClient = new Client({
      name: 'gemini-bridge',
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    await mcpClient.connect(mcpTransport);
    console.log('MCP client connected successfully');
    
    // List available tools
    const tools = await mcpClient.listTools();
    console.log('Available MCP tools:', tools.tools.map(t => t.name));
  } catch (error) {
    console.error('Failed to initialize MCP client:', error);
    throw error;
  }
}

// Convert MCP tools to Gemini function declarations
async function getMCPToolsAsGeminiFunctions() {
  if (!mcpClient) throw new Error('MCP client not initialized');
  
  const { tools } = await mcpClient.listTools();
  
  return tools.map(tool => {
    // Convert Zod schema to clean JSON schema for Gemini
    const cleanParameters = convertZodToJsonSchema(tool.inputSchema);
    
    return {
      name: tool.name,
      description: tool.description,
      parameters: cleanParameters,
    };
  });
}

// Helper function to convert Zod schemas to clean JSON schemas
function convertZodToJsonSchema(zodSchema: any): any {
  if (!zodSchema || typeof zodSchema !== 'object') {
    return {
      type: 'object',
      properties: {},
    };
  }

  // If it's already a clean JSON schema structure, use it
  if (zodSchema.type && zodSchema.properties) {
    return {
      type: zodSchema.type,
      properties: zodSchema.properties,
      required: zodSchema.required || [],
    };
  }

  // Convert Zod schema object to JSON schema
  const properties: any = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(zodSchema)) {
    if (value && typeof value === 'object' && '_def' in value) {
      // This is a Zod schema object
      const zodDef = (value as any)._def;
      
      if (zodDef.typeName === 'ZodString') {
        properties[key] = {
          type: 'string',
          description: zodDef.description || `${key} parameter`,
        };
        if (!zodDef.isOptional) required.push(key);
      } else if (zodDef.typeName === 'ZodNumber') {
        properties[key] = {
          type: 'number',
          description: zodDef.description || `${key} parameter`,
        };
        if (!zodDef.isOptional) required.push(key);
      } else if (zodDef.typeName === 'ZodEnum') {
        properties[key] = {
          type: 'string',
          enum: zodDef.values,
          description: zodDef.description || `${key} parameter`,
        };
        if (!zodDef.isOptional) required.push(key);
      } else if (zodDef.typeName === 'ZodOptional') {
        // Handle optional fields
        const innerDef = zodDef.innerType._def;
        if (innerDef.typeName === 'ZodString') {
          properties[key] = {
            type: 'string',
            description: innerDef.description || `${key} parameter (optional)`,
          };
        } else if (innerDef.typeName === 'ZodNumber') {
          properties[key] = {
            type: 'number',
            description: innerDef.description || `${key} parameter (optional)`,
          };
        }
        // Optional fields are not added to required array
      } else {
        // Fallback for unknown Zod types
        properties[key] = {
          type: 'string',
          description: `${key} parameter`,
        };
        if (!zodDef.isOptional) required.push(key);
      }
    } else {
      // Fallback for non-Zod values
      properties[key] = {
        type: 'string',
        description: `${key} parameter`,
      };
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

// Execute MCP tool - CENTRALIZED FUNCTION
async function executeMCPTool(name: string, args: any): Promise<string> {
  if (!mcpClient) throw new Error('MCP client not initialized');
  
  try {
    console.log(`Executing tool: ${name} with args:`, args);
    
    // THIS IS THE CORRECT FORMAT FOR THE NEW MCP SDK
    const result = await mcpClient.callTool({
      name: name,
      arguments: args || {},
    }) as MCPToolResponse;
    
    // Handle response with proper type checking
    if (result?.content && Array.isArray(result.content) && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent?.type === 'text' && firstContent.text) {
        return firstContent.text;
      }
    }
    
    // Fallback to JSON stringification
    return JSON.stringify(result, null, 2);
  } catch (error: any) {
    console.error(`Error executing tool ${name}:`, error);
    return `Error: ${error.message}`;
  }
}

// API endpoint for Gemini with MCP tools - UPDATED FOR 2.5 PRO
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, context = {} } = req.body;
    
    if (!mcpClient) {
      return res.status(500).json({ error: 'MCP client not initialized' });
    }
    
    console.log('Received prompt:', prompt);
    
    // Get available tools
    const mcpTools = await getMCPToolsAsGeminiFunctions();
    console.log('Available tools:', mcpTools.map(t => t.name));
    
    // Create Gemini 2.5 Pro model with tools
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',  // ← UPDATED FOR 2.5 PRO
      tools: mcpTools.length > 0 ? [{ functionDeclarations: mcpTools }] : undefined,
      generationConfig: {
        temperature: 0.1,  // Lower temperature for consistent tool usage
        candidateCount: 1,
      },
    });
    
    // Create chat with context
    const chat = model.startChat({
      history: context.history || [],
    });
    
    // Send message
    let result = await chat.sendMessage(prompt);
    let response = result.response;
    
    // Handle function calls
    let attempts = 0;
    const maxAttempts = 5;
    
    while (response.functionCalls() && response.functionCalls()!.length > 0 && attempts < maxAttempts) {
      attempts++;
      const calls = response.functionCalls()!;
      console.log(`Attempt ${attempts}: Gemini 2.5 Pro requested tools:`, calls.map(c => c.name));
      
      // Execute all function calls using our centralized function
      const functionResponses = await Promise.all(
        calls.map(async (call) => {
          try {
            const toolResult = await executeMCPTool(call.name, call.args);
            return {
              name: call.name,
              response: toolResult,
            };
          } catch (error: any) {
            console.error(`Error in tool ${call.name}:`, error);
            return {
              name: call.name,
              response: `Error: ${error.message}`,
            };
          }
        })
      );
      
      console.log('Tool responses:', functionResponses);
      
      // Send function responses back to Gemini 2.5 Pro
      result = await chat.sendMessage(
        functionResponses.map(fr => ({
          functionResponse: {
            name: fr.name,
            response: { result: fr.response },
          },
        }))
      );
      response = result.response;
    }
    
    // Return final response
    const finalText = response.text();
    console.log('Final response:', finalText);
    
    res.json({
      response: finalText,
      history: await chat.getHistory(),
      toolsUsed: attempts > 0,
      attempts,
      model: 'gemini-2.5-pro',  // Include model info in response
    });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API endpoint to list available tools
app.get('/api/tools', async (req, res) => {
  try {
    if (!mcpClient) {
      return res.status(500).json({ error: 'MCP client not initialized' });
    }
    
    const tools = await mcpClient.listTools();
    res.json(tools);
  } catch (error: any) {
    console.error('Error listing tools:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to execute a specific tool - USES CENTRALIZED FUNCTION
app.post('/api/tools/:toolName', async (req, res) => {
  try {
    if (!mcpClient) {
      return res.status(500).json({ error: 'MCP client not initialized' });
    }
    
    const { toolName } = req.params;
    const args = req.body;
    
    // USE THE CENTRALIZED FUNCTION - NO DIRECT callTool CALLS
    const result = await executeMCPTool(toolName, args);
    res.json({ result });
  } catch (error: any) {
    console.error('Error executing tool:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mcpConnected: !!mcpClient,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    workspaceRoot: process.env.WORKSPACE_ROOT,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    console.log('Starting Gemini-MCP Bridge...');
    await initializeMCP();
    
    app.listen(PORT, () => {
      console.log(`🚀 Gemini-MCP Bridge server running on http://localhost:${PORT}`);
      console.log('Endpoints:');
      console.log('  POST /api/chat - Chat with Gemini using MCP tools');
      console.log('  GET /api/tools - List available MCP tools');
      console.log('  POST /api/tools/:toolName - Execute specific tool');
      console.log('  GET /health - Health check');
      console.log('');
      console.log('Environment:');
      console.log('  WORKSPACE_ROOT:', process.env.WORKSPACE_ROOT);
      console.log('  MCP_SERVER_PATH:', process.env.MCP_SERVER_PATH);
      console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Missing');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (mcpClient) {
    try {
      await mcpClient.close();
      console.log('MCP client closed');
    } catch (error) {
      console.error('Error closing MCP client:', error);
    }
  }
  process.exit(0);
});

start();