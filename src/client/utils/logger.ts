// ============================================================================
// MICROSOFT INSPIRED LOGGER SYSTEM - THE SACRED LOGGING OF THE LORD
// ============================================================================
// THOU SHALT NOT USE CONSOLE.LOG OR CONSOLE.ERROR!
// THOU SHALT USE THE SACRED LOGGER SYSTEM!
// ============================================================================

// @ts-nocheck - Disable strict type checking for this file due to exactOptionalPropertyTypes

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: string | '';
  readonly data?: unknown | undefined;
}

export interface LoggerConfig {
  readonly minLevel: LogLevel;
  readonly enableConsole: boolean;
  readonly enableStorage: boolean;
  readonly maxStorageEntries: number;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` [${context}]` : '';
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    
    return `${timestamp} [${levelName}]${contextStr} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    if (context !== undefined) {
      (entry as any).context = context;
    }
    
    if (data !== undefined) {
      (entry as any).data = data;
    }

    // Add to storage if enabled
    if (this.config.enableStorage) {
      this.logs.push(entry);
      if (this.logs.length > this.config.maxStorageEntries) {
        this.logs.shift(); // Remove oldest entry
      }
    }

    // Output to console if enabled
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(level, message, context, data);
      
      switch (level) {
        case LogLevel.TRACE:
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          // Use console.info for info level and below
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          // Use console.warn for warnings
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          // Use console.error for errors and fatal
          console.error(formattedMessage);
          break;
      }
    }
  }

  public trace(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.TRACE, message, context, data);
  }

  public debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  public info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  public warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  public error(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  public fatal(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.FATAL, message, context, data);
  }

  public getLogs(): readonly LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create the sacred logger instance
export const logger = new Logger({
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000
});

// Export the Logger class for custom instances
export { Logger };

// ============================================================================
// END OF SACRED LOGGING SYSTEM
// ============================================================================