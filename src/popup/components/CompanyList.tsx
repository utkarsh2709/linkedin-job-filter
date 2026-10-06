import type { BlockedCompany } from '../../shared/types';
import { CompanyItem } from './CompanyItem';

interface Props {
  companies: readonly BlockedCompany[];
  onRemove: (key: string) => void;
}

export function CompanyList({ companies, onRemove }: Props) {
  return (
    <section className="company-list">
      <h2>Blocked companies ({companies.length})</h2>
      {companies.length === 0 ? (
        <p className="muted">No companies blocked yet.</p>
      ) : (
        <ul>
          {companies.map((company) => (
            <CompanyItem key={company.key} company={company} onRemove={onRemove} />
          ))}
        </ul>
      )}
    </section>
  );
}
