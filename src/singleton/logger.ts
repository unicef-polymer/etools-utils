import {EtoolsLogLevel} from '../enums/logger.enum';

class EtoolsLoggerClass {
  private static _instance: EtoolsLoggerClass;
  private availableLogLevels = Object.values(EtoolsLogLevel);
  private etoolsLogsLevel = '';

  public static getInstance(): EtoolsLoggerClass {
    if (!EtoolsLoggerClass._instance) {
      EtoolsLoggerClass._instance = new EtoolsLoggerClass();
    }
    return EtoolsLoggerClass._instance;
  }

  constructor() {
    if (!this.etoolsLogsLevel) {
      this.etoolsLogsLevel = this._getLogLevel();
    }
  }

  setLogLevel(logLevel: EtoolsLogLevel) {
    if (logLevel && this.availableLogLevels.indexOf(logLevel) === -1) {
      this.etoolsLogsLevel = logLevel;
    }
  }

  error(message: string, messagePrefix?: any, other?: any) {
    if (this._canLog(EtoolsLogLevel.ERROR, EtoolsLogLevel.WARN, EtoolsLogLevel.INFO)) {
      console.error(this._getEtoolsLogMessages('ERROR', message, messagePrefix), other ? other : '');
    }
  }

  warn(message: string, messagePrefix?: any, other?: any) {
    if (this._canLog(EtoolsLogLevel.WARN, EtoolsLogLevel.INFO)) {
      console.warn(this._getEtoolsLogMessages('WARN', message, messagePrefix), other ? other : '');
    }
  }

  info(message: string, messagePrefix?: any, other?: any) {
    if (this._canLog(EtoolsLogLevel.INFO)) {
      console.log(this._getEtoolsLogMessages('INFO', message, messagePrefix), other ? other : '');
    }
  }

  private _getLogLevel() {
    if (window.EtoolsLogsLevel && this.availableLogLevels.indexOf(window.EtoolsLogsLevel) === -1) {
      // wrong log level set
      return EtoolsLogLevel.OFF;
    }
    return window.EtoolsLogsLevel || EtoolsLogLevel.OFF;
  }

  private _getEtoolsLogMessages(logLevel: string, message: string, messagePrefix?: any) {
    let msg = '[' + logLevel + ']';

    if (messagePrefix) {
      msg += '[' + messagePrefix.toString() + '] ';
    }

    msg += message;
    return msg;
  }

  private _canLog(...levels: string[]) {
    return levels.indexOf(this.etoolsLogsLevel) > -1;
  }
}

export const EtoolsLogger = EtoolsLoggerClass.getInstance();
