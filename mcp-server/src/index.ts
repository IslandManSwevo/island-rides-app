import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);
// Default workspace, but can be overridden by individual tool calls
let CURRENT_WORKSPACE = process.env.WORKSPACE_ROOT || process.cwd();

console.error(`MCP Server starting with default workspace: ${CURRENT_WORKSPACE}`);

// Create MCP server
const server = new McpServer({
  name: 'island-rides-mcp',
  version: '1.0.0',
});

// Enhanced security function that supports dynamic workspace

function sanitizePath(filePath: string, customWorkspace?: string): string {
  const workspace = customWorkspace || CURRENT_WORKSPACE;
  
  // If it's an absolute path, allow access to common development directories
  if (path.isAbsolute(filePath)) {
    const allowedRoots = [
      process.env.HOME || process.env.USERPROFILE || '',
      'C:\\Users',
      'C:\\Projects',
      'C:\\Dev',
      '/home',
      '/Users',
      process.cwd(),
      workspace
    ].filter(Boolean);
    
    const isAllowed = allowedRoots.some(root => filePath.startsWith(root));
    if (!isAllowed) {
      throw new Error(`Access denied: Path ${filePath} is outside allowed directories`);
    }
    return filePath;
  }
  
  // For relative paths, resolve against workspace
  const resolved = path.resolve(workspace, filePath);
  return resolved;
}

// Allowed commands for security
const ALLOWED_COMMANDS = [
  'ls', 'dir', 'pwd', 'cd', 'tree',
  'npm', 'yarn', 'node', 'npx', 'pnpm',
  'git', 'grep', 'find', 'cat', 'head', 'tail',
  'echo', 'mkdir', 'touch', 'cp', 'mv', 'rm',
  'python', 'pip', 'python3', 'pip3',
  'code', 'code.', 'nano', 'vim',
  'docker', 'kubectl',
  'jest', 'vitest', 'mocha', 'cypress'
];

function isCommandAllowed(command: string): boolean {
  const firstWord = command.trim().split(' ')[0];
  return ALLOWED_COMMANDS.includes(firstWord);
}

