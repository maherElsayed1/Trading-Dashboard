/**
 * Simple logger utility for the application
 * In production, this could be replaced with winston, pino, or other logging libraries
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];

    if (this.isDevelopment) {
      // In development, use console with colors and emojis
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`[${timestamp}] 🐛 DEBUG:`, message, ...args);
          break;
        case LogLevel.INFO:
          console.info(`[${timestamp}] ℹ️  INFO:`, message, ...args);
          break;
        case LogLevel.WARN:
          console.warn(`[${timestamp}] ⚠️  WARN:`, message, ...args);
          break;
        case LogLevel.ERROR:
          console.error(`[${timestamp}] ❌ ERROR:`, message, ...args);
          break;
      }
    } else {
      // In production, output structured JSON logs
      const logEntry = {
        timestamp,
        level: levelName,
        message,
        data: args.length > 0 ? args : undefined,
      };
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = new Logger();