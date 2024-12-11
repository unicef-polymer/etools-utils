import {_getCSRFCookie, tryJsonParse} from './ajax-utils';
import {XhrRequest} from './xhr-request';

interface UploadConfig {
  jwtLocalStorageKey?: string;
  endpointInfo?: {
    endpoint?: string;
    rawFilePropertyName?: string;
    extraInfo?: Record<string, any>;
    rejectWithRequest?: boolean;
    method?: string;
  };
  uploadEndpoint: string;
}

export class RequestUploadError extends Error {
  error: any;
  status: number;
  statusText: string;
  response: any;
  request: any;

  constructor(error: any, statusCode: number, statusText: string, request?: any) {
    super();
    this.response = tryJsonParse(request?.xhr?.response);
    this.request = request;
    this.message = error.message;
    this.error = {
      message: Object.values(this.response).join(','),
      stack: error.stack
    };
    this.status = statusCode;
    this.statusText = statusText;
  }
}

const activeXhrRequests: Record<string, any> = {};

export function getActiveXhrRequests(): Record<string, any> {
  return activeXhrRequests;
}

export async function upload(
  config: UploadConfig,
  rawFile: File | Blob,
  filename: string,
  onProgressCallback?: (event: ProgressEvent) => void
): Promise<any> {
  const headers = await _getHeaders(config.jwtLocalStorageKey);
  const options = {
    method: config.endpointInfo?.method || 'POST',
    url: _getEndpoint(config.endpointInfo, config.uploadEndpoint),
    body: _prepareBody(rawFile, filename, config.endpointInfo),
    rejectWithRequest: true,
    headers
  };
  return sendRequest(options, filename, onProgressCallback)
    .then((response) => {
      delete activeXhrRequests[filename];
      if (typeof response === 'string') {
        response = JSON.parse(response);
      }
      return response;
    })
    .catch((error) => {
      delete activeXhrRequests[filename];
      throw error;
    });
}

async function _getHeaders(jwtLocalStorageKey: string | undefined) {
  const csrfToken = _getCSRFCookie();
  let jwtToken = _getJwtToken(jwtLocalStorageKey);
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers['x-csrftoken'] = csrfToken;
  }
  if (jwtLocalStorageKey) {
    if (window.AppMsalInstance) {
      try {
        jwtToken = await window.AppMsalInstance.acquireTokenSilent();
      } catch (err) {
        console.log(err);
        window.location.reload();
      }
    }
    if (jwtToken) {
      headers['authorization'] = 'JWT ' + jwtToken;
    }
  }
  return headers;
}

function _getEndpoint(endpointInfo: UploadConfig['endpointInfo'], uploadEndpoint: string) {
  if (endpointInfo && endpointInfo.endpoint) {
    return endpointInfo.endpoint;
  }
  return uploadEndpoint;
}

function _prepareBody(rawFile: File | Blob, filename: string, endpointInfo: UploadConfig['endpointInfo']) {
  const fd = new FormData();

  const rawFileProperty = _getRawFilePropertyName(endpointInfo);
  fd.append(rawFileProperty, rawFile, filename);

  if (endpointInfo && endpointInfo.extraInfo) {
    _addAnyExtraInfoToBody(fd, endpointInfo.extraInfo);
  }
  return fd;
}

function sendRequest(options: any, requestKey: string, onProgressCallback?: (event: ProgressEvent) => void) {
  const request = new XhrRequest();
  if (typeof onProgressCallback === 'function') {
    request.xhr.upload.onprogress = onProgressCallback;
  }
  activeXhrRequests[requestKey] = request;
  request.send(options);
  return request.completes
    .then((request) => {
      return request.response;
    })
    .catch((err) => {
      const request = err.request;
      // check request aborted, no error handling in this case
      if (!request.aborted) {
        throw new RequestUploadError(err.error, request.xhr.status, request.xhr.statusText, request);
      } else {
        throw new RequestUploadError(err.error, 0, 'Request aborted');
      }
    });
}

function _getRawFilePropertyName(endpointInfo: UploadConfig['endpointInfo']) {
  if (endpointInfo && endpointInfo.rawFilePropertyName) {
    return endpointInfo.rawFilePropertyName;
  }
  return 'file';
}

function _addAnyExtraInfoToBody(formData: FormData, extraInfo: Record<string, any>) {
  for (const prop in extraInfo) {
    if (Object.prototype.hasOwnProperty.call(extraInfo, prop)) {
      formData.append(prop, extraInfo[prop]);
    }
  }
}

function _getJwtToken(jwtLocalStorageKey: string | undefined) {
  if (jwtLocalStorageKey) {
    return localStorage.getItem(jwtLocalStorageKey);
  }
  return;
}

export function abortActiveRequests(activeReqKeys: string[] | undefined) {
  if (!activeXhrRequests) {
    return;
  }
  const keys = activeReqKeys || Object.keys(activeXhrRequests);
  if (keys.length) {
    keys.forEach((key) => {
      try {
        activeXhrRequests[key].abort();
        delete activeXhrRequests[key];
      } catch (_error) {
        //
      }
    });
  }
}
