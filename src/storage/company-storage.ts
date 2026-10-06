import { BLOCKLIST_STORAGE_KEY, MAX_COMPANY_NAME_LENGTH } from '../shared/constants';
import { normalizeCompanyName } from '../shared/normalize';
import type { BlockedCompany } from '../shared/types';
import { chromeSyncStorage, type StorageArea, type StorageChangeListener } from './storage-area';

export interface CompanyStorage {
  getCompanies(): Promise<BlockedCompany[]>;
  /** Returns the updated list; adding a duplicate (by normalized key) is a no-op. */
  addCompany(name: string): Promise<BlockedCompany[]>;
  removeCompany(key: string): Promise<BlockedCompany[]>;
  hasCompany(name: string): Promise<boolean>;
  /** Called with the new list whenever it changes in any context. Returns an unsubscribe function. */
  subscribe(listener: (companies: BlockedCompany[]) => void): () => void;
}

export class InvalidCompanyNameError extends Error {}

export function createCompanyStorage(area: StorageArea = chromeSyncStorage()): CompanyStorage {
  async function read(): Promise<BlockedCompany[]> {
    const items = await area.get(BLOCKLIST_STORAGE_KEY);
    return parseBlocklist(items[BLOCKLIST_STORAGE_KEY]);
  }

  async function write(companies: BlockedCompany[]): Promise<BlockedCompany[]> {
    await area.set({ [BLOCKLIST_STORAGE_KEY]: companies });
    return companies;
  }

  return {
    getCompanies: read,

    async addCompany(name) {
      const trimmed = name.replace(/\s+/g, ' ').trim();
      const key = normalizeCompanyName(trimmed);
      if (!key) throw new InvalidCompanyNameError('Company name is empty.');
      if (trimmed.length > MAX_COMPANY_NAME_LENGTH) {
        throw new InvalidCompanyNameError(`Company name is longer than ${MAX_COMPANY_NAME_LENGTH} characters.`);
      }

      const companies = await read();
      if (companies.some((company) => company.key === key)) return companies;
      return write([...companies, { name: trimmed, key, addedAt: Date.now() }]);
    },

    async removeCompany(key) {
      const companies = await read();
      const remaining = companies.filter((company) => company.key !== key);
      return remaining.length === companies.length ? companies : write(remaining);
    },

    async hasCompany(name) {
      const key = normalizeCompanyName(name);
      return (await read()).some((company) => company.key === key);
    },

    subscribe(listener) {
      const onChanged: StorageChangeListener = (changes) => {
        const change = changes[BLOCKLIST_STORAGE_KEY];
        if (change) listener(parseBlocklist(change.newValue));
      };
      area.onChanged.addListener(onChanged);
      return () => area.onChanged.removeListener(onChanged);
    },
  };
}

/** Tolerates missing or malformed stored data instead of breaking the extension. */
function parseBlocklist(value: unknown): BlockedCompany[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is BlockedCompany =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      typeof item.key === 'string' &&
      item.key !== '' &&
      typeof item.addedAt === 'number',
  );
}
