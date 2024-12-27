import {EtoolsLogger} from './singleton/logger';

declare global {
  interface Window {
    EtoolsRequestCacheDisabled: any;
    EtoolsSharedDb: any;
  }
}
type EtoolsEndpoint = {
  url: string;
  exp?: number;
  cacheTableName?: string;
  cachingKey?: string;
  sharedDbCachingKey?: string;
  params?: any;
  bypassCache?: boolean;
};

const etoolsAjaxCacheDefaultTableName = 'ajaxDefaultDataTable';
const etoolsAjaxCacheListsExpireMapTable = 'listsExpireMapTable';
const sharedDbTableName = 'collections';

const CacheLocations = {
  EtoolsRequestCacheDb: {
    defaultDataTable: etoolsAjaxCacheDefaultTableName,
    specifiedTable: 'specifiedTable'
  },
  EtoolsSharedDb: 'EtoolsSharedDb'
};

/**
 * Get caching info for the current request
 */
function getCachingInfo(endpoint: EtoolsEndpoint) {
  return {
    url: endpoint.url,
    exp: parseInt(endpoint.exp ? endpoint.exp.toString() : '', 10), // ensure this value is integer
    cacheKey: _getEndpointCacheKey(endpoint),
    cacheTableName: _getCacheTableName(endpoint),
    sharedDbCachingKey: endpoint.sharedDbCachingKey
  };
}

function _getCacheTableName(endpoint: EtoolsEndpoint) {
  if (endpoint.cacheTableName) {
    return endpoint.cacheTableName;
  }

  if (endpoint.cachingKey) {
    return etoolsAjaxCacheDefaultTableName;
  }

  if (endpoint.sharedDbCachingKey) {
    return sharedDbTableName;
  }

  return '';
}

/**
 *
 * @param {string} method
 * @param {
 *  url: string,
 *  exp?: number,
 *  cacheTableName?: string,
 *  sharedDbCachingKey?: string,
 *  cachingKey?: string,
 * } endpoint
 */
export function requestIsCacheable(method: string | undefined, endpoint: EtoolsEndpoint) {
  if (window.EtoolsRequestCacheDisabled) {
    return false;
  }
  return (method || 'GET') === 'GET' && _expireTimeWasProvided(endpoint) && dexieDbIsConfigured(endpoint);
}

function _expireTimeWasProvided(endpoint: EtoolsEndpoint) {
  return endpoint && Object.prototype.hasOwnProperty.call(endpoint, 'exp') && endpoint.exp && endpoint.exp > 0;
}

function _getEndpointCacheKey(endpoint: EtoolsEndpoint) {
  let cacheKey = endpoint.url;
  if (_isNonEmptyString(endpoint.cachingKey)) {
    if (endpoint.cachingKey != null) {
      cacheKey = endpoint.cachingKey;
    }
  }
  if (_isNonEmptyObject(endpoint.params)) {
    cacheKey += '_' + JSON.stringify(endpoint.params);
  }
  return cacheKey;
}

function _isNonEmptyString(str: any) {
  return typeof str === 'string' && str !== '';
}

function _isNonEmptyObject(obj: any) {
  return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
}

/**
 * window.EtoolsRequestCacheDb should be instance of Dexie
 * cacheTableName and listsExpireMapTable tables should be defined
 */
function dexieDbIsConfigured(endpoint: EtoolsEndpoint) {
  if (endpoint.sharedDbCachingKey && window.EtoolsSharedDb) {
    return true;
  }
  const cacheTableName = endpoint.cacheTableName || etoolsAjaxCacheDefaultTableName;
  return (
    !!window.EtoolsRequestCacheDb &&
    window.EtoolsRequestCacheDb[etoolsAjaxCacheListsExpireMapTable] &&
    window.EtoolsRequestCacheDb[cacheTableName]
  );
}

/**
 *
 * @returns `ajaxDefaultDataTable` or `EtoolsSharedDb` or `specifiedTable`
 */
