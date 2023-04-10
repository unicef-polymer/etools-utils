/**
 * Compare arrays.
 * base array can be an array of values or an array of objects (if objects use basePropertyToVerify for matches)
 */

import {EtoolsLogger} from './singleton/logger';
import {AnyObject} from './types/global.types';

export function getArraysDiff(base: any[], valuesToVerify: any[], basePropertyToVerify?: string) {
  try {
    if (base instanceof Array === false || valuesToVerify instanceof Array === false) {
      // both method arguments have to be arrays
      throw new Error('Only array arguments accepted');
    }

    if (base.length === 0) {
      return valuesToVerify;
    }
    if (valuesToVerify.length === 0) {
      if (basePropertyToVerify) {
        return getArrayFromObjsProp(base, basePropertyToVerify);
      }
      return base;
    }

    let diffVals: any[] = [];
    const valuesToCheck = JSON.parse(JSON.stringify(valuesToVerify));
    base.forEach(function (arrayVal) {
      const valToSearch = basePropertyToVerify ? arrayVal[basePropertyToVerify] : arrayVal;
      const searchedIdx = valuesToCheck.indexOf(valToSearch);
      if (searchedIdx === -1) {
        diffVals.push(valToSearch);
      } else {
        valuesToCheck.splice(searchedIdx, 1);
      }
    });
    if (valuesToCheck.length) {
      // if base values were checked and there are still valuesToVerify values left unchecked
      diffVals = diffVals.concat(valuesToCheck);
    }

    return diffVals;
  } catch (err) {
    EtoolsLogger.error('ArrayHelper.getArraysDiff error occurred', 'array-helper-mixin', err);
  }
  return [];
}

/**
 * get an array of objects and return an array a property values
 */
function getArrayFromObjsProp(arr: any[], prop: string) {
  if (arr.length === 0) {
    return [];
  }
  return arr.map(function (a) {
    return a[prop];
  });
}

export function mergeAndSortItems(existingItems: AnyObject[], newItems?: AnyObject[]) {
  return [
    ...(existingItems || []),
    ...(newItems || []).filter((newItem) => !existingItems.some((x) => x.id === newItem.id))
  ].sort((a, b) => a.name.localeCompare(b.name));
}

export function reverseNestedArray(arr: any[]): any[] {
  if (arr[0] && !Array.isArray(arr[0][0])) {
    return arr.map((point: []) => {
      return point.reverse();
    });
  } else {
    arr.map((subArr: []) => reverseNestedArray(subArr));
  }
  return arr;
}
