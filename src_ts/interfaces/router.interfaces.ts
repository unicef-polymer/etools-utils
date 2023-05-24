import {EtoolsRedirectPaths} from '../types/router.types';

export interface EtoolsRouteQueryParam {
  [key: string]: number | string;
}
export interface EtoolsRouteParams {
  [key: string]: number | string;
}

export interface EtoolsRouteQueryParams {
  [key: string]: any;
}

export interface EtoolsRoutesLazyLoadComponentsPath {
  [key: string]: string[];
}

export interface EtoolsRouteCallbackParams {
  matchDetails: string[];
  queryParams: EtoolsRouteQueryParams;
}

export interface EtoolsRouteDetails {
  routeName: string;
  subRouteName: string | null;
  subSubRouteName?: string;
  path: string;
  queryParams: EtoolsRouteQueryParam | null;
  params: EtoolsRouteParams | null;
}

export interface EtoolsRouterConfig {
  baseUrl: string;
  redirectPaths: EtoolsRedirectPaths;
  redirectedPathsToSubpageLists: string[];
}
