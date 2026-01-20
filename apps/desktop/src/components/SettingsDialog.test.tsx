import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsDialog } from './SettingsDialog';

describe('SettingsDialog global hotkey', () => {
  beforeEach(() => {
    window.openwork = {
      ...window.openwork,
      platform: 'darwin',
      getGlobalHotkey: vi.fn(async () => 'CommandOrControl+;'),
      setGlobalHotkey: vi.fn(async () => ({
        ok: false,
        active: 'CommandOrControl+;',
        error: 'Hotkey already in use',
      })),
      resetGlobalHotkey: vi.fn(async () => ({ ok: true, active: 'CommandOrControl+;' })),
      selectDirectory: vi.fn(),
      getAppVersion: vi.fn(),
      openExternal: vi.fn(),
      storeApiKey: vi.fn(),
      getApiKey: vi.fn(),
      clearApiKey: vi.fn(),
      isDev: vi.fn(),
    };
  });

  it('renders the Global Hotkey section above AI Provider', async () => {
    render(<SettingsDialog open onOpenChange={() => {}} />);

    const hotkeyHeading = await screen.findByText('Global Hotkey');
    const providerHeading = screen.getByText('AI Provider');

    expect(
      hotkeyHeading.compareDocumentPosition(providerHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows an error when saving fails', async () => {
    render(<SettingsDialog open onOpenChange={() => {}} />);

    const [input] = await screen.findAllByLabelText('Global hotkey');
    fireEvent.change(input, { target: { value: 'CommandOrControl+;' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save hotkey' }));

    expect(await screen.findByText('Hotkey already in use')).toBeInTheDocument();
  });
});
