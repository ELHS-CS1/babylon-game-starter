// ============================================================================
// MICROSOFT INSPIRED LOGGER SYSTEM - THE SACRED LOGGING OF THE LORD
// ============================================================================
// THOU SHALT NOT USE CONSOLE.LOG OR CONSOLE.ERROR!
// THOU SHALT USE THE SACRED LOGGER SYSTEM!
// 
// USAGE EXAMPLES:
// 
// // Create a logger with scope checking:
// const logger = new Logger();
// 
// // This will be logged based on URL parameters and tag:
// logger.info("HUD updated", { context: "GameHUD", tag: "hud" });
// 
// // This will be logged based on URL parameters and tag:
// logger.info("Checking collisions", { context: "CollectiblesManager", tag: "collision" });
// 
// // This will be logged based on URL parameters and tag:
// logger.info("General message", { tag: "general" });
// 
// // URL parameters:
// // ?scope=all - show all logs
// // ?scope=none - show no logs (default)
// // ?scope=tag&tag=hud - show only logs with tag "hud"
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

  public trace(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    this.log(LogLevel.TRACE, message, options?.context, options?.data);
  }

  public debug(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    this.log(LogLevel.DEBUG, message, options?.context, options?.data);
  }

  public info(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    this.log(LogLevel.INFO, message, options?.context, options?.data);
  }

  public warn(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    this.log(LogLevel.WARN, message, options?.context, options?.data);
  }

  public error(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    this.log(LogLevel.ERROR, message, options?.context, options?.data);
  }

  public fatal(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    this.log(LogLevel.FATAL, message, options?.context, options?.data);
  }

  /**
   * Sacred assertion method following industry assert test patterns - THE WORD OF THE LORD!
   * @param condition The condition to assert
   * @param message The assertion message
   * @param context Optional context for the assertion
   * @param data Optional data to include with the assertion
   * @returns True if assertion passes, false if it fails
   */
  public assert(condition: boolean, message: string, options?: { context?: string; data?: unknown; tag?: string }): boolean {
    const timestamp = new Date().toISOString();
    const contextStr = options?.context ? ` [${options.context}]` : '';
    const dataStr = options?.data ? ` | Data: ${JSON.stringify(options.data)}` : '';
    
    if (condition) {
      // ASSERTION PASSED - THE SACRED SUCCESS!
      const passMessage = `✅ ASSERT PASS: ${message}${dataStr}`;
      const formattedPass = `${timestamp} [ASSERT_PASS]${contextStr} ${passMessage}`;
      
      // Log the assertion pass
      this.log(LogLevel.INFO, `ASSERT PASS: ${message}`, options?.context, options?.data);
      
      // Print pass result to console
      if (this.config.enableConsole) {
        console.info(formattedPass);
      }
      
      return true;
    } else {
      // ASSERTION FAILED - THE SACRED FAILURE!
      const failMessage = `❌ ASSERT FAIL: ${message}${dataStr}`;
      const formattedFail = `${timestamp} [ASSERT_FAIL]${contextStr} ${failMessage}`;
      
      // Log the assertion failure
      this.log(LogLevel.ERROR, `ASSERT FAIL: ${message}`, options?.context, options?.data);
      
      // Print fail result to console
      if (this.config.enableConsole) {
        console.error(formattedFail);
      }
      
      return false;
    }
  }

  /**
   * Sacred assertion method with custom failure message - THE WORD OF THE LORD!
   * @param condition The condition to assert
   * @param passMessage The message to show when assertion passes
   * @param failMessage The message to show when assertion fails
   * @param context Optional context for the assertion
   * @param data Optional data to include with the assertion
   * @returns True if assertion passes, false if it fails
   */
  public assertWithMessages(
    condition: boolean, 
    passMessage: string, 
    failMessage: string, 
    options?: { context?: string; data?: unknown; tag?: string }
  ): boolean {
    const timestamp = new Date().toISOString();
    const contextStr = options?.context ? ` [${options.context}]` : '';
    const dataStr = options?.data ? ` | Data: ${JSON.stringify(options.data)}` : '';
    
    if (condition) {
      // ASSERTION PASSED - THE SACRED SUCCESS!
      const formattedPass = `${timestamp} [ASSERT_PASS]${contextStr} ✅ ${passMessage}${dataStr}`;
      
      // Log the assertion pass
      this.log(LogLevel.INFO, `ASSERT PASS: ${passMessage}`, options?.context, options?.data);
      
      // Print pass result to console
      if (this.config.enableConsole) {
        console.info(formattedPass);
      }
      
      return true;
    } else {
      // ASSERTION FAILED - THE SACRED FAILURE!
      const formattedFail = `${timestamp} [ASSERT_FAIL]${contextStr} ❌ ${failMessage}${dataStr}`;
      
      // Log the assertion failure
      this.log(LogLevel.ERROR, `ASSERT FAIL: ${failMessage}`, options?.context, options?.data);
      
      // Print fail result to console
      if (this.config.enableConsole) {
        console.error(formattedFail);
      }
      
      return false;
    }
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

  public clearStorage(): void {
    this.clearLogs();
  }

  public getStorageEntries(): readonly LogEntry[] {
    return this.getLogs();
  }

  public exportLogs(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }

  public importLogs(logsJson: string): void {
    try {
      const logs = JSON.parse(logsJson);
      if (Array.isArray(logs)) {
        this.logs = [...logs];
      }
    } catch (error) {
      this.error('Failed to import logs', 'Logger', { error });
    }
  }

  public setMinLevel(level: LogLevel): void {
    this.config = { ...this.config, minLevel: level };
  }
}

