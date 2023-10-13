import {requestIsCacheable, getFromCache, cacheEndpointResponse} from '../dexie-caching.util';
import {doHttpRequest} from './request';
import {getEtoolsRequestConfigOptions} from './ajax-utils';

export interface RequestConfig {
  endpoint: RequestEndpoint;
  body?: any;
  method?: string;
  headers?: any;
  csrfCheck?: string; // 'disabled',
  /**
   * Set the timeout flag on the request
   */
  timeout?: number;
  /**
   * Toggle whether XHR is synchronous or asynchronous.
   * Don't change this to true unless You Know What You Are Doing
   */
  sync?: boolean;
  /**
   * Specifies what data to store in the response property,
   * and to deliver as event.detail.response in response events.
   * One of:
   * text: uses XHR.responseText.
   * xml: uses XHR.responseXML.
   * json: uses XHR.responseText parsed as JSON.
   * arraybuffer: uses XHR.response.
   * blob: uses XHR.response.
   * document: uses XHR.response.
   */
  handleAs?: XMLHttpRequestResponseType;
  /**
   * Prefix to be stripped from a JSON response before parsing it.
   * In order to prevent an attack using CSRF with Array responses
   * (http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx/)
   * many backends will mitigate this by prefixing all JSON response bodies with a string
   * that would be nonsensical to a JavaScript parser.
   */
  jsonPrefix?: string;
  /**
   * Changes the completes promise chain from generateRequest to reject with an object
   * containing the original request, as well an error message.
   * If false (default), the promise rejects with an error message only.
   */
  rejectWithRequest?: boolean;
  withCredentials?: boolean;
  params?: Record<string, unknown>;
}

export interface RequestEndpoint {
  url: string;
  exp?: number;
  cacheTableName?: string;
  cachingKey?: string;
  token_key?: string;
}
/**
 * Check endpoint info to see if data is cacheable,
 * if so try to return from cache, if nothing there, fire new request
 * and cache response if applicable
 * returns Promise
 * @param {
 *  endpoint: {
 *          url: string,
 *          exp?: number,
 *          cacheTableName?: string,
 *          cachingKey?: string
 *  },
 *  body: any,
 *  method: string,
 *  headers: any,
 *  csrfCheck: string // 'disabled',
 *  timeout: number,
 *  sync: boolean,
 *  handleAs: string,
 *  jsonPrefix: string,
 *  rejectWithRequest: boolean,
 *  withCredentials: boolean,
 *  params?: object
 * } reqConfig
 * @param {string} requestKey
 */
export async function sendRequest( reqConfig: RequestConfig, requestKey?: string): Promise<any> {
  const etoolsRequestConfigOptions = await getEtoolsRequestConfigOptions(reqConfig);

  if (requestIsCacheable(reqConfig.method, reqConfig.endpoint)) {
    return getFromCache(reqConfig.endpoint).catch(() => {
      return doHttpRequest(etoolsRequestConfigOptions, requestKey).then((response: any) =>
        cacheEndpointResponse(response, reqConfig.endpoint)
      );
    });
  }

  return doHttpRequest(etoolsRequestConfigOptions, requestKey);
}
