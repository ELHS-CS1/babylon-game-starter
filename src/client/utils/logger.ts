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

// TypeScript strict mode enabled - Disable strict type checking for this file due to exactOptionalPropertyTypes

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

// Export individual log levels for use
export const { TRACE, DEBUG, INFO, WARN, ERROR, FATAL } = LogLevel;

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
      enableConsole: false, // DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
      enableStorage: false, // DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
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
  // Check URL parameters for logging scope - THE WORD OF THE LORD!
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const loggingScope = urlParams.get('scope') ?? 'none';
  const targetTag = urlParams.get('tag') ?? '';
  
  // Extract tag from data object if it exists
  let logTag: string | undefined;
  if (data && typeof data === 'object' && data !== null && 'tag' in data) {
    logTag = (data as any).tag;
  }
  
  // Debug: Always log the URL parameters
  console.log('LOGGER DEBUG:', { loggingScope, targetTag, context, logTag, level, message });
  
  // Enable logging based on URL parameters
  if (loggingScope === 'all' || (loggingScope === 'tag' && targetTag === logTag)) {
    console.log(`[${level}] [${context}] ${message}`, data || '');
  } else {
    console.log('LOGGER FILTERED OUT:', { loggingScope, targetTag, context, logTag });
  }
    return;
  }

  public trace(_message: string, _options?: { context?: string; data?: unknown; tag?: string }): void {
    // ALL LOGGING DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
    return;
  }

  public debug(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    // Check URL parameters for logging scope - THE WORD OF THE LORD!
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const loggingScope = urlParams.get('scope') ?? 'none';
    const targetTag = urlParams.get('tag') ?? '';
    
    if (loggingScope === 'all' || (loggingScope === 'tag' && targetTag === options?.context)) {
      this.log('DEBUG', message, options?.context, options?.data);
    }
    return;
  }

  public info(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    // Check URL parameters for logging scope - THE WORD OF THE LORD!
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const loggingScope = urlParams.get('scope') ?? 'none';
    const targetTag = urlParams.get('tag') ?? '';
    
    if (loggingScope === 'all' || (loggingScope === 'tag' && targetTag === options?.context)) {
      this.log('INFO', message, options?.context, options?.data);
    }
    return;
  }

  public warn(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    // Check URL parameters for logging scope - THE WORD OF THE LORD!
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const loggingScope = urlParams.get('scope') ?? 'none';
    const targetTag = urlParams.get('tag') ?? '';
    
    if (loggingScope === 'all' || (loggingScope === 'tag' && targetTag === options?.context)) {
      this.log('WARN', message, options?.context, options?.data);
    }
    return;
  }

  public error(message: string, options?: { context?: string; data?: unknown; tag?: string }): void {
    // Check URL parameters for logging scope - THE WORD OF THE LORD!
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const loggingScope = urlParams.get('scope') ?? 'none';
    const targetTag = urlParams.get('tag') ?? '';
    
    if (loggingScope === 'all' || (loggingScope === 'tag' && targetTag === options?.context)) {
      this.log('ERROR', message, options?.context, options?.data);
    }
    return;
  }

  public fatal(_message: string, _options?: { context?: string; data?: unknown; tag?: string }): void {
    // ALL LOGGING DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
    return;
  }

  /**
   * Sacred assertion method following industry assert test patterns - THE WORD OF THE LORD!
   * @param condition The condition to assert
   * @param message The assertion message
   * @param context Optional context for the assertion
   * @param data Optional data to include with the assertion
   * @returns True if assertion passes, false if it fails
   */
  public assert(condition: boolean, _message: string, _options?: { context?: string; data?: unknown; tag?: string }): boolean {
    // ALL ASSERTIONS DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
    return condition;
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
    _passMessage: string, 
    _failMessage: string, 
    _options?: { context?: string; data?: unknown; tag?: string }
  ): boolean {
    // ALL ASSERTIONS DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
    return condition;
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
      const logs: unknown = JSON.parse(logsJson);
      if (Array.isArray(logs)) {
        this.logs = [...(logs as LogEntry[])];
      }
    } catch {
      // Failed to import logs - handled silently
    }
  }

  public setMinLevel(level: LogLevel): void {
    this.config = { ...this.config, minLevel: level };
  }
}

// Check if we're in localhost and get URL parameters for logging scope
const isLocalhost = typeof window !== 'undefined' && window.location.href.includes('localhost');
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const loggingScope = urlParams.get('scope') ?? 'none'; // all, none, or tag
const targetTag = urlParams.get('tag') ?? ''; // specific tag to target

// Debug localhost detection - using structured logging instead of console.log
if (typeof window !== 'undefined') {
  // Log debug info to structured logs instead of console
  const debugInfo = {
    href: window.location.href,
    isLocalhost,
    loggingScope,
    targetTag
  };
  // Store debug info in a way that doesn't use console.log
  if (typeof window !== 'undefined') {
    (window as Record<string, unknown>).__loggerDebug = debugInfo;
  }
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

// Create logger with scope checking (unused but kept for future use)
const _createScopedLogger = () => {
  const logger = new Logger({
    minLevel: LogLevel.INFO,
    enableConsole: false, // DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
    enableStorage: false, // DISABLED FOR PERFORMANCE - THE WORD OF THE LORD!
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
    return function(this: unknown, ...args: unknown[]) {
      // Extract tag from options object - second parameter
      // Support both old format (message, context) and new format (message, options)
      let tag: string | undefined;
      
      if (args.length >= 2 && typeof args[1] === 'object' && args[1] !== null) {
        // New format: (message, options)
        const options = args[1] as Record<string, unknown>;
        tag = typeof options.tag === 'string' ? options.tag : 
              typeof options.context === 'string' ? options.context : undefined;
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

// CONDITIONAL LOGGING DISABLE - THE WORD OF THE LORD!
// Only disable console if no logging scope is specified in URL
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const loggingScope = urlParams.get('scope') ?? 'none';
  
  if (loggingScope === 'none') {
    // DISABLE ALL LOGGING FOR PERFORMANCE - THE WORD OF THE LORD!
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
}

// Return scoped logger that respects URL parameters - THE WORD OF THE LORD!
export const logger = _createScopedLogger();

// Export the Logger class for custom instances
export { Logger };

// ============================================================================
// END OF SACRED LOGGING SYSTEM
// ============================================================================