import { describe, expect, it } from 'vitest';
import { normalizeCompanyName } from '../../src/shared/normalize';

describe('normalizeCompanyName', () => {
  it.each([
    ['Google', 'google'],
    ['  google  ', 'google'],
    ['GOOGLE', 'google'],
    ['Google LLC', 'google'],
    ['Google, LLC.', 'google'],
    ['Tata Consultancy Services', 'tata consultancy services'],
    ['Infosys Pvt. Ltd.', 'infosys'],
    ['Infosys Private Limited', 'infosys'],
    ['Accenture plc', 'accenture'],
    ['Siemens AG', 'siemens'],
    ['AT&T', 'at and t'],
    ['Procter & Gamble Co.', 'procter and gamble'],
    ['Société Générale', 'societe generale'],
    ["McDonald's", 'mcdonald s'],
    ['Multiple   inner\tspaces', 'multiple inner spaces'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeCompanyName(input)).toBe(expected);
  });

  it('strips only one trailing legal suffix', () => {
    expect(normalizeCompanyName('Acme Co Inc')).toBe('acme co');
  });

  it('does not strip a suffix that is the whole name', () => {
    expect(normalizeCompanyName('Inc')).toBe('inc');
    expect(normalizeCompanyName('Co.')).toBe('co');
  });

  it('does not strip suffix-like text inside words', () => {
    expect(normalizeCompanyName('Cisco')).toBe('cisco');
    expect(normalizeCompanyName('Visa')).toBe('visa');
  });

  it('keeps distinct companies distinct', () => {
    expect(normalizeCompanyName('Apple')).not.toBe(normalizeCompanyName('Apple Hospitality REIT'));
  });

  it('returns empty string for blank input', () => {
    expect(normalizeCompanyName('   ')).toBe('');
  });
});
