import {RequestConfig} from './ajax-request';
import {XhrRequestInterface} from './xhr-request';

declare global {
  interface Window {
    EtoolsLanguage: any;
    AppMsalInstance: any;
  }
}

export function getCsrfHeader(method?: string, csrfCheck?: string): Record<string, string> {
  if (!!method && csrfSafeMethod(method)) {
    return {};
  }
  const csrfHeaders: Record<string, string> = {};
  if (csrfCheck !== 'disabled') {
    const csrfToken = _getCSRFCookie();

    if (csrfToken) {
      csrfHeaders['x-csrftoken'] = csrfToken;
    }
  }
  return csrfHeaders;
}

export function csrfSafeMethod(method: string): boolean {
  // these HTTP methods do not require CSRF protection
  return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
}

export function _getCSRFCookie(): string | null {
  // check for a csrftoken cookie and return its value
  const csrfCookieName = 'csrftoken';
  let csrfToken: string | null = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, csrfCookieName.length + 1) === csrfCookieName + '=') {
        csrfToken = decodeURIComponent(cookie.substring(csrfCookieName.length + 1));
        break;
      }
    }
  }
  return csrfToken;
}

export function tryJsonParse(response: string): any {
  try {
    return JSON.parse(response);
  } catch (_e) {
    return response;
  }
}

export function getClientConfiguredHeaders(additionalHeaders?: Record<string, any> | null): Record<string, string> {
  const clientHeaders: Record<string, string> = {};
  if (additionalHeaders) {
    for (const header in additionalHeaders) {
      if (Object.prototype.hasOwnProperty.call(additionalHeaders, header)) {
        clientHeaders[header] = additionalHeaders[header].toString();
      }
    }
  }
  return clientHeaders;
}

export async function getRequestHeaders(reqConfig: {
  body?: any;
  endpoint: {token_key?: string; url: string};
  headers?: Record<string, any> | null;
  csrfCheck?: string;
  method?: string;
}): Promise<Record<string, string>> {
  let headers: Record<string, string> = {};
  headers['content-type'] = determineContentType(reqConfig.body);
  const authHeader = await getAuthorizationHeader(reqConfig.endpoint);
  if (
    window.EtoolsLanguage &&
    (String(reqConfig.endpoint.url).startsWith('/') || reqConfig.endpoint.url.includes(window.location.host))
  ) {
    headers['language'] = window.EtoolsLanguage;
  }
  headers = Object.assign(
    {},
    headers,
    getClientConfiguredHeaders(reqConfig.headers),
    authHeader,
    getCsrfHeader(reqConfig.method, reqConfig.csrfCheck)
  );

  return headers;
}

async function getAuthorizationHeader(endpoint: {token_key?: string}): Promise<Record<string, string>> {
  if (endpoint.token_key) {
    let token = localStorage.getItem(endpoint.token_key);
    if (window.AppMsalInstance) {
      try {
        token = await window.AppMsalInstance.acquireTokenSilent();
      } catch (err) {
        console.log(err);
        window.location.reload();
      }
    }
    return {
      Authorization: 'JWT ' + token
    };
  }

  return {};
}

/**
 * Content-Type set here can be overridden later
 * by headers sent from the client
 */
export function determineContentType(body: any): string {
  let contentType = 'application/json';

  if (typeof body === 'string') {
    contentType = 'application/x-www-form-urlencoded';
  }

  return contentType;
}

export function isNonEmptyObject(obj: Record<string, unknown> | null | undefined): boolean {
  return obj !== null && obj !== undefined && typeof obj === 'object' && Object.keys(obj).length > 0;
}

export async function getEtoolsRequestConfigOptions(ajaxReqConfig: RequestConfig): Promise<XhrRequestInterface> {
  ajaxReqConfig.method = ajaxReqConfig.method || 'GET';
  const headers = await getRequestHeaders(ajaxReqConfig);
  return {
    url: getRequestUrl(ajaxReqConfig),
    method: ajaxReqConfig.method,
    headers,
    body: ajaxReqConfig.body || {},
    async: !ajaxReqConfig.sync,
    handleAs: ajaxReqConfig.handleAs || 'json',
    withCredentials: !!ajaxReqConfig.withCredentials,
    timeout: ajaxReqConfig.timeout || 0,
    rejectWithRequest: true
  };
}

export function getRequestUrl(reqConfig: {endpoint: {url: string}; params?: Record<string, unknown>}): string {
  let url = reqConfig.endpoint.url;
  if (reqConfig.params) {
    url += buildQueryString(url, reqConfig.params);
  }
  return url;
}

export function buildQueryString(url: string, params: Record<string, unknown>): string {
  let queryStr = '';
  if (!params || !isNonEmptyObject(params)) {
    return '';
  }
  if (url.indexOf('?') < 0) {
    queryStr = '?';
  } else {
    queryStr = '&';
  }
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      queryStr += key + '=' + params[key] + '&';
    }
  }
  // remove trailing &
  queryStr = queryStr.substring(0, queryStr.length - 1);
  return queryStr;
}
