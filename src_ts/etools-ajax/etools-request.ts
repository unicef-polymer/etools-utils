import { tryJsonParse } from './etools-ajax-utils';
import { EtoolsXhrRequestInterface } from "./etools-request/etools-xhr-request";
import "./etools-request/etools-xhr-request";
import { EtoolsLogger } from "../singleton/logger";
import { EtoolsRequestError } from "./etools-ajax-request-mixin";


let activeAjaxRequests: { key: string; request: Element }[] = [];

/**
 * Fire a new http request using etools-xhr-request
 * @param {EtoolsXhrRequestInterface} etoolsRequestConfigOptions
 * @param {string} requestKey
 */
export function doHttpRequest(etoolsRequestConfigOptions: EtoolsXhrRequestInterface, requestKey?: string) {
  const etoolsRequestElement: Element = document.createElement('etools-xhr-request');
  (etoolsRequestElement as any).send(etoolsRequestConfigOptions);

  _addToActiveAjaxRequests(etoolsRequestElement, requestKey);

  return (etoolsRequestElement as any).completes
    .then((request: { response: any }) => {
      let responseData = request.response;

      if (etoolsRequestConfigOptions.handleAs === 'json' && typeof responseData === 'string') {
        responseData = tryJsonParse(responseData);
      }

      _cleanUp(requestKey);

      return responseData;
    })
    .catch((err: any) => {
      const error = err.error;
      const request = err.request;
      if (!request.aborted && request.xhr.status === 0) {
        // Not an error, this is an asynchronous request that is not completed yet
        return;
      }

      _cleanUp(requestKey);

      // Check request aborted, no error handling in this case
      if (!request.aborted) {
        throw new EtoolsRequestError(error, request.xhr.status, request.xhr.statusText, request.xhr.response);
      } else {
        throw new EtoolsRequestError(error, 0, 'Request aborted', null);
      }
    });
}

function _cleanUp(requestKey?: string) {
  _removeActiveRequestFromList(requestKey);
}

function _addToActiveAjaxRequests( request: Element, key?: string) {
  if (key) {
    activeAjaxRequests.push({ key, request });
  }
}

function _removeActiveRequestFromList(key?: string) {
  if (key) {
    activeAjaxRequests = activeAjaxRequests.filter((a) => a.key !== key);
  }
}

function getActiveRequestByKey(key: string) {
  return activeAjaxRequests.find((a) => a.key === key);
}

/**
 * Abort a request by its key
 * @param {string} key
 */
export function abortRequestByKey(key: string) {
  // Abort request by key
  if (key) {
    const activeReq = getActiveRequestByKey(key);
    if (activeReq) {
      abortRequest(activeReq);
    } else {
      EtoolsLogger.warn(`No active request found by this key: ${key}.`, 'EtoolsAjaxRequestMixin:abortRequest');
    }
  } else {
    EtoolsLogger.warn('Aborting request by key requires a key.', 'EtoolsAjax:abortRequestByKey');
  }
}

function abortRequest(activeReqMapObj: { request: Element }) {
  if (activeReqMapObj.request) {
    (activeReqMapObj.request as any).abort();
  }
}
