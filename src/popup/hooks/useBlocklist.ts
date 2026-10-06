import { useCallback, useEffect, useState } from 'react';
import type { BlockedCompany } from '../../shared/types';
import type { CompanyStorage } from '../../storage/company-storage';

export function useBlocklist(storage: CompanyStorage) {
  const [companies, setCompanies] = useState<BlockedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    storage
      .getCompanies()
      .then((list) => active && setCompanies(list))
      .catch((err: unknown) => active && setError(messageOf(err)))
      .finally(() => active && setLoading(false));
    const unsubscribe = storage.subscribe(setCompanies);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [storage]);

  const run = useCallback(async (action: () => Promise<BlockedCompany[]>): Promise<boolean> => {
    try {
      setCompanies(await action());
      setError(null);
      return true;
    } catch (err) {
      setError(messageOf(err));
      return false;
    }
  }, []);

  const add = useCallback((name: string) => run(() => storage.addCompany(name)), [run, storage]);
  const remove = useCallback((key: string) => run(() => storage.removeCompany(key)), [run, storage]);

  return { companies, loading, error, add, remove };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.';
}
