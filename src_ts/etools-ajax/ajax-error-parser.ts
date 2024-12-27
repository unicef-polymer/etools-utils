import {fireEvent} from '../fire-event.util';

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
  if (!errors) return [];

  keyTranslate = keyTranslate || window.ajaxErrorParserTranslateFunction || defaultKeyTranslate;

  if (typeof errors === 'string') {
    return [translateSomeBkErrMessages(errors)];
  }

  if (Array.isArray(errors) && keyTranslate) {
    return flattenErrorsArray(errors, keyTranslate);
  }

  if (typeof errors === 'object' && keyTranslate) {
    return parseErrorObject(errors, keyTranslate);
  }

  return [];
}

// Helper to handle arrays of errors
function flattenErrorsArray(errors: any[], keyTranslate: (key: string) => string): any[] {
  return errors
    .map((error) =>
      typeof error === 'string' ? translateSomeBkErrMessages(error) : getErrorsArray(error, keyTranslate)
    )
    .flat();
}

// Helper to parse structured error objects
function parseErrorObject(errors: any, keyTranslate: (key: string) => string): any[] {
  const result = [];

  if (errors.error && typeof errors.error === 'string') {
    return [translateSomeBkErrMessages(errors.error)];
  }

  if (errors.errors && Array.isArray(errors.errors)) {
    result.push(...flattenErrorsFromArray(errors.errors));
    delete errors.errors;
  }

  if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
    result.push(...errors.non_field_errors);
    delete errors.non_field_errors;
  }

  if (errors.code) {
    const typedError = parseTypedError(errors, keyTranslate);
    if (typedError) result.push(typedError);
  } else {
    result.push(...parseErrorFields(errors, keyTranslate));
  }

  return result.flat();
}

// Helper to handle error arrays within error objects
function flattenErrorsFromArray(errors: any[]): any[] {
  return errors.map((err: any) => (typeof err === 'object' ? Object.values(err) : err)).flat();
}

// Helper to parse each field and its value within an error object
function parseErrorFields(errors: any, keyTranslate: (key: string) => string): any[] {
  const seenFields = new Set<string>();
  return Object.entries(errors).map(([field, value]) => {
    const translatedField = keyTranslate(field);
    if (seenFields.has(field)) {
      return null; // Skip if duplicate
    }
    seenFields.add(field); // Mark as seen
    if (typeof value === 'string') {
      return `${keyTranslate('Field')} ${translatedField} - ${translateSomeBkErrMessages(value)}`;
    }

    if (Array.isArray(value)) {
      return formatArrayErrors(value, translatedField, keyTranslate);
    }

    if (typeof value === 'object') {
      return parseNestedErrorFields(value, translatedField, keyTranslate, seenFields);
    }

    return '';
  });
}

// Format errors from an array of values for a specific field
function formatArrayErrors(errors: any[], translatedField: string, keyTranslate: (key: string) => string): any {
  const baseText = `${keyTranslate('Field')} ${translatedField}: `;
  const textErrors = getErrorsArray(errors, keyTranslate);
  return textErrors.length === 1 ? `${baseText}${textErrors}` : [baseText, ..._markNestedErrors(textErrors)];
}

// Helper to parse nested error fields within objects
function parseNestedErrorFields(
  nestedErrors: any,
  translatedField: string,
  keyTranslate: (key: string) => string,
  seenFields: Set<string>
): any {
  return Object.entries(nestedErrors).map(([nestedField, nestedValue]) => {
    if (seenFields.has(nestedField)) {
      return null; // Skip if duplicate
    }
    seenFields.add(nestedField); // Mark as seen
    return `${keyTranslate('Field')} ${translatedField} (${keyTranslate(nestedField)}) - ${getErrorsArray(
      nestedValue,
      keyTranslate
    )}`;
  });
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

export function parseRequestErrorsAndShowAsToastMsgs(error: any, source: HTMLElement, redirectOn404 = false): void {
  if (redirectOn404 && error.status === 404) {
    fireEvent(source, '404');
    return;
  }

  const errorsString = formatServerErrorAsText(error);

  showErrorAsToastMsg(errorsString, source);
}

export function showErrorAsToastMsg(errorsString: string, source: HTMLElement): void {
  if (errorsString) {
    fireEvent(source, 'toast', {text: errorsString, showCloseBtn: true});
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

export function defaultKeyTranslate(key = ''): string {
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
