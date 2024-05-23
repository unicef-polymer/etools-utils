export enum EnvironmentType {
  PROD = 'prod',
  STAGING = 'staging',
  TEST = 'test',
  DEV = 'dev',
  DEMO = 'demo',
  LOCAL = 'local'
}

export type EnvironmentDomain = {
  [key in EnvironmentType]: string;
};

export const EnvironmentDomainDefaults: EnvironmentDomain = {
  [EnvironmentType.PROD]: 'etools.unicef.org',
  [EnvironmentType.STAGING]: 'etools-staging.unicef.org',
  [EnvironmentType.TEST]: 'etools-test.unicef.org',
  [EnvironmentType.DEV]: 'etools-dev.unicef.org',
  [EnvironmentType.DEMO]: 'etools-demo.unicef.org',
  [EnvironmentType.LOCAL]: 'etools.localhost'
};

export const envOtherHostDefaults: Record<string, EnvironmentDomain> = {
  PRP: {
    [EnvironmentType.PROD]: 'https://www.partnerreportingportal.org',
    [EnvironmentType.STAGING]: 'https://staging.partnerreportingportal.org',
    [EnvironmentType.TEST]: 'https://dev.partnerreportingportal.org',
    [EnvironmentType.DEV]: 'https://dev.partnerreportingportal.org',
    [EnvironmentType.DEMO]: 'https://demo.partnerreportingportal.org',
    [EnvironmentType.LOCAL]: 'http://prp.localhost:8081'
  }
};

class EnvironmentClass {
  private static _instance: EnvironmentClass;
  private _envDomains: EnvironmentDomain = EnvironmentDomainDefaults;
  private _envOtherHosts: Record<string, EnvironmentDomain> = envOtherHostDefaults;
  private _env: EnvironmentType = EnvironmentType.PROD;

  public static getInstance(): EnvironmentClass {
    if (!EnvironmentClass._instance) {
      EnvironmentClass._instance = new EnvironmentClass();
    }
    return EnvironmentClass._instance;
  }

  constructor() {
    this.detectEnvironment();
  }

  get baseUrl() {
    return document.getElementsByTagName('base')[0].href;
  }

  get basePath() {
    return '/' + this.baseUrl.replace(window.location.origin, '').slice(1, -1) + '/';
  }

  setup(environmentDomains?: EnvironmentDomain, envOtherHosts?: Record<string, EnvironmentDomain>) {
    if (envOtherHosts) {
      this._envOtherHosts = envOtherHosts;
    }

    if (environmentDomains) {
      this._envDomains = environmentDomains;
      this.detectEnvironment();
    }
  }

  get() {
    return this._env;
  }

  getHost(host: string, defaultEnvironment?: EnvironmentType) {
    const selectedHost = this._envOtherHosts?.[host];

    if (selectedHost) {
      return selectedHost[this._env] || selectedHost[defaultEnvironment || EnvironmentType.LOCAL] || null;
    }

    return null;
  }

  is(environmentToCheck: EnvironmentType) {
    return this._env === environmentToCheck;
  }

  private detectEnvironment() {
    const location: string = window.location.href;
    const environments = Object.keys(this._envDomains) as EnvironmentType[];
    this._env =
      environments.find((key: EnvironmentType) => location.includes(this._envDomains[key])) || EnvironmentType.PROD;
  }
}

export const Environment = EnvironmentClass.getInstance();
