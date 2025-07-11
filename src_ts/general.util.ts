import isEmpty from 'lodash-es/isEmpty';
import {AnyObject} from './types/global.types';
import {EtoolsLogger} from './singleton/logger';

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

export const buildUrlQueryString = (params: AnyObject, keepFirstPage = false): string => {
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
      if (keepFirstPage || !(param === 'page' && paramValue === 1)) {
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
  if (!str) {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Both unit and displayType are used because of inconsitencies in the db.
export function getIndicatorDisplayType(indicator: any) {
  const unit = indicator ? indicator.unit : '';
  const displayType = indicator ? indicator.display_type : '';
  if (!unit) {
    return '';
  }
  let typeChar = '';
  switch (unit) {
    case 'number':
      typeChar = '#';
      break;
    case 'percentage':
      if (displayType === 'percentage') {
        typeChar = '%';
      } else if (displayType === 'ratio') {
        typeChar = '÷';
      }
      break;
    default:
      break;
  }
  return typeChar;
}

export function valueWithDefault(value: any, defaultValue?: any) {
  if (typeof defaultValue === 'undefined') {
    defaultValue = '-';
  }
  return value ? value : defaultValue;
}

export function formatIndicatorValue(displayType: string, value: any, percentize: boolean) {
  if (value == null) {
    return value;
  }

  switch (displayType) {
    case 'percentage': {
      const val = percentize ? Math.floor(value * 100) : value;
      return formatNumber(val, '-', 2, ',') + '%';
    }
    case 'ratio':
      return formatNumber(value, '-', 2, ',') + ':1';
    case 'number':
      return formatNumber(value, '-', 2, ',');
    default:
      return value;
  }
}

export function formatNumber(val: any, placeholder: any, decimals: any, thousandsPoint: any, decimalsPoint?: any) {
  placeholder = placeholder ? placeholder : '-';

  let nr: any = Number(val);
  if (isNaN(nr)) {
    return placeholder;
  }

  decimals = !isNaN(decimals) ? Number(decimals) : 2;
  nr = nr.toFixed(decimals);

  decimalsPoint = decimalsPoint ? decimalsPoint : '.';
  thousandsPoint = thousandsPoint ? thousandsPoint : '';

  if (decimalsPoint && thousandsPoint && decimalsPoint === thousandsPoint) {
    EtoolsLogger.warn('thousandsPoint and decimalsPoint should be different', 'utils-mixin');
    return nr;
  }
  const nrParts = nr.split('.');
  if (thousandsPoint) {
    const thousandsRegex = new RegExp('(\\d)(?=(\\d{3})+(?!\\d))', 'g');
    nrParts[0] = nrParts[0].replace(thousandsRegex, '$1' + thousandsPoint);
  }
  return nrParts.join(decimalsPoint);
}

export function toPercentage(value: any) {
  return value == null /* undefinded & null */ // jshint ignore:line
    ? value
    : Math.floor(value * 100) + '%';
}
