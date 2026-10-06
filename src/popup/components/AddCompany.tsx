import { useState, type FormEvent } from 'react';
import { normalizeCompanyName } from '../../shared/normalize';

interface Props {
  existingKeys: readonly string[];
  onAdd: (name: string) => Promise<boolean>;
}

export function AddCompany({ existingKeys, onAdd }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const key = normalizeCompanyName(name);
  const isDuplicate = key !== '' && existingKeys.includes(key);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!key || isDuplicate) return;
    setBusy(true);
    if (await onAdd(name)) setName('');
    setBusy(false);
  }

  return (
    <form className="add-company" onSubmit={handleSubmit}>
      <label htmlFor="company-name">Block a company</label>
      <div className="add-company__row">
        <input
          id="company-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Accenture"
          autoComplete="off"
          autoFocus
        />
        <button type="submit" disabled={!key || isDuplicate || busy}>
          Block
        </button>
      </div>
      {isDuplicate && <p className="muted">Already blocked.</p>}
    </form>
  );
}
