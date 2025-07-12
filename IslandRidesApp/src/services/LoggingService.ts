import { BaseService } from './base/BaseService';
import { environmentService } from './EnvironmentService';
import { logger, consoleTransport } from 'react-native-logs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

const defaultConfig = {
  severity: __DEV__ ? 'debug' : 'error' as LogLevel,
  transport: consoleTransport,
  transportOptions: {
    colors: {
      info: 'blueBright' as const,
      warn: 'yellowBright' as const,
      error: 'redBright' as const,
    },
  },
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
};

class LoggingService extends BaseService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly MAX_LOG_ENTRY_SIZE = 2048; // Approx 2KB
  private nativeLogger: any;

  constructor() {
    super();
    this.nativeLogger = logger.createLogger(defaultConfig);
  }

  private shouldLog(level: LogLevel): boolean {
    if (!__DEV__ && level === 'debug') return false;
    return true;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };
  }

  private store(entry: LogEntry): void {
    try {
      const entryString = JSON.stringify(entry);
      if (entryString.length > this.MAX_LOG_ENTRY_SIZE) {
        const dataPreview = JSON.stringify(entry.data).substring(0, 256);
        const truncatedEntry: LogEntry = {
          ...entry,
          message: `${entry.message.substring(0, 1024)}... (message truncated)`,
          data: `Log data truncated. Preview: ${dataPreview}...`,
        };
        this.logs.push(truncatedEntry);
      } else {
        this.logs.push(entry);
      }
    } catch (e) {
      const errorEntry: LogEntry = {
        ...entry,
        data: 'Log data could not be serialized.',
      };
      this.logs.push(errorEntry);
    }

    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }


  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.createLogEntry('debug', message, data);
      this.nativeLogger.debug(message, data);
      this.store(entry);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.createLogEntry('info', message, data);
      this.nativeLogger.info(message, data);
      this.store(entry);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.createLogEntry('warn', message, data);
      this.nativeLogger.warn(message, data);
      this.store(entry);
    }
  }

  error(message: string, error?: Error, data?: any): void {
    if (this.shouldLog('error')) {
      const entry = this.createLogEntry('error', message, { error, ...data });
      this.nativeLogger.error(message, error, data);
      this.store(entry);
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    return level 
      ? this.logs.filter(log => log.level === level)
      : [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Additional methods for react-native-logs compatibility
  setSeverity(severity: LogLevel): void {
    this.nativeLogger.setSeverity(severity);
  }

  enable(enabled: boolean): void {
    this.nativeLogger.enable(enabled);
  }
}

export const loggingService = LoggingService.getInstance();
