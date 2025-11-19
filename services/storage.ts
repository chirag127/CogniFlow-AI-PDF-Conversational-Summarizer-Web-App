import { DB_NAME, DB_VERSION, STORE_LOGS, STORE_FILES, STORE_BATCHES, DEFAULT_SETTINGS } from '../constants';
import { AppSettings, ProcessLog, PDFBatch } from '../types';

// LocalStorage for Settings
export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem('spokable_settings');
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }; // Merge to ensure new keys exist
  } catch (e) {
    console.error("Failed to load settings", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem('spokable_settings', JSON.stringify(settings));
};

export const clearAllData = async () => {
    localStorage.removeItem('spokable_settings');
    const db = await openDB();
    const tx = db.transaction([STORE_LOGS, STORE_FILES, STORE_BATCHES], 'readwrite');
    tx.objectStore(STORE_LOGS).clear();
    tx.objectStore(STORE_FILES).clear();
    tx.objectStore(STORE_BATCHES).clear();
    return new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
    });
};

// IndexedDB Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        db.createObjectStore(STORE_LOGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(STORE_BATCHES)) {
        db.createObjectStore(STORE_BATCHES, { keyPath: 'id' });
      }
    };
  });
};

export const addLog = async (log: ProcessLog) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, 'readwrite');
    tx.objectStore(STORE_LOGS).put(log);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getLogs = async (): Promise<ProcessLog[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, 'readonly');
    const request = tx.objectStore(STORE_LOGS).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
    request.onerror = () => reject(request.error);
  });
};

export const saveBatch = async (batch: PDFBatch) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BATCHES, 'readwrite');
    tx.objectStore(STORE_BATCHES).put(batch);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getBatches = async (): Promise<PDFBatch[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BATCHES, 'readonly');
      const request = tx.objectStore(STORE_BATCHES).getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => a.id - b.id));
      request.onerror = () => reject(request.error);
    });
};