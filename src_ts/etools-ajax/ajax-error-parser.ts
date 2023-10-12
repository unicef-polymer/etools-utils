import { fireEvent } from "../fire-event.util";


declare global {
  interface Window {
    ajaxErrorParserTranslateFunction: any;
  }
}
const globalMessage = 'An error occurred. Please try again later.';
const httpStatus413Msg = 'The uploaded file is too large!';
const http403Msg = 'Forbidden action due to a lack of permissions';

export function tryGetResponseError(response: any): any {
  if (response.status === 413) {
    return httpStatus413Msg;
  }
  if (response.status === 403) {
    return http403Msg;
  }
  if (response.status >= 401) {
    return globalMessage;
  }
  return response.response || globalMessage;
}

export function getErrorsArray(errors: any, keyTranslate?: (key: string) => string): any | any[] {
  if (!errors) {
    return [];
  }

  if (typeof errors === 'string') {
    return [translateSomeBkErrMessages(errors)];
  }

  if (!keyTranslate) {
    keyTranslate = window.ajaxErrorParserTranslateFunction || defaultKeyTranslate;
  }

  if (Array.isArray(errors)) {
    return errors
      .map((error) =>
        typeof error === 'string' ? translateSomeBkErrMessages(error) : getErrorsArray(error, keyTranslate)
      )
      .flat();
  }

  const isObject = typeof errors === 'object';
  if (isObject && errors.error && typeof errors.error === 'string') {
    return [translateSomeBkErrMessages(errors.error)];
  }

  if (isObject && errors.errors && Array.isArray(errors.errors)) {
    return errors.errors
      .map(function (err: any) {
        if (typeof err === 'object') {
          return Object.values(err); // will work only for strings
        } else {
          return err;
        }
      })
      .flat();
  }

  if (isObject && errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
    return errors.non_field_errors;
  }

  if (isObject && errors.code) {
    return parseTypedError(errors, keyTranslate);
  } else if (isObject) {
    return Object.entries(errors)
      .map(([field, value]) => {
        if (keyTranslate) {
          const translatedField = keyTranslate(field);
          if (typeof value === 'string') {
            return `${keyTranslate('Field')} ${translatedField} - ${translateSomeBkErrMessages(value)}`;
          }
          if (Array.isArray(value)) {
            const baseText = `${keyTranslate('Field')} ${translatedField}: `;
            const textErrors = getErrorsArray(value, keyTranslate);
            // * The marking is used for display in etools-error-messages-box
            // * and adds welcomed indentations when displayed as a toast message
            return textErrors.length === 1 ? `${baseText}${textErrors}` : [baseText, ..._markNestedErrors(textErrors)];
          }
          if (typeof value === 'object') {
            return Object.entries(value || {}).map(
              ([nestedField, nestedValue]) =>
                `${keyTranslate ? keyTranslate('Field') : 'Field'} ${translatedField} (${keyTranslate ? keyTranslate(nestedField) : nestedField}) - ${getErrorsArray(
                  nestedValue,
                  keyTranslate
                )}`
            );
          }
        }
        return '';
      })
      .flat();
  }

  return [];
}

function _markNestedErrors(errs: string[]): string[] {
  return errs.map((er) => ' ' + er);
}

export function formatServerErrorAsText(error: any, keyTranslate?: (key: string) => string): string {
  const errorResponse = tryGetResponseError(error);
  const errorsArray = getErrorsArray(errorResponse, keyTranslate);
  if (errorsArray && errorsArray.length) {
    return errorsArray.join('\n');
  }
  return error;
}

export function parseRequestErrorsAndShowAsToastMsgs(
  error: any,
  source: HTMLElement,
  redirectOn404: boolean = false
): void {
  if (redirectOn404 && error.status === 404) {
    fireEvent(source, '404');
    return;
  }

  const errorsString = formatServerErrorAsText(error);

  showErrorAsToastMsg(errorsString, source);
}

export function showErrorAsToastMsg(errorsString: string, source: HTMLElement): void {
  if (errorsString) {
    fireEvent(source, 'toast', { text: errorsString, showCloseBtn: true });
  }
}

function parseTypedError(errorObject: any, keyTranslate?: (key: string) => string): string {
  switch (errorObject.code) {
    case 'required_in_status':
      if (keyTranslate) {
        const fields = errorObject.extra.fields.map((field: string) => keyTranslate(field)).join(', ');
        return `${keyTranslate('required_in_status')}: ${fields}`;
      }
      return ''; // Add a return statement to prevent fallthrough
    default:
      return errorObject.description || '';
  }
}


export function defaultKeyTranslate(key: string = ''): string {
  return key
    .split('_')
    .map((fieldPart) => `${fieldPart[0].toUpperCase()}${fieldPart.slice(1)}`)
    .join(' ');
}

// Errors that come from unicef-attachements library are not translated on the BK (Feb 2023)
function translateSomeBkErrMessages(error: string): string {
  if (window.ajaxErrorParserTranslateFunction) {
    return window.ajaxErrorParserTranslateFunction(error);
  }
  return error;
}
