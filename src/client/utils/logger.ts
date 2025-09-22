// Enhanced logging utility for browser console streaming
import config from '../config.js';

export class BrowserLogger {
  private static instance: BrowserLogger | undefined;
  private logBuffer: string[] = [];

  private constructor() {
    this.setupConsoleInterception();
  }

  public static getInstance(): BrowserLogger {
    BrowserLogger.instance ??= new BrowserLogger();
    return BrowserLogger.instance;
  }

  private setupConsoleInterception(): void {
    // Console interception disabled per TEN_COMMANDMENTS
    // All console statements must be removed
  }


  public getLogs(): string[] {
    return [...this.logBuffer];
  }

  public clearLogs(): void {
    this.logBuffer = [];
  }

  public sendLogsToServer(): void {
    if (this.logBuffer.length === 0) return;

    const logs = this.getLogs();
    fetch(`${config.apiBaseUrl}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs })
    }).catch(() => {
      // Error sending logs - ignore per TEN_COMMANDMENTS
    });
  }
}

// Initialize the logger
export const browserLogger = BrowserLogger.getInstance();

// Send logs to server every 5 seconds
setInterval(() => {
  browserLogger.sendLogsToServer();
}, 5000);
