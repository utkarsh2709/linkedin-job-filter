import type { BlockedCompany } from '../../shared/types';

interface Props {
  company: BlockedCompany;
  onRemove: (key: string) => void;
}

export function CompanyItem({ company, onRemove }: Props) {
  return (
    <li className="company-item">
      <span className="company-item__name">{company.name}</span>
      <button type="button" className="icon-button" aria-label={`Unblock ${company.name}`} onClick={() => onRemove(company.key)}>
        ×
      </button>
    </li>
  );
}
