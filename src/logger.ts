import { createLogger } from 'bunyan';

export class Logger {
  private static logger = createLogger({
    name: 'Auto Sign',
    level: 'warn',
  });

  static setLevel(level: 'debug' | 'info' | 'warn' | 'error') {
    Logger.logger = createLogger({
      name: 'Auto Sign',
      level: level,
    });
  }

  static debug(obj: unknown) {
    Logger.logger.debug(obj);
  }

  static info(obj: unknown) {
    Logger.logger.info(obj);
  }

  static warn(obj: unknown) {
    Logger.logger.warn(obj);
  }

  static error(obj: unknown) {
    Logger.logger.error(obj);
  }
}
