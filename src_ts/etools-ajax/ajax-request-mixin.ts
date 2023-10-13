import './scripts/es6-obj-assign-polyfil.js';
import AjaxDataMixin from './ajax-data-mixin';
import {requestIsCacheable, getFromCache, cacheEndpointResponse} from '../dexie-caching.util';
import {getCsrfHeader, getClientConfiguredHeaders, determineContentType, getRequestUrl} from './ajax-utils';
import {Constructor} from '../types/types';
import {XhrRequest} from './xhr-request';
import {EtoolsLogger} from '../singleton/logger';

export class RequestError extends Error {
  error: any;
  status: number;
  statusText: string;
  response: any;

  constructor(error: any, statusCode: number, statusText: string, response: any) {
    super();
    this.error = error;
    this.status = statusCode;
    this.statusText = statusText;
    this.response = _prepareResponse(response);
  }
}

function _prepareResponse(response: any) {
  try {
    return JSON.parse(response);
  } catch (e) {
    return response;
  }
}

/* eslint-disable no-unused-vars */
/**
 * A behavior that will allow you to make a request in any Polymer element you need.
 * @polymer
 * @mixinFunction
 * @applies EtoolsAjaxDataMixin
 * @demo demo/index.html
 */
export function AjaxRequestMixin<T extends Constructor<any>>(baseClass: T) {
  class EtoolsAjaxRequestMixinClass extends AjaxDataMixin(baseClass) {
    lastAjaxRequest?: XhrRequest;
    activeAjaxRequests: Array<any> = [];

    /**
     * Check for cached data if needed, if no cached data then fire new request
     * returns Promise
     */
    sendRequest(reqConfig: any, activeReqKey?: any): any {
      const reqConfigOptions = this.getEtoolsRequestConfigOptions(reqConfig);

      if (requestIsCacheable(reqConfig.method, reqConfig.endpoint)) {
        return getFromCache(reqConfig.endpoint).catch(() => {
          return this._doRequest(reqConfigOptions, activeReqKey).then((response) =>
            cacheEndpointResponse(response, reqConfig.endpoint)
          );
        });
      }
      // make request
      return this._doRequest(reqConfigOptions, activeReqKey);
    }
    _setLastAjaxRequest(request: XhrRequest) {
      this.lastAjaxRequest = request;
    }

    /**
     * Fire new request
     */
    _doRequest(reqConfigOptions: any, activeReqKey: any) {
      const request = new XhrRequest();

      request.send(reqConfigOptions);
      this._setLastAjaxRequest(request);
      this._addToActiveAjaxRequests(activeReqKey, request);

      return request.completes
        .then((request) => {
          let responseData = request.response;

          if (reqConfigOptions.handleAs === 'json' && typeof responseData === 'string') {
            responseData = _prepareResponse(responseData);
          }

          this._removeActiveRequestFromList(activeReqKey);

          return responseData;
        })
        .catch((err) => {
          const error = err.error;
          const request = err.request;
          if (!request.aborted && request.xhr.status === 0) {
            // not an error, this is an asynchronous request that is not completed yet
            return;
          }

          this._removeActiveRequestFromList(activeReqKey);
          // request failed
          // check request aborted, no error handling in this case
          if (!request.aborted) {
            throw new RequestError(error, request.xhr.status, request.xhr.statusText, request.xhr.response);
          } else {
            throw new RequestError(error, 0, 'Request aborted', null);
          }
        });
    }

    _addToActiveAjaxRequests(key: any, request: any) {
      if (key) {
        this.activeAjaxRequests.push({key: key, request: request});
      }
    }

    _removeActiveRequestFromList(key: any) {
      if (key) {
        const req = this.getActiveRequestByKey(key);
        if (req) {
          const requestIndex = this.activeAjaxRequests.indexOf(req);
          if (requestIndex > -1) {
            this.activeAjaxRequests.splice(requestIndex, 1);
          }
        }
      }
    }

    getActiveRequestByKey(key: any): any {
      return this.activeAjaxRequests.find((activeReqMapObj) => {
        return activeReqMapObj.key === key;
      });
    }

    abortRequestByKey(key: any): void {
      // abort request by key
      if (key) {
        const activeReq = this.getActiveRequestByKey(key);
        if (activeReq) {
          this.abortActiveRequest(activeReq);
        } else {
          EtoolsLogger.warn('No active request found by this key: ' + key + '.', 'EtoolsAjaxRequestMixin:abortRequest');
        }
      } else {
        EtoolsLogger.warn('Aborting request by key requires a key.', 'EtoolsAjaxRequestMixin:abortRequestByKey');
      }
    }

    abortActiveRequest(activeReqMapObj: any): void {
      if (activeReqMapObj && activeReqMapObj.request) {
        activeReqMapObj.request.abort();
      } else {
        EtoolsLogger.warn('There is no request to abort.', 'EtoolsAjaxRequestMixin:abortActiveRequest');
      }
    }

    getEtoolsRequestConfigOptions(reqConfig: any) {
      reqConfig.method = reqConfig.method || 'GET';
      return {
        url: getRequestUrl(reqConfig),
        method: reqConfig.method,
        headers: this._getRequestHeaders(reqConfig),
        body: this._getRequestBody(reqConfig),
        async: !reqConfig.sync,
        handleAs: this._getHandleAs(reqConfig),
        jsonPrefix: reqConfig.jsonPrefix || '',
        withCredentials: !!reqConfig.withCredentials,
        timeout: reqConfig.timeout || 0,
        rejectWithRequest: true
      };
    }

    _getHandleAs(reqConfig: any) {
      let handleAs = reqConfig.handleAs || 'json';
      if (reqConfig.downloadCsv) {
        handleAs = 'blob';
      }
      return handleAs;
    }

    _getRequestBody(reqConfig: any) {
      let body = reqConfig.body || {};
      if (reqConfig.multiPart) {
        body = this._prepareMultiPartFormData(body, reqConfig.prepareMultipartData);
      }
      return body;
    }

    _getRequestHeaders(reqConfig: any) {
      let headers: {[key: string]: any} = {};

      headers['content-type'] = determineContentType(reqConfig.body);

      if (reqConfig.downloadCsv) {
        headers['accept'] = 'text/csv';
        headers['content-type'] = 'text';
      }

      headers = Object.assign(
        {},
        headers,
        getClientConfiguredHeaders(reqConfig.headers),
        getCsrfHeader(reqConfig.method, reqConfig.csrfCheck)
      );

      if (reqConfig.multiPart) {
        // content type will be automatically set in this case
        delete headers['content-type'];
      }

      return headers;
    }
  }
  return EtoolsAjaxRequestMixinClass;
}

export default AjaxRequestMixin;