// Enhanced file reading tool with workspace detection
server.registerTool('read_file', {
  description: 'Read the contents of a file from any accessible location',
  inputSchema: {
    path: z.string().describe('File path to read (absolute or relative)'),
    workspace: z.string().optional().describe('Custom workspace directory (optional)'),
  },
}, async ({ path: filePath, workspace }) => {
  try {
    const sanitizedPath = sanitizePath(filePath, workspace);
    const content = await fs.readFile(sanitizedPath, 'utf-8');
    
    // Update current workspace if a new one was provided
    if (workspace) {
      CURRENT_WORKSPACE = workspace;
      console.error(`Workspace updated to: ${workspace}`);
    }
    
    return {
      content: [{
        type: 'text',
        text: content,
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error reading file: ${error.message}`,
      }],
      isError: true,
    };
  }
});



// Enhanced file writing tool
server.registerTool('write_file', {
  description: 'Write content to a file at any accessible location',
  inputSchema: {
    path: z.string().describe('File path to write (absolute or relative)'),
    content: z.string().describe('Content to write to the file'),
    workspace: z.string().optional().describe('Custom workspace directory (optional)'),
  },
}, async ({ path: filePath, content, workspace }) => {
  try {
    const sanitizedPath = sanitizePath(filePath, workspace);
    
    // Update workspace if provided
    if (workspace) {
      CURRENT_WORKSPACE = workspace;
      console.error(`Workspace updated to: ${workspace}`);
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(sanitizedPath), { recursive: true });
    
    await fs.writeFile(sanitizedPath, content, 'utf-8');
    return {
      content: [{
        type: 'text',
        text: `Successfully wrote to ${filePath}`,
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error writing file: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Enhanced directory listing tool
server.registerTool('list_directory', {
  description: 'List contents of any accessible directory',
  inputSchema: {
    path: z.string().optional().describe('Directory path to list (defaults to current workspace)'),
    workspace: z.string().optional().describe('Custom workspace directory (optional)'),
  },
}, async ({ path: dirPath, workspace }) => {
  try {
    const targetPath = dirPath || workspace || CURRENT_WORKSPACE;
    const sanitizedPath = sanitizePath(targetPath, workspace);
    
    // Update workspace if provided
    if (workspace) {
      CURRENT_WORKSPACE = workspace;
      console.error(`Workspace updated to: ${workspace}`);
    }
    
    const entries = await fs.readdir(sanitizedPath, { withFileTypes: true });
    
    const listing = entries.map(entry => {
      const type = entry.isDirectory() ? 'DIR' : entry.isFile() ? 'FILE' : 'OTHER';
      return `[${type}] ${entry.name}`;
    }).join('\n');
    
    return {
      content: [{
        type: 'text',
        text: listing || 'Directory is empty',
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error listing directory: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Enhanced command execution tool
server.registerTool('run_command', {
  description: 'Execute a shell command in specified directory',
  inputSchema: {
    command: z.string().describe('Command to execute'),
    workspace: z.string().optional().describe('Directory to run command in (optional)'),
  },
}, async ({ command, workspace }) => {
  try {
    if (!isCommandAllowed(command)) {
      return {
        content: [{
          type: 'text',
          text: `Command not allowed: ${command}. Allowed commands: ${ALLOWED_COMMANDS.join(', ')}`,
        }],
        isError: true,
      };
    }
    
    const workingDir = workspace || CURRENT_WORKSPACE;
    
    // Update workspace if provided
    if (workspace) {
      CURRENT_WORKSPACE = workspace;
      console.error(`Workspace updated to: ${workspace}`);
    }
    
    console.error(`Executing command: ${command} in ${workingDir}`);
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    
    const output = stdout || stderr || 'Command completed with no output';
    
    return {
      content: [{
        type: 'text',
        text: output,
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Command failed: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Enhanced create file tool
server.registerTool('create_file', {
  description: 'Create a new file or directory at any location',
  inputSchema: {
    path: z.string().describe('Path to create'),
    type: z.enum(['file', 'directory']).describe('Type to create'),
    content: z.string().optional().describe('Content for file (only if type is file)'),
    workspace: z.string().optional().describe('Custom workspace directory (optional)'),
  },
}, async ({ path: createPath, type, content = '', workspace }) => {
  try {
    const sanitizedPath = sanitizePath(createPath, workspace);
    
    // Update workspace if provided
    if (workspace) {
      CURRENT_WORKSPACE = workspace;
      console.error(`Workspace updated to: ${workspace}`);
    }
    
    if (type === 'directory') {
      await fs.mkdir(sanitizedPath, { recursive: true });
      return {
        content: [{
          type: 'text',
          text: `Directory created: ${createPath}`,
        }],
      };
    } else {
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(sanitizedPath), { recursive: true });
      await fs.writeFile(sanitizedPath, content, 'utf-8');
      return {
        content: [{
          type: 'text',
          text: `File created: ${createPath}`,
        }],
      };
    }
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error creating ${type}: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Enhanced file stats tool
server.registerTool('get_file_info', {
  description: 'Get information about a file or directory',
  inputSchema: {
    path: z.string().describe('Path to get info for'),
    workspace: z.string().optional().describe('Custom workspace directory (optional)'),
  },
}, async ({ path: filePath, workspace }) => {
  try {
    const sanitizedPath = sanitizePath(filePath, workspace);
    
    // Update workspace if provided
    if (workspace) {
      CURRENT_WORKSPACE = workspace;
      console.error(`Workspace updated to: ${workspace}`);
    }
    
    const stats = await fs.stat(sanitizedPath);
    
    const info = {
      path: filePath,
      absolutePath: sanitizedPath,
      type: stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other',
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(info, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error getting file info: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Workspace info tool
server.registerTool('get_workspace_info', {
  description: 'Get current workspace information',
  inputSchema: {},
}, async () => {
  return {
    content: [{
      type: 'text',
      text: `Current workspace: ${CURRENT_WORKSPACE}`,
    }],
  };
});

// Web search tool
server.registerTool('search_web', {
  description: 'Search the web using Brave Search API',
  inputSchema: {
    query: z.string().describe('Search query'),
    count: z.number().optional().describe('Number of results (default: 10)'),
    country: z.string().optional().describe('Country code (e.g., US, GB)'),
  },
}, async ({ query, count = 10, country = 'US' }) => {
  try {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      return {
        content: [{
          type: 'text',
          text: 'Brave API key not configured. Please set BRAVE_API_KEY environment variable.',
        }],
        isError: true,
      };
    }

    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.append('q', query);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('country', country);

    const response = await fetch(url.toString(), {
      headers: {
        'X-Subscription-Token': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    const formattedResults = results.map((result: any, index: number) => 
      `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   ${result.description}\n`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: formattedResults || 'No search results found.',
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Web search failed: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Git operations tool
server.registerTool('git_operation', {
  description: 'Perform Git operations (status, add, commit, push, etc.)',
  inputSchema: {
    operation: z.enum(['status', 'add', 'commit', 'push', 'pull', 'log', 'branch', 'diff']).describe('Git operation to perform'),
    args: z.string().optional().describe('Additional arguments for the git command'),
    message: z.string().optional().describe('Commit message (for commit operation)'),
    workspace: z.string().optional().describe('Directory to run git command in (optional)'),
  },
}, async ({ operation, args = '', message, workspace }) => {
  try {
    let gitCommand = `git ${operation}`;
    
    if (operation === 'commit' && message) {
      gitCommand = `git commit -m "${message}"`;
    } else if (args) {
      gitCommand = `git ${operation} ${args}`;
    }
    
    const workingDir = workspace || CURRENT_WORKSPACE;
    
    console.error(`Executing git command: ${gitCommand} in ${workingDir}`);
    const { stdout, stderr } = await execAsync(gitCommand, {
      cwd: workingDir,
      timeout: 30000,
    });
    
    const output = stdout || stderr || 'Git operation completed';
    
    return {
      content: [{
        type: 'text',
        text: output,
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Git operation failed: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Package management tool
server.registerTool('package_manager', {
  description: 'Manage packages (npm, yarn operations)',
  inputSchema: {
    manager: z.enum(['npm', 'yarn']).describe('Package manager to use'),
    operation: z.enum(['install', 'uninstall', 'update', 'list', 'info', 'init', 'run']).describe('Operation to perform'),
    packages: z.string().optional().describe('Package names (space-separated for multiple)'),
    flags: z.string().optional().describe('Additional flags (e.g., --save-dev, --global)'),
    workspace: z.string().optional().describe('Directory to run package command in (optional)'),
  },
}, async ({ manager, operation, packages = '', flags = '', workspace }) => {
  try {
    let command = `${manager} ${operation}`;
    
    if (packages) {
      command += ` ${packages}`;
    }
    
    if (flags) {
      command += ` ${flags}`;
    }
    
    const workingDir = workspace || CURRENT_WORKSPACE;
    
    console.error(`Executing package command: ${command} in ${workingDir}`);
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout: 120000, // 2 minutes for package operations
      maxBuffer: 1024 * 1024 * 5, // 5MB buffer
    });
    
    const output = stdout || stderr || 'Package operation completed';
    
    return {
      content: [{
        type: 'text',
        text: output,
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Package operation failed: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Test execution tool
server.registerTool('run_tests', {
  description: 'Run tests using various testing frameworks',
  inputSchema: {
    framework: z.enum(['jest', 'vitest', 'mocha', 'cypress', 'playwright']).optional().describe('Testing framework to use'),
    testPath: z.string().optional().describe('Specific test file or directory'),
    flags: z.string().optional().describe('Additional test flags (e.g., --watch, --coverage)'),
    workspace: z.string().optional().describe('Directory to run tests in (optional)'),
  },
}, async ({ framework, testPath = '', flags = '', workspace }) => {
  try {
    let command = '';
    
    if (framework) {
      switch (framework) {
        case 'jest':
          command = `npx jest ${testPath} ${flags}`;
          break;
        case 'vitest':
          command = `npx vitest run ${testPath} ${flags}`;
          break;
        case 'mocha':
          command = `npx mocha ${testPath} ${flags}`;
          break;
        case 'cypress':
          command = `npx cypress run ${flags}`;
          break;
        case 'playwright':
          command = `npx playwright test ${testPath} ${flags}`;
          break;
      }
    } else {
      // Auto-detect based on package.json scripts
      command = `npm test ${flags}`;
    }
    
    const workingDir = workspace || CURRENT_WORKSPACE;
    
    console.error(`Executing test command: ${command} in ${workingDir}`);
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout: 300000, // 5 minutes for tests
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    
    const output = stdout || stderr || 'Tests completed';
    
    return {
      content: [{
        type: 'text',
        text: output,
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Test execution failed: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Code analysis tool
server.registerTool('analyze_code', {
  description: 'Analyze code for complexity, dependencies, and structure',
  inputSchema: {
    filePath: z.string().describe('Path to file or directory to analyze'),
    analysisType: z.enum(['complexity', 'dependencies', 'structure', 'lint', 'security']).describe('Type of analysis to perform'),
    workspace: z.string().optional().describe('Directory to analyze from (optional)'),
  },
}, async ({ filePath, analysisType, workspace }) => {
  try {
    const sanitizedPath = sanitizePath(filePath, workspace);
    const workingDir = workspace || CURRENT_WORKSPACE;
    
    switch (analysisType) {
      case 'complexity': {
        // Simple complexity analysis
        const content = await fs.readFile(sanitizedPath, 'utf-8');
        const lines = content.split('\n').length;
        const functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|\w+\s*:\s*\(/g) || []).length;
        const classes = (content.match(/class\s+\w+/g) || []).length;
        const imports = (content.match(/import\s+.*from|require\s*\(/g) || []).length;
        
        return {
          content: [{
            type: 'text',
            text: `Code Analysis for ${filePath}:\n- Lines: ${lines}\n- Functions: ${functions}\n- Classes: ${classes}\n- Imports: ${imports}`,
          }],
        };
      }
      
      case 'dependencies': {
        if (path.basename(sanitizedPath) === 'package.json') {
          const content = await fs.readFile(sanitizedPath, 'utf-8');
          const pkg = JSON.parse(content);
          const deps = Object.keys(pkg.dependencies || {});
          const devDeps = Object.keys(pkg.devDependencies || {});
          
          return {
            content: [{
              type: 'text',
              text: `Dependencies:\n- Production: ${deps.join(', ')}\n- Development: ${devDeps.join(', ')}`,
            }],
          };
        }
        break;
      }
      
      case 'lint': {
        const { stdout, stderr } = await execAsync(`npx eslint ${filePath}`, {
          cwd: workingDir,
          timeout: 30000,
        }).catch(err => ({ stdout: '', stderr: err.message }));
        
        return {
          content: [{
            type: 'text',
            text: stdout || stderr || 'No linting issues found',
          }],
        };
      }
      
      default:
        return {
          content: [{
            type: 'text',
            text: `Analysis type "${analysisType}" not yet implemented for this file type.`,
          }],
        };
    }
    
    return {
      content: [{
        type: 'text',
        text: `Analysis completed for ${filePath}`,
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Code analysis failed: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  try {
    // Ensure default workspace directory exists
    await fs.mkdir(CURRENT_WORKSPACE, { recursive: true }).catch(() => {});
    
    console.error('Setting up MCP server...');
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('MCP Server started and ready to receive requests');
    console.error(`Default workspace: ${CURRENT_WORKSPACE}`);
    console.error(`Available tools: ${[
      'read_file', 'write_file', 'list_directory', 'run_command', 'create_file', 
      'get_file_info', 'get_workspace_info', 'search_web', 'git_operation', 
      'package_manager', 'run_tests', 'analyze_code'
    ].join(', ')}`);
    console.error('Note: Workspace can be changed dynamically via tool parameters');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();