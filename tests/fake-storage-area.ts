import type { StorageArea, StorageChangeListener } from '../src/storage/storage-area';

/** In-memory stand-in for chrome.storage.sync, including onChanged. */
export function createFakeStorageArea(initial: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = structuredClone(initial);
  const listeners = new Set<StorageChangeListener>();
  let failNext: Error | null = null;

  const area: StorageArea = {
    async get(key) {
      if (failNext) throw takeFailure();
      return key in data ? { [key]: structuredClone(data[key]) } : {};
    },
    async set(items) {
      if (failNext) throw takeFailure();
      const changes: Record<string, { newValue?: unknown }> = {};
      for (const [key, value] of Object.entries(items)) {
        data[key] = structuredClone(value);
        changes[key] = { newValue: structuredClone(value) };
      }
      listeners.forEach((listener) => listener(changes));
    },
    onChanged: {
      addListener: (listener) => void listeners.add(listener),
      removeListener: (listener) => void listeners.delete(listener),
    },
  };

  function takeFailure(): Error {
    const error = failNext!;
    failNext = null;
    return error;
  }

  return {
    area,
    data,
    listenerCount: () => listeners.size,
    failNextCall: (error: Error) => {
      failNext = error;
    },
  };
}