function _getCacheLocation(cachingInfo: {cacheTableName: string; sharedDbCachingKey?: string}) {
  if (cachingInfo.cacheTableName === etoolsAjaxCacheDefaultTableName) {
    return CacheLocations.EtoolsRequestCacheDb.defaultDataTable;
  } else {
    if (cachingInfo.sharedDbCachingKey) {
      return CacheLocations.EtoolsSharedDb;
    }
    return CacheLocations.EtoolsRequestCacheDb.specifiedTable;
  }
}

function _cacheEndpointDataInSharedDb(dataToCache: any) {
  return window.EtoolsSharedDb[sharedDbTableName]
    .put(dataToCache)
    .then((_: any) => {
      return dataToCache.data;
    })
    .catch((error: any) => {
      EtoolsLogger.warn('Failed to add data in EtoolsSharedDb. Data not cached.', 'etools-dexie-caching', error);
      return dataToCache.data;
    });
}

/**
 * Cache data into dexie db default table (etoolsAjaxCacheDefaultTableName)
 */
function _cacheEndpointDataUsingDefaultTable(dataToCache: any) {
  return window.EtoolsRequestCacheDb[etoolsAjaxCacheDefaultTableName]
    .put(dataToCache)
    .then((_result: any) => {
      // data added in dexie db in default table, return existing data
      return dataToCache.data;
    })
    .catch((error: any) => {
      // something happened and inserting data in dexie table failed;
      // just log the error and return the existing data(received from server)
      EtoolsLogger.warn('Failed to add data in etools-ajax dexie db. Data not cached.', 'etools-dexie-caching', error);
      return dataToCache.data;
    });
}

/**
 * Cache date into specified dexie db table (reqConfig.endpoint.cacheTableName)
 */
function _cacheEndpointDataUsingSpecifiedTable(
  responseData: any[],
  cachingInfo: {cacheTableName: string; exp: number}
) {
  const listsExpireMapTable = window.EtoolsRequestCacheDb[etoolsAjaxCacheListsExpireMapTable];
  const specifiedTable = window.EtoolsRequestCacheDb[cachingInfo.cacheTableName];
  return window.EtoolsRequestCacheDb.transaction('rw', listsExpireMapTable, specifiedTable, async () => {
    if (responseData instanceof Array === false) {
      throw new Error('Response data should be array or objects to be ' + 'able to cache it into specified table.');
    }
    // make all add actions using transaction
    // specifiedTable name and expire time for it must be added into listsExpireMapTable
    const listExpireDetails = {
      name: cachingInfo.cacheTableName,
      expire: cachingInfo.exp + Date.now()
    };
    // add list expire mapping details
    await listsExpireMapTable.put(listExpireDetails);
    // save bulk data
    await specifiedTable.clear();
    await specifiedTable.bulkAdd(responseData);
  })
    .then((_result: any) => {
      // request response saved into specified table
      // transaction succeeded
      return responseData;
    })
    .catch((error: any) => {
      // transaction failed
      // just log the error and return the existing data(received from server)
      EtoolsLogger.warn(
        'Failed to add data in etools-ajax dexie specified table: ' + cachingInfo.cacheTableName + '. Data not cached.',
        'etools-dexie-caching',
        error
      );
      return responseData;
    });
}

/**
 *
 * @param {any} responseData Data received fromm http request
 * @param {
 *  url: string,
 *  exp?: number,
 *  cacheTableName?: string,
 *  cachingKey?: string,
 *  sharedDbCachingKey?: string
 * } endpoint
 */
export function cacheEndpointResponse(responseData: any, endpoint: EtoolsEndpoint) {
  const cachingInfo = getCachingInfo(endpoint);

  switch (_getCacheLocation(cachingInfo)) {
    case CacheLocations.EtoolsRequestCacheDb.defaultDataTable: {
      const dataToCache = {
        cacheKey: cachingInfo.cacheKey,
        data: responseData,
        expire: cachingInfo.exp + Date.now()
      };
      // single object added into default dexie db table
      return _cacheEndpointDataUsingDefaultTable(dataToCache);
    }
    case CacheLocations.EtoolsRequestCacheDb.specifiedTable: {
      // array of objects bulk added into a specified table
      return _cacheEndpointDataUsingSpecifiedTable(responseData, cachingInfo);
    }
    case CacheLocations.EtoolsSharedDb: {
      const dataToCache = {
        cacheKey: cachingInfo.sharedDbCachingKey,
        data: responseData,
        expire: cachingInfo.exp + Date.now()
      };
      return _cacheEndpointDataInSharedDb(dataToCache);
    }
  }
}

