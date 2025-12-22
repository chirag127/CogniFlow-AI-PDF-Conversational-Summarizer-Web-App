import { DB_NAME, DB_VERSION, STORE_LOGS, STORE_BATCHES, STORE_SETTINGS, DEFAULT_SETTINGS } from '../constants';
import { AppSettings, ProcessLog, PDFBatch } from '../types';

/**
 * A singleton class to manage the IndexedDB connection.
 */
class DBManager {
  private static instance: DBManager;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase>;
  private isInitializing = false;

  private constructor() {
    this.dbPromise = this.initializeDB();
  }

  public static getInstance(): DBManager {
    if (!DBManager.instance) {
      DBManager.instance = new DBManager();
    }
    return DBManager.instance;
  }

  private initializeDB(): Promise<IDBDatabase> {
    this.isInitializing = true;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(new Error('Failed to open IndexedDB.'));
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitializing = false;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_LOGS)) {
          db.createObjectStore(STORE_LOGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BATCHES)) {
          db.createObjectStore(STORE_BATCHES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          // Use a fixed key for settings to ensure only one settings object.
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }
    if (this.isInitializing) {
      return this.dbPromise;
    }
    this.dbPromise = this.initializeDB();
    return this.dbPromise;
  }
}

const dbManager = DBManager.getInstance();

/**
 * Generic function to perform a database transaction.
 * @param storeName - The name of the object store.
 * @param mode - The transaction mode ('readonly' or 'readwrite').
 * @param action - A callback function that performs the DB operation.
 */
async function performTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await dbManager.getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);

    transaction.oncomplete = () => {
      // For 'put' or 'delete', request.result is undefined, so we resolve a generic success.
      // For 'get' or 'getAll', the result is handled in onsuccess.
      if (mode === 'readwrite') {
        resolve(true as any);
      }
    };
    transaction.onerror = () => reject(transaction.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// --- Settings Management ---
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const stored = await performTransaction<any>(STORE_SETTINGS, 'readonly', store => store.get('default'));
    return stored ? { ...DEFAULT_SETTINGS, ...stored.value } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error("Failed to load settings from IndexedDB, falling back to defaults.", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): Promise<void> => {
  return performTransaction(STORE_SETTINGS, 'readwrite', store => store.put({ key: 'default', value: settings }));
};

// --- Log Management ---
export const addLog = (log: ProcessLog): Promise<void> => {
  return performTransaction(STORE_LOGS, 'readwrite', store => store.put(log));
};

export const getLogs = async (): Promise<ProcessLog[]> => {
  const logs = await performTransaction<ProcessLog[]>(STORE_LOGS, 'readonly', store => store.getAll());
  // Sort logs descending by timestamp
  return logs.sort((a, b) => b.timestamp - a.timestamp);
};

// --- Batch Management ---
export const saveBatch = (batch: PDFBatch): Promise<void> => {
  return performTransaction(STORE_BATCHES, 'readwrite', store => store.put(batch));
};

export const getBatches = async (): Promise<PDFBatch[]> => {
    const batches = await performTransaction<PDFBatch[]>(STORE_BATCHES, 'readonly', store => store.getAll());
    return batches.sort((a, b) => a.id - b.id);
};

// --- Data Clearing ---
export const clearAllData = async (): Promise<void> => {
  const db = await dbManager.getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LOGS, STORE_BATCHES, STORE_SETTINGS], 'readwrite');
    transaction.objectStore(STORE_LOGS).clear();
    transaction.objectStore(STORE_BATCHES).clear();
    transaction.objectStore(STORE_SETTINGS).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
