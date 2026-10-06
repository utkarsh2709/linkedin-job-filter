import type { CompanyStorage } from '../storage/company-storage';
import { AddCompany } from './components/AddCompany';
import { CompanyList } from './components/CompanyList';
import { useBlocklist } from './hooks/useBlocklist';

export function App({ storage }: { storage: CompanyStorage }) {
  const { companies, loading, error, add, remove } = useBlocklist(storage);

  return (
    <main className="popup">
      <header className="header">
        <span className="header__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
          </svg>
        </span>
        <div>
          <h1>Company Filter</h1>
          <p className="header__sub">Hide jobs from companies you choose</p>
        </div>
      </header>
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
