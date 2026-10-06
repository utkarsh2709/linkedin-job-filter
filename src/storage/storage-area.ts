/**
 * The slice of chrome.storage that CompanyStorage needs, so tests can pass a fake.
 * Uses the promise-based API (Chrome 88+), which rejects on chrome.runtime.lastError.
 */
export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  onChanged: {
    addListener(listener: StorageChangeListener): void;
    removeListener(listener: StorageChangeListener): void;
  };
}

export type StorageChangeListener = (changes: Record<string, { newValue?: unknown }>) => void;

export function chromeSyncStorage(): StorageArea {
  return chrome.storage.sync;
}
