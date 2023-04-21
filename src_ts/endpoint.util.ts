import cloneDeep from 'lodash-es/cloneDeep';
import {AnyObject} from './types/global.types';

const generateUrlFromTemplate = (tmpl: string, data: AnyObject | undefined) => {
  if (!tmpl) {
    throw new Error('To generate URL from endpoint url template you need valid template string');
  }

  if (data && Object.keys(data).length > 0) {
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        const replacePattern = new RegExp('<%=' + k + '%>', 'gi');
        tmpl = tmpl.replace(replacePattern, (data as any)[k]);
      }
    }
  }

  return tmpl;
};

export function getEndpoint<T, U>(endpoint: T & {template?: string; url?: string}, data?: AnyObject): U {
  const baseSite = window.location.origin;
  const completedEndpoint = cloneDeep(endpoint);

  if (endpoint && endpoint.template) {
    completedEndpoint.url = baseSite + generateUrlFromTemplate(endpoint.template, data);
    delete completedEndpoint.template;
  } else {
    if (endpoint.url!.indexOf(baseSite) === -1) {
      completedEndpoint.url = baseSite + endpoint.url;
    }
  }

  return completedEndpoint as U;
}