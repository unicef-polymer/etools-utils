import isEmpty from 'lodash-es/isEmpty';
import {AnyObject} from './types/global.types';

export const copy = (a: any) => {
  return JSON.parse(JSON.stringify(a));
};

export const cloneDeep = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

let unique = 1;
export function getUniqueId() {
  return `id-${unique++}`;
}

export const getFileNameFromURL = (url?: string) => {
  if (!url) {
    return '';
  }
  // @ts-ignore
  return url.split('?').shift().split('/').pop();
};

export const filterByIds = <T>(allOptions: T[], givenIds: string[]): T[] => {
  if (isEmpty(allOptions) || isEmpty(givenIds)) {
    return [];
  }

  const intGivenIds = givenIds.map((id: string) => Number(id));
  const options = allOptions.filter((opt: any) => {
    return intGivenIds.includes(Number(opt.id));
  });

  return options;
};

export const buildUrlQueryString = (params: AnyObject, excludeFirstPage = true): string => {
  const queryParams = [];

  for (const param in params) {
    if (!params[param]) {
      continue;
    }
    const paramValue = params[param];
    let filterUrlValue;

    if (paramValue instanceof Array) {
      if (paramValue.length > 0) {
        filterUrlValue = paramValue.join(',');
      }
    } else if (typeof paramValue === 'boolean') {
      if (paramValue) {
        // ignore if it's false
        filterUrlValue = 'true';
      }
    } else {
      if (!excludeFirstPage || !(param === 'page' && paramValue === 1)) {
        // do not include page if page=1
        filterUrlValue = String(paramValue).trim();
      }
    }

    if (filterUrlValue) {
      queryParams.push(param + '=' + filterUrlValue);
    }
  }

  return queryParams.join('&');
};

export function decimalFractionEquals0(val: string) {
  return val.lastIndexOf('.') > 0 && Number(val.substring(val.lastIndexOf('.') + 1)) === 0;
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
