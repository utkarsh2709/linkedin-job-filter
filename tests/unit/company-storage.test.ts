import { describe, expect, it, vi } from 'vitest';
import { BLOCKLIST_STORAGE_KEY } from '../../src/shared/constants';
import { createCompanyStorage, InvalidCompanyNameError } from '../../src/storage/company-storage';
import { createFakeStorageArea } from '../fake-storage-area';

function setup(initial?: Record<string, unknown>) {
  const fake = createFakeStorageArea(initial);
  return { ...fake, storage: createCompanyStorage(fake.area) };
}

describe('CompanyStorage', () => {
  it('starts empty', async () => {
    const { storage } = setup();
    expect(await storage.getCompanies()).toEqual([]);
  });

  it('adds a company under a single namespaced key', async () => {
    const { storage, data } = setup();
    const list = await storage.addCompany('  Google   LLC ');

    expect(list).toEqual([{ name: 'Google LLC', key: 'google', addedAt: expect.any(Number) }]);
    expect(Object.keys(data)).toEqual([BLOCKLIST_STORAGE_KEY]);
    expect(await storage.getCompanies()).toEqual(list);
  });

  it('ignores duplicates by normalized name and keeps the original display name', async () => {
    const { storage } = setup();
    await storage.addCompany('Google');
    const list = await storage.addCompany('GOOGLE, LLC');
    expect(list.map((company) => company.name)).toEqual(['Google']);
  });

  it('rejects empty and over-long names', async () => {
    const { storage } = setup();
    await expect(storage.addCompany('   ')).rejects.toBeInstanceOf(InvalidCompanyNameError);
    await expect(storage.addCompany('x'.repeat(201))).rejects.toBeInstanceOf(InvalidCompanyNameError);
  });

  it('removes a company by key', async () => {
    const { storage } = setup();
    await storage.addCompany('Google');
    await storage.addCompany('Amazon');
    const list = await storage.removeCompany('google');
    expect(list.map((company) => company.name)).toEqual(['Amazon']);
  });

  it('treats removing an unknown key as a no-op', async () => {
    const { storage, area } = setup();
    await storage.addCompany('Google');
    const set = vi.spyOn(area, 'set');
    expect(await storage.removeCompany('nope')).toHaveLength(1);
    expect(set).not.toHaveBeenCalled();
  });

  it('checks membership by normalized name', async () => {
    const { storage } = setup();
    await storage.addCompany('Google');
    expect(await storage.hasCompany('google llc')).toBe(true);
    expect(await storage.hasCompany('Microsoft')).toBe(false);
  });

  it('drops malformed stored entries', async () => {
    const { storage } = setup({
      [BLOCKLIST_STORAGE_KEY]: [
        { name: 'Google', key: 'google', addedAt: 1 },
        { name: 'Broken' },
        'junk',
        null,
        { name: 'Empty', key: '', addedAt: 1 },
      ],
    });
    expect((await storage.getCompanies()).map((company) => company.name)).toEqual(['Google']);
  });

  it('treats a non-array stored value as empty', async () => {
    const { storage } = setup({ [BLOCKLIST_STORAGE_KEY]: 'corrupted' });
    expect(await storage.getCompanies()).toEqual([]);
  });

  it('propagates storage errors', async () => {
    const { storage, failNextCall } = setup();
    failNextCall(new Error('QUOTA_BYTES_PER_ITEM quota exceeded'));
    await expect(storage.getCompanies()).rejects.toThrow('quota');
  });

  it('notifies subscribers of changes and supports unsubscribing', async () => {
    const { storage, listenerCount } = setup();
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    await storage.addCompany('Google');
    expect(listener).toHaveBeenLastCalledWith([expect.objectContaining({ key: 'google' })]);

    unsubscribe();
    expect(listenerCount()).toBe(0);
  });

  it('ignores changes to other keys', async () => {
    const { storage, area } = setup();
    const listener = vi.fn();
    storage.subscribe(listener);
    await area.set({ somethingElse: 1 });
    expect(listener).not.toHaveBeenCalled();
  });
});
