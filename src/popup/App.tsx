import type { CompanyStorage } from '../storage/company-storage';
import { AddCompany } from './components/AddCompany';
import { CompanyList } from './components/CompanyList';
import { useBlocklist } from './hooks/useBlocklist';

export function App({ storage }: { storage: CompanyStorage }) {
  const { companies, loading, error, add, remove } = useBlocklist(storage);

  return (
    <main className="popup">
      <h1>LinkedIn Company Filter</h1>
      <AddCompany existingKeys={companies.map((company) => company.key)} onAdd={add} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? <p className="muted">Loading…</p> : <CompanyList companies={companies} onRemove={remove} />}
    </main>
  );
}
