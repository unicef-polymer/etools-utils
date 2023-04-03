import {EtoolsRedirectPath} from '../enums/router.enum';
import {
  EtoolsRouteCallbackParams,
  EtoolsRouteDetails,
  EtoolsRouteQueryParams,
  EtoolsRouterConfig
} from '../interfaces/router.interfaces';
import {EtoolsRedirectPaths, EtoolsRoutes} from '../types/router.types';

/**
 * Simple router that will help with:
 *  - registering app routes
 *  - check for app valid routes and get route details, like name, params or queryParams,
 */
export class EtoolsRouterClass {
  private static _instance: EtoolsRouterClass;
  private routes: EtoolsRoutes = [];
  private baseUrl = '/';
  private redirectPaths: EtoolsRedirectPaths = {
    notFound: '/not-found',
    default: '/'
  };
  private redirectedPathsToSubpageLists: string[] = [];

  static getInstance(): EtoolsRouterClass {
    if (!EtoolsRouterClass._instance) {
      EtoolsRouterClass._instance = new EtoolsRouterClass();
    }
    return EtoolsRouterClass._instance;
  }

  static clearStartEndSlashes(path: string): string {
    return path.toString().replace(/\/$/, '').replace(/^\//, '');
  }

  /**
   * Initialize router
   * @param {EtoolsRouterConfig} config Configuration object for router
   * @param {string} config.baseUrl The base url of the router. Will be add as prefix to all paths.
   * @param {EtoolsRedirectPaths} config.redirectPaths Default redirect paths. Contains path for not
   * found page and home page
   * @param {string[]} config.redirectedPathsToSubpageLists List of pages that require redirect to their
   * respective /list subpage
   */
  init(config: EtoolsRouterConfig) {
    this.baseUrl =
      config.baseUrl && config.baseUrl !== '/'
        ? '/' + EtoolsRouterClass.clearStartEndSlashes(config.baseUrl) + '/'
        : '/';
    this.redirectPaths = config.redirectPaths;
    this.redirectedPathsToSubpageLists = config.redirectedPathsToSubpageLists;
  }

  setRedirectPath(pathKey: EtoolsRedirectPath, value: string) {
    this.redirectPaths[pathKey] = value;
  }

  getRedirectPath(pathKey: keyof EtoolsRedirectPaths) {
    return this.redirectPaths[pathKey];
  }

  setRedirectedPathsToSubpageLists(paths: string[]) {
    this.redirectedPathsToSubpageLists = paths;
  }

  getRedirectedPathsToSubpageLists() {
    return this.redirectedPathsToSubpageLists;
  }

  getRedirectToListPath(path: string): undefined | string {
    path = this.getLocationPath(path);

    const pathComponents = path.split('/');

    let redirectTo: string | undefined;
    if (pathComponents.length == 0) {
      redirectTo = this.redirectPaths.default;
    }
    if (pathComponents.length == 1 && this.redirectedPathsToSubpageLists.includes(pathComponents[0])) {
      redirectTo = pathComponents[0] + '/list';
    }

    return redirectTo ? `${this.baseUrl}${redirectTo}` : undefined;
  }

  getLocationPath(path?: string): string {
    path = path || decodeURI(location.pathname + location.search);
    // remove root path
    if (path.indexOf(this.baseUrl) === 0) {
      // remove root only if it is the first
      path = path.replace(this.baseUrl, '');
    }
    // remove ending slash
    path = path.replace(/\/$/, '');
    return path;
  }

  isRouteAdded(regex: RegExp | null): boolean {
    const filterKey: string = regex instanceof RegExp ? regex.toString() : '';
    const route = this.routes.find((r) => r.regex.toString() === filterKey);
    return !!route;
  }

  addRoute(
    regex: RegExp | null,
    handler: (params: EtoolsRouteCallbackParams) => EtoolsRouteDetails
  ): EtoolsRouterClass {
    if (!this.isRouteAdded(regex)) {
      // prevent adding the same route multiple times
      this.routes.push({regex: regex === null ? '' : regex, handler: handler});
    }
    return this;
  }

  buildQueryParams(paramsStr: string): EtoolsRouteQueryParams {
    const qParams: EtoolsRouteQueryParams = {} as EtoolsRouteQueryParams;
    if (paramsStr) {
      const qs: string[] = paramsStr.split('&');
      qs.forEach((qp: string) => {
        const qParam = qp.split('=');
        qParams[qParam[0] as string] = qParam[1];
      });
    }
    return qParams;
  }

  /**
   * This method will match the given path/current location to a registered route.
   * If no route is matched it will return null.
   * If a match is found, based on route regex and match callback, it will return a TRouteDetails object with
   * details about this route: name, sub-route name (if any), route params, query params, route path.
   * @param path
   */
  getRouteDetails(path?: any): EtoolsRouteDetails | null {
    let routeDetails: EtoolsRouteDetails | null = null;
    let locationPath: string = path ? this.getLocationPath(path) : this.getLocationPath();

    const qsStartIndex: number = locationPath.indexOf('?');
    let qs = '';
    if (qsStartIndex > -1) {
      const loc = locationPath.split('?');
      locationPath = loc[0];
      qs = loc[1];
    }

    for (let i = 0; i < this.routes.length; i++) {
      const match = locationPath.match(this.routes[i].regex);
      if (match) {
        const routeParams: EtoolsRouteCallbackParams = {
          matchDetails: match.slice(0).map((matchVal: string) => decodeURIComponent(matchVal)),
          queryParams: this.decodeQueryStrToObj(qs)
        };
        routeDetails = this.routes[i].handler.bind({}, routeParams)();
        break;
      }
    }
    return routeDetails;
  }

  decodeQueryStrToObj(paramsStr: string): EtoolsRouteQueryParams {
    const qsObj: EtoolsRouteQueryParams = {} as EtoolsRouteQueryParams;
    if (paramsStr) {
      const qs: string[] = paramsStr.split('&');
      qs.forEach((qp: string) => {
        const qParam = qp.split('=');
        qsObj[qParam[0] as string] = decodeURIComponent(qParam[1]);
      });
    }
    return qsObj;
  }

  prepareLocationPath(path: string): string {
    return path.indexOf(this.baseUrl) === -1 ? this.baseUrl + EtoolsRouterClass.clearStartEndSlashes(path) : path;
  }

  pageIsNotCurrentlyActive(routeDetails: any, routeName: string, subRouteName: string, subSubRouteName?: string) {
    return !(
      routeDetails &&
      routeDetails.routeName === routeName &&
      routeDetails.subRouteName === subRouteName &&
      (!subSubRouteName || routeDetails.subSubRouteName === subSubRouteName)
    );
  }

  pushState(path?: string, queryParams?: string) {
    path = path ? this.prepareLocationPath(path) : '';
    history.pushState(window.history.state, '', `${path}${queryParams && queryParams.length ? `?${queryParams}` : ''}`);
    return this;
  }

  replaceState(path?: string, queryParams?: string) {
    path = path ? this.prepareLocationPath(path) : '';
    history.replaceState(
      window.history.state,
      '',
      `${path}${queryParams && queryParams.length ? `?${queryParams}` : ''}`
    );
    return this;
  }

  /**
   * Utility used to update location based on routes and dispatch navigate action (optional)
   */
  updateAppLocation(newLocation: string, queryParams?: string): void {
    this.pushState(newLocation, queryParams);

    window.dispatchEvent(new CustomEvent('popstate'));
  }

  replaceAppLocation(newLocation: string, queryParams?: string): void {
    this.replaceState(newLocation, queryParams);

    /**
     * Note that just calling history.pushState() or history.replaceState()
     * won't trigger a popstate event.
     * The popstate event is only triggered by doing a browser action
     * such as a click on the back button (or calling history.back() in JavaScript).
     */
    window.dispatchEvent(new CustomEvent('popstate'));
  }
}

export const EtoolsRouter = EtoolsRouterClass.getInstance();