function _isExpiredCachedData(dataExp: number) {
  // check if we have cached data
  const now = Date.now();
  if (dataExp && dataExp - now > 0) {
    // data did not expired
    return false;
  }
  // data expired
  return true;
}

function _getDataFromDefaultCacheTable(cacheKey: string) {
  return window.EtoolsRequestCacheDb[etoolsAjaxCacheDefaultTableName]
    .where('cacheKey')
    .equals(cacheKey)
    .toArray()
    .then((result: any) => {
      if (result.length > 0) {
        // check expired data
        if (!_isExpiredCachedData(result[0].expire)) {
          return result[0].data;
        } else {
          return Promise.reject('Expired data.');
        }
      }
      return Promise.reject('Empty collection');
    })
    .catch((error: any) => {
      EtoolsLogger.warn(
        'Failed to get data from etools-ajax dexie db default caching table.',
        'etools-dexie-caching',
        error
      );
      return Promise.reject(null);
    });
}

function _getFromSharedDb(cachingKey: string) {
  return window.EtoolsSharedDb[sharedDbTableName]
    .where('cacheKey')
    .equals(cachingKey)
    .toArray()
    .then((result: any) => {
      if (result.length > 0) {
        if (!_isExpiredCachedData(result[0].expire)) {
          return result[0].data;
        } else {
          return Promise.reject('Expired data.');
        }
      }
      return Promise.reject('Empty collection');
    })
    .catch((error: any) => {
      EtoolsLogger.warn(
        'Failed to get data from EtoolsSharedDb, table ' + sharedDbTableName + '.',
        'etools-dexie-caching',
        error
      );
      return Promise.reject(null);
    });
}

function _getDataFromSpecifiedCacheTable(cacheTableName: string) {
  const listsExpireMapTable = window.EtoolsRequestCacheDb[etoolsAjaxCacheListsExpireMapTable];
  const specifiedTable = window.EtoolsRequestCacheDb[cacheTableName];

  return listsExpireMapTable
    .where('name')
    .equals(cacheTableName)
    .toArray()
    .then((result: any) => {
      if (result.length > 0) {
        if (!_isExpiredCachedData(result[0].expire)) {
          // return table content as array
          return specifiedTable.toArray();
        } else {
          return Promise.reject('Expired data.');
        }
      }
      return Promise.reject('Empty collection.');
    })
    .catch((error: any) => {
      // table not found in list expire map, data read error, other errors
      EtoolsLogger.warn(
        'Failed to get data from etools-ajax dexie db specified table: ' + cacheTableName + '.',
        'etools-dexie-caching',
        error
      );
      return Promise.reject(null);
    });
}
/**
 * Retrives cached data from IndexeDb based on the information found on the endpoint parameter
 * @param {
 *  url: string,
 *  exp?: number,
 *  cacheTableName?: string,
 *  cachingKey?: string
 * } endpoint
 */
export function getFromCache(endpoint: EtoolsEndpoint) {
  if (endpoint.bypassCache) {
    return Promise.reject('Bypass cache requested');
  }
  const cachingInfo = getCachingInfo(endpoint);

  switch (_getCacheLocation(cachingInfo)) {
    case CacheLocations.EtoolsRequestCacheDb.defaultDataTable: {
      return _getDataFromDefaultCacheTable(cachingInfo.cacheKey);
    }
    case CacheLocations.EtoolsRequestCacheDb.specifiedTable: {
      return _getDataFromSpecifiedCacheTable(cachingInfo.cacheTableName);
    }
    case CacheLocations.EtoolsSharedDb: {
      return _getFromSharedDb(cachingInfo.sharedDbCachingKey ?? '');
    }
    default: {
      EtoolsLogger.error(
        'Could not determine cache location, in order to retrieve cached data.',
        'etools-dexie-caching'
      );
    }
  }
}

export default {
  requestIsCacheable,
  cacheEndpointResponse,
  getFromCache
};
