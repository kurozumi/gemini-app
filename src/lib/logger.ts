type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private static async sendToServer(level: LogLevel, message: string, data?: any) {
    // 開発環境のみコンソールにも出力
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${level.toUpperCase()}] ${message}`, data || '');
    }

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message, data }),
      });
    } catch (e) {
      // API自体が死んでいる場合は無視
    }
  }

  static info(message: string, data?: any) {
    this.sendToServer('info', message, data);
  }

  static warn(message: string, data?: any) {
    this.sendToServer('warn', message, data);
  }

  static error(message: string, data?: any) {
    this.sendToServer('error', message, data);
  }
}

export default Logger;
