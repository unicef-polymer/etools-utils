import {EtoolsLogLevel} from '../enums/logger.enum';
import {GenericObject} from '../types/global.types';

declare global {
  interface Window {
    EtoolsLogsLevel: EtoolsLogLevel;
    devToolsExtension: GenericObject;
    EtoolsDashboard: GenericObject;
    EtoolsRequestCacheDb: any;
  }
}

export {};
