declare module '@modelcontextprotocol/sdk' {
  export class StdioClientTransport {
    constructor(path: string);
  }
  export class McpClient {
    constructor(transport: any);
    connect(): Promise<void>;
    isConnected(): boolean;
    listTools(): Promise<{ tools: any[] }>;
    callTool(name: string, args: any): Promise<any>;
  }
}