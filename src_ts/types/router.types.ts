import {EtoolsRedirectPath} from '../enums/router.enum';
import {EtoolsRouteCallbackParams, EtoolsRouteDetails} from '../interfaces/router.interfaces';

export type EtoolsRoute = {regex: RegExp | string; handler: (params: EtoolsRouteCallbackParams) => EtoolsRouteDetails};
export type EtoolsRoutes = EtoolsRoute[];
export type EtoolsRedirectPaths = {[key in EtoolsRedirectPath]: string};