// Check if we're in localhost and get URL parameters for logging scope
const isLocalhost = typeof window !== 'undefined' && window.location.href.includes('localhost');
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const loggingScope = urlParams.get('scope') || 'none'; // all, none, or tag
const targetTag = urlParams.get('tag') || ''; // specific tag to target

// Debug localhost detection
if (typeof window !== 'undefined') {
  console.log('🔍 Logger Debug:', {
    href: window.location.href,
    isLocalhost,
    loggingScope,
    targetTag
  });
}


// Create empty stub logger for non-localhost environments
const createStubLogger = () => ({
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  assert: () => {},
  assertWithMessages: () => {},
  log: () => {},
  clearStorage: () => {},
  getStorageEntries: () => [],
  exportLogs: () => '',
  importLogs: () => {},
  setMinLevel: () => {},
});

// Create logger with scope checking
const createScopedLogger = () => {
  const logger = new Logger({
    minLevel: LogLevel.INFO,
    enableConsole: true,
    enableStorage: true,
    maxStorageEntries: 1000
  });

  // Private helper to determine if logging is within scope
  const withinScope = (tag?: string): boolean => {
    // Check scope and return early if out of scope
    if (loggingScope === 'none') {
      return false;
    }
    
    if (loggingScope === 'all') {
      return true;
    }
    
    if (loggingScope === 'tag') {
      // If targetTag is specified, only allow logs with that exact tag
      if (targetTag) {
        return tag === targetTag;
      } else {
        // If no targetTag specified, allow all logs
        return true;
      }
    }
    
    // Fallback: if we get here, something went wrong with scope detection
    return false; // Default to false if scope is not recognized
  };

  // Create wrapper that checks scope before calling logger methods
  const createScopedMethod = (originalMethod: Function) => {
    return function(this: any, ...args: any[]) {
      // Extract tag from options object - second parameter
      // Support both old format (message, context) and new format (message, options)
      let tag: string | undefined;
      
      if (args.length >= 2 && typeof args[1] === 'object' && args[1] !== null) {
        // New format: (message, options)
        tag = args[1].tag;
      } else {
        // Old format: (message, context) - no tag, allow all logs
        tag = undefined;
      }
      
      // Check scope and return early if out of scope
      const isWithinScope = withinScope(tag);
      if (!isWithinScope) {
        return;
      }
      
      return originalMethod.apply(this, args);
    };
  };

  return {
    info: createScopedMethod(logger.info.bind(logger)),
    warn: createScopedMethod(logger.warn.bind(logger)),
    error: createScopedMethod(logger.error.bind(logger)),
    debug: createScopedMethod(logger.debug.bind(logger)),
    trace: createScopedMethod(logger.trace.bind(logger)),
    fatal: createScopedMethod(logger.fatal.bind(logger)),
    assert: createScopedMethod(logger.assert.bind(logger)),
    assertWithMessages: createScopedMethod(logger.assertWithMessages.bind(logger)),
    log: createScopedMethod(logger.log.bind(logger)),
    clearStorage: createScopedMethod(logger.clearStorage.bind(logger)),
    getStorageEntries: createScopedMethod(logger.getStorageEntries.bind(logger)),
    exportLogs: createScopedMethod(logger.exportLogs.bind(logger)),
    importLogs: createScopedMethod(logger.importLogs.bind(logger)),
    setMinLevel: createScopedMethod(logger.setMinLevel.bind(logger)),
  };
};

// Return stub logger if not localhost, otherwise return scoped logger
export const logger = !isLocalhost ? createStubLogger() : createScopedLogger();

// Export the Logger class for custom instances
export { Logger };

// ============================================================================
// END OF SACRED LOGGING SYSTEM
// ============================================================================