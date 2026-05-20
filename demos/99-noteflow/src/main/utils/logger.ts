const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
type LogLevel = typeof LOG_LEVELS[number]

class Logger {
  private level: LogLevel = 'info'

  setLevel(level: LogLevel): void {
    this.level = level
  }

  debug(msg: string, ...args: any[]): void {
    if (this.shouldLog('debug')) console.debug(`[DEBUG] ${msg}`, ...args)
  }

  info(msg: string, ...args: any[]): void {
    if (this.shouldLog('info')) console.log(`[INFO] ${msg}`, ...args)
  }

  warn(msg: string, ...args: any[]): void {
    if (this.shouldLog('warn')) console.warn(`[WARN] ${msg}`, ...args)
  }

  error(msg: string, error?: Error, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${msg}`, error?.message || '', ...args)
      if (error?.stack) console.error(error.stack)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.level)
  }
}

export const logger = new Logger()
