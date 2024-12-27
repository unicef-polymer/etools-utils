import {fireEvent} from '../fire-event.util';

export interface XhrRequestInterface {
  url: string;
  method?: string;
  async?: boolean;
  body?: ArrayBuffer | ArrayBufferView | Blob | Document | FormData | string | object | null;
  headers?: object | null;
  handleAs?: XMLHttpRequestResponseType;
  withCredentials?: boolean;
  timeout?: number;
  rejectWithRequest?: boolean;
}

export class XhrRequest {
  xhr: XMLHttpRequest;
  response: any;
  status: number;
  statusText: string;
  completes: Promise<any>;
  progress: object;
  aborted: boolean;
  errored: boolean;
  timedOut: boolean;
  url: string;
  resolveCompletes!: (value?: any) => void;
  rejectCompletes!: (reason?: any) => void;

  constructor() {
    this.xhr = new XMLHttpRequest();
    this.response = () => null;
    this.status = 0;
    this.statusText = '';
    this.url = '';
    this.progress = () => ({});
    this.aborted = false;
    this.errored = false;
    this.timedOut = false;
    this.completes = new Promise<any>((resolve, reject) => {
      this.resolveCompletes = resolve;
      this.rejectCompletes = reject;
    });
  }

  get succeeded() {
    if (this.errored || this.aborted || this.timedOut) {
      return false;
    }
    const status = this.xhr?.status || 0;

    return status === 0 || (status >= 200 && status < 300);
  }

  send(options: XhrRequestInterface): Promise<any> | null {
    const xhr = this.xhr;

    if (xhr.readyState > 0) {
      return null;
    }

    xhr.addEventListener('progress', (progress) => {
      this._setProgress({
        lengthComputable: progress.lengthComputable,
        loaded: progress.loaded,
        total: progress.total
      });

      fireEvent(document, 'etools-request-progress-changed', {value: this.progress});
    });

    xhr.addEventListener('error', (error) => {
      this._setErrored(true);
      this._updateStatus();
      const response = options.rejectWithRequest ? {error: error, request: this} : error;
      this.rejectCompletes(response);
    });

    xhr.addEventListener('timeout', (error) => {
      this._setTimedOut(true);
      this._updateStatus();
      const response = options.rejectWithRequest ? {error: error, request: this} : error;
      this.rejectCompletes(response);
    });

    xhr.addEventListener('abort', () => {
      this._setAborted(true);
      this._updateStatus();
      const error = new Error('Request aborted.');
      const response = options.rejectWithRequest ? {error: error, request: this} : error;
      this.rejectCompletes(response);
    });

    xhr.addEventListener('loadend', () => {
      this._updateStatus();
      this._setResponse(this.parseResponse());

      if (!this.succeeded) {
        const error = new Error('The request failed with status code: ' + this.xhr?.status);
        const response = options.rejectWithRequest ? {error: error, request: this} : error;
        this.rejectCompletes(response);
        return;
      }

      this.resolveCompletes(this);
    });

    this.url = options.url;
    const isXHRAsync = options.async !== false;
    xhr.open(options.method || 'GET', options.url, isXHRAsync);

    const acceptType = {
      json: 'application/json',
      text: 'text/plain',
      html: 'text/html',
      xml: 'application/xml',
      arraybuffer: 'application/octet-stream'
    }[options.handleAs as string];
    let headers = options.headers || Object.create(null);
    const newHeaders = Object.create(null);
    for (const key in headers) {
      if (key) {
        newHeaders[key.toLowerCase()] = headers[key];
      }
    }
    headers = newHeaders;

    if (acceptType && !headers['accept']) {
      headers['accept'] = acceptType;
    }
    Object.keys(headers).forEach((requestHeader) => {
      if (/[A-Z]/.test(requestHeader)) {
        console.error('Headers must be lower case, got', requestHeader);
      }
      xhr.setRequestHeader(requestHeader, headers[requestHeader]);
    });

    if (isXHRAsync) {
      xhr.timeout = options.timeout ?? 0;

      const handleAs = options.handleAs;

      if (handleAs) xhr.responseType = handleAs;
    }

    xhr.withCredentials = !!options.withCredentials;

    const body = this._encodeBodyObject(options.body, headers['content-type']);

    xhr.send(body as any);

    return this.completes;
  }

  parseResponse() {
    const xhr = this.xhr;
    const responseType = xhr.responseType;
    const preferResponseText = !this.xhr.responseType;

    try {
      switch (responseType) {
        case 'json':
          if (preferResponseText || xhr.response === undefined) {
            try {
              return JSON.parse(xhr.responseText);
            } catch (_err) {
              console.warn('Failed to parse JSON sent from ' + xhr.responseURL);
              return null;
            }
          }

          return xhr.response;
        // case 'xml':
        //   return xhr.responseXML;
        case 'blob':
        case 'document':
        case 'arraybuffer':
          return xhr.response;
        case 'text':
        default: {
          return xhr.responseText;
        }
      }
    } catch (e: any) {
      this.rejectCompletes(new Error('Could not parse response. ' + e.message));
    }
  }

  abort() {
    this._setAborted(true);
    this.xhr.abort();
  }

  private _encodeBodyObject(body: any, contentType: string | null): any {
    if (typeof body == 'string') {
      return body;
    }
    const bodyObj = body as object;
    switch (contentType) {
      case 'application/json':
        return JSON.stringify(bodyObj);
      case 'application/x-www-form-urlencoded':
        return this._wwwFormUrlEncode(bodyObj);
    }
    return body;
  }

  private _wwwFormUrlEncode(object: {[key: string]: any}) {
    if (!object) {
      return '';
    }
    const pieces: string[] = [];
    Object.keys(object).forEach((key) => {
      pieces.push(this._wwwFormUrlEncodePiece(key) + '=' + this._wwwFormUrlEncodePiece(object[key]));
    });
    return pieces.join('&');
  }

  private _wwwFormUrlEncodePiece(str: any) {
    if (str === null || str === undefined || !str.toString) {
      return '';
    }

    return encodeURIComponent(str.toString().replace(/\r?\n/g, '\r\n')).replace(/%20/g, '+');
  }

  private _updateStatus() {
    this._setStatus(this.xhr.status);
    this._setStatusText(this.xhr.statusText === undefined ? '' : this.xhr.statusText);
  }

  private _setStatus(status: number) {
    this.status = status;
  }

  private _setStatusText(statusText: string) {
    this.statusText = statusText;
  }

  private _setResponse(response: any) {
    this.response = response;
  }

  private _setProgress(progress: object) {
    this.progress = progress;
  }

  private _setAborted(aborted: boolean) {
    this.aborted = aborted;
  }

  private _setErrored(errored: boolean) {
    this.errored = errored;
  }

  private _setTimedOut(timedOut: boolean) {
    this.timedOut = timedOut;
  }
}
