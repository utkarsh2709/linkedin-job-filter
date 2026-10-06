// Multi-word suffixes come first so "pvt ltd" is stripped as a unit, not just "ltd".
const LEGAL_SUFFIXES = [
  'private limited',
  'pvt ltd',
  'pty ltd',
  'corporation',
  'limited',
  'gmbh',
  'corp',
  'inc',
  'llc',
  'llp',
  'ltd',
  'plc',
  'co',
  'ag',
  'sa',
  'bv',
  'nv',
];

const SUFFIX_PATTERN = new RegExp(`\\s(?:${LEGAL_SUFFIXES.join('|')})$`);

/**
 * Canonical form of a company name for exact matching:
 * "  Google, LLC. " → "google", "AT&T Inc." → "at and t", "Société Générale" → "societe generale".
 *
 * Only one trailing legal suffix is removed, and never if it is the whole name.
 */
export function normalizeCompanyName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.,'’"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stripped = base.replace(SUFFIX_PATTERN, '').trim();
  return stripped || base;
}
