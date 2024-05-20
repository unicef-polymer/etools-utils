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

class EnvironmentClass {
  private static _instance: EnvironmentClass;
  private _envDomains: EnvironmentDomain = EnvironmentDomainDefaults;
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

  get basePath() {
    return document.getElementsByTagName('base')[0].href;
  }

  get baseUrl() {
    return '/' + this.basePath.replace(window.location.origin, '').slice(1, -1) + '/';
  }

  setup(environmentDomains?: EnvironmentDomain) {
    if (environmentDomains) {
      this._envDomains = environmentDomains;
      this.detectEnvironment();
    }
  }

  get() {
    return this._env;
  }

  is(environmentToCheck: EnvironmentType) {
    return this._env === environmentToCheck;
  }

  private detectEnvironment() {
    const location: string = window.location.href;
    const environments = Object.keys(this._envDomains) as EnvironmentType[];
    this._env =
      environments.find((key: EnvironmentType) => location.includes(this._envDomains[key])) || EnvironmentType.PROD;
    console.log(location, environments, this._envDomains);
  }
}

export const Environment = EnvironmentClass.getInstance();
