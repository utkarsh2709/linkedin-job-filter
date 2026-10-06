import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/popup/App';
import { BLOCKLIST_STORAGE_KEY } from '../../src/shared/constants';
import { createCompanyStorage } from '../../src/storage/company-storage';
import { createFakeStorageArea } from '../fake-storage-area';

function renderApp(initial?: Record<string, unknown>) {
  const fake = createFakeStorageArea(initial);
  render(<App storage={createCompanyStorage(fake.area)} />);
  return fake;
}

describe('popup App', () => {
  it('shows the empty state', async () => {
    renderApp();
    expect(await screen.findByText('No companies blocked yet.')).toBeTruthy();
    expect(screen.getByText('Blocked companies (0)')).toBeTruthy();
  });

  it('lists stored companies', async () => {
    renderApp({ [BLOCKLIST_STORAGE_KEY]: [{ name: 'Google', key: 'google', addedAt: 1 }] });
    expect(await screen.findByText('Google')).toBeTruthy();
    expect(screen.getByText('Blocked companies (1)')).toBeTruthy();
  });

  it('adds a company and clears the input', async () => {
    const user = userEvent.setup();
    renderApp();
    const input = await screen.findByLabelText('Block a company');

    await user.type(input, 'Accenture{Enter}');

    expect(await screen.findByText('Accenture')).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('disables Block for blank and duplicate names', async () => {
    const user = userEvent.setup();
    renderApp({ [BLOCKLIST_STORAGE_KEY]: [{ name: 'Google', key: 'google', addedAt: 1 }] });
    const button = await screen.findByRole('button', { name: 'Block' });
    expect((button as HTMLButtonElement).disabled).toBe(true);

    await user.type(screen.getByLabelText('Block a company'), 'google llc');
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Already blocked.')).toBeTruthy();
  });

  it('removes a company', async () => {
    const user = userEvent.setup();
    renderApp({
      [BLOCKLIST_STORAGE_KEY]: [
        { name: 'Google', key: 'google', addedAt: 1 },
        { name: 'Amazon', key: 'amazon', addedAt: 2 },
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Unblock Google' }));

    const list = screen.getByRole('list');
    expect(within(list).queryByText('Google')).toBeNull();
    expect(within(list).getByText('Amazon')).toBeTruthy();
  });

  it('shows storage errors', async () => {
    const fake = renderApp();
    const user = userEvent.setup();
    await screen.findByText('No companies blocked yet.');

    fake.failNextCall(new Error('Storage unavailable'));
    await user.type(screen.getByLabelText('Block a company'), 'Google{Enter}');

    expect((await screen.findByRole('alert')).textContent).toBe('Storage unavailable');
  });
});
