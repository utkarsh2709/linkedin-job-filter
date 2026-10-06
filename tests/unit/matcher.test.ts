import { describe, expect, it } from 'vitest';
import { createMatcher, isBlockedCompany } from '../../src/shared/matcher';
import { normalizeCompanyName } from '../../src/shared/normalize';
import type { BlockedCompany } from '../../src/shared/types';

const block = (...names: string[]): BlockedCompany[] =>
  names.map((name) => ({ name, key: normalizeCompanyName(name), addedAt: 0 }));

describe('createMatcher', () => {
  const matches = createMatcher(block('Google', 'Tata Consultancy Services'));

  it('matches regardless of case, spacing and legal suffix', () => {
    expect(matches({ company: 'Google' })).toBe(true);
    expect(matches({ company: ' GOOGLE ' })).toBe(true);
    expect(matches({ company: 'Google LLC' })).toBe(true);
    expect(matches({ company: 'Tata Consultancy Services Limited' })).toBe(true);
  });

  it('does not match on substrings', () => {
    expect(matches({ company: 'Google Cloud' })).toBe(false);
    expect(matches({ company: 'Goog' })).toBe(false);
  });

  it('does not match unrelated companies', () => {
    expect(matches({ company: 'Microsoft' })).toBe(false);
  });

  it('matches nothing with an empty blocklist', () => {
    expect(createMatcher([])({ company: 'Google' })).toBe(false);
  });
});

describe('isBlockedCompany', () => {
  it('checks a single company name', () => {
    expect(isBlockedCompany('Google', block('google'))).toBe(true);
    expect(isBlockedCompany('Apple Music', block('Apple'))).toBe(false);
  });
});
