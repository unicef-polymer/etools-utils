import Dexie from 'dexie';
import {EtoolsLogger} from './logger';

// Singleton
class DexieRefreshClass {
  private static _instance: DexieRefreshClass;

  dexieDbsNumber: number;
  dbsAttemptedToDelete: string[];
  refreshInProgress: boolean;

  constructor() {
    this.dexieDbsNumber = 0;
    this.dbsAttemptedToDelete = [];
    this.refreshInProgress = false;
  }

  public static getInstance(): DexieRefreshClass {
    if (!DexieRefreshClass._instance) {
      DexieRefreshClass._instance = new DexieRefreshClass();
    }
    return DexieRefreshClass._instance;
  }

  refresh() {
    if (!Dexie) {
      // eslint-disable-line
      EtoolsLogger.error('Dexie not imported', 'etools-page-refresh-mixin');
    }

    this.refreshInProgress = true;
    // **Important : Do not clear localStorage before Dexie db ,
    // because for Firefox, IE, Edge and Safari, Dexie stores the db names
    // in the localStorage under the key Dexie.DatabaseNames
    // and method Dexie.getDabasesNames searches for this key
    // clear DexieDBs for current host then clear local storage and refresh the page
    this.clearDexieDbs();
  }

  clearLocalStorage() {
    localStorage.clear();
  }

  clearDexieDbs() {
    // except Chrome and Opera this method will delete only the dbs created with Dexie
    // eslint-disable-next-line no-undef
    Dexie.getDatabaseNames((dbsNames: any[]) => {
      this.dexieDbsNumber = dbsNames.length;
      if (this.dexieDbsNumber > 0) {
        dbsNames.forEach((dbName) => {
          this.deleteDexieDb(dbName);
        });
      }
    });
  }

  deleteDexieDb(dbName: string) {
    // eslint-disable-next-line no-undef
    const db = new Dexie(dbName);
    let finished = false;
    db.delete()
      .catch((err: any) => {
        EtoolsLogger.error('Could not delete indexedDB: ' + dbName, 'etools-page-refresh-mixin', err);
      })
      .finally(() => {
        this.dbsAttemptedToDelete.push(dbName);
        this._triggerPageRefresh();
        finished = true;
      });
    // TODO: find a better solution for this timeout
    // *In Edge - catch and finally of db.delete() are not executed,
    //            when the site is opened in more than one tab
    setTimeout(() => {
      if (!finished) {
        alert('Please close any other tabs, that have this page open, for the Refresh to work properly.');
      }
    }, 9000);
  }

  _refreshPage() {
    this.refreshInProgress = false;
    window.location.reload();
  }

  _triggerPageRefresh() {
    if (this.refreshInProgress) {
      let doRefresh = false;
      if (this.dexieDbsNumber > 0) {
        if (this.dbsAttemptedToDelete.length === this.dexieDbsNumber) {
          this.clearLocalStorage();
          doRefresh = true;
        }
      } else {
        this.clearLocalStorage();
        doRefresh = true;
      }
      if (doRefresh) {
        this._refreshPage();
      }
    }
  }
}

export const DexieRefresh = DexieRefreshClass.getInstance();
