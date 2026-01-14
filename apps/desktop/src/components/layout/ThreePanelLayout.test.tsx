import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThreePanelLayout } from './ThreePanelLayout';
import { MessageSquare, Sidebar } from 'lucide-react';

/**
 * Unit tests for ThreePanelLayout component
 *
 * Test coverage:
 * - Panel rendering (left/center/right)
 * - Collapse/expand functionality
 * - Keyboard shortcuts
 * - localStorage persistence
 * - Responsive behavior
 * - Accessibility (ARIA attributes)
 */

describe('ThreePanelLayout', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders center panel (required)', () => {
    render(
      <ThreePanelLayout
        centerPanel={<div data-testid="center">Center Content</div>}
      />
    );

    expect(screen.getByTestId('center')).toBeInTheDocument();
    expect(screen.getByText('Center Content')).toBeInTheDocument();
  });

  it('renders all three panels when provided', () => {
    render(
      <ThreePanelLayout
        leftPanel={<div data-testid="left">Left Panel</div>}
        centerPanel={<div data-testid="center">Center Panel</div>}
        rightPanel={<div data-testid="right">Right Panel</div>}
      />
    );

    expect(screen.getByTestId('left')).toBeInTheDocument();
    expect(screen.getByTestId('center')).toBeInTheDocument();
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('displays panel titles and icons', () => {
    render(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        rightPanel={<div>Right</div>}
        leftTitle="Chat"
        rightTitle="Context"
        leftIcon={<MessageSquare data-testid="left-icon" />}
        rightIcon={<Sidebar data-testid="right-icon" />}
      />
    );

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('collapses left panel when toggle button is clicked', async () => {
    const onCollapse = vi.fn();

    render(
      <ThreePanelLayout
        leftPanel={<div>Left Content</div>}
        centerPanel={<div>Center</div>}
        leftTitle="Left Panel"
        onLeftCollapseChange={onCollapse}
      />
    );

    // Find and click the collapse button
    const collapseButton = screen.getByLabelText(/collapse left panel/i);
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(onCollapse).toHaveBeenCalledWith(true);
    });
  });

  it('collapses right panel when toggle button is clicked', async () => {
    const onCollapse = vi.fn();

    render(
      <ThreePanelLayout
        centerPanel={<div>Center</div>}
        rightPanel={<div>Right Content</div>}
        rightTitle="Right Panel"
        onRightCollapseChange={onCollapse}
      />
    );

    const collapseButton = screen.getByLabelText(/collapse right panel/i);
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(onCollapse).toHaveBeenCalledWith(true);
    });
  });

  it('toggles left panel with [ keyboard shortcut', async () => {
    const onCollapse = vi.fn();

    render(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        onLeftCollapseChange={onCollapse}
      />
    );

    // Press '[' key
    fireEvent.keyDown(window, { key: '[' });

    await waitFor(() => {
      expect(onCollapse).toHaveBeenCalledWith(true);
    });
  });

  it('toggles right panel with ] keyboard shortcut', async () => {
    const onCollapse = vi.fn();

    render(
      <ThreePanelLayout
        centerPanel={<div>Center</div>}
        rightPanel={<div>Right</div>}
        onRightCollapseChange={onCollapse}
      />
    );

    // Press ']' key
    fireEvent.keyDown(window, { key: ']' });

    await waitFor(() => {
      expect(onCollapse).toHaveBeenCalledWith(true);
    });
  });

  it('does not trigger keyboard shortcuts when typing in input', () => {
    const onCollapse = vi.fn();

    render(
      <div>
        <input data-testid="test-input" />
        <ThreePanelLayout
          leftPanel={<div>Left</div>}
          centerPanel={<div>Center</div>}
          onLeftCollapseChange={onCollapse}
        />
      </div>
    );

    const input = screen.getByTestId('test-input');
    input.focus();
    fireEvent.keyDown(input, { key: '[' });

    expect(onCollapse).not.toHaveBeenCalled();
  });

  it('persists collapse state to localStorage', async () => {
    const { rerender } = render(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        layoutId="test-layout"
      />
    );

    // Collapse the panel
    const collapseButton = screen.getByLabelText(/collapse left panel/i);
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(localStorageMock.getItem('threePanelLayout-test-layout-left')).toBe(
        'true'
      );
    });

    // Remount component - should restore collapsed state
    rerender(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        layoutId="test-layout"
      />
    );

    // Button should show "expand" state
    expect(screen.getByLabelText(/expand left panel/i)).toBeInTheDocument();
  });

  it('uses default collapsed state when no localStorage value', () => {
    render(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        defaultLeftCollapsed={true}
      />
    );

    // Should show expand button (since it's collapsed by default)
    expect(screen.getByLabelText(/expand left panel/i)).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        rightPanel={<div>Right</div>}
        leftTitle="Chat"
        rightTitle="Context"
      />
    );

    const leftButton = screen.getByLabelText(/collapse chat/i);
    const rightButton = screen.getByLabelText(/collapse context/i);

    expect(leftButton).toHaveAttribute('aria-expanded', 'true');
    expect(rightButton).toHaveAttribute('aria-expanded', 'true');

    // Check that keyboard shortcuts are mentioned in aria-label
    expect(leftButton.getAttribute('aria-label')).toContain('[');
    expect(rightButton.getAttribute('aria-label')).toContain(']');
  });

  it('includes screen reader announcement region', () => {
    render(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
      />
    );

    const announcer = screen.getByRole('status');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
  });

  it('handles missing optional panels gracefully', () => {
    // Only center panel
    const { container } = render(
      <ThreePanelLayout centerPanel={<div>Center Only</div>} />
    );

    expect(screen.getByText('Center Only')).toBeInTheDocument();
    expect(container.querySelectorAll('button')).toHaveLength(0); // No collapse buttons
  });

  it('respects custom layoutId for localStorage keys', () => {
    render(
      <ThreePanelLayout
        leftPanel={<div>Left</div>}
        centerPanel={<div>Center</div>}
        layoutId="custom-workspace"
      />
    );

    const collapseButton = screen.getByLabelText(/collapse left panel/i);
    fireEvent.click(collapseButton);

    expect(
      localStorageMock.getItem('threePanelLayout-custom-workspace-left')
    ).toBe('true');
  });
});

/**
 * TESTING BEST PRACTICES:
 *
 * 1. Test user interactions (clicks, keyboard)
 * 2. Verify accessibility (ARIA, screen readers)
 * 3. Check state persistence (localStorage)
 * 4. Test edge cases (missing panels, focused inputs)
 * 5. Validate responsive behavior (manual/E2E tests)
 *
 * TODO: Add E2E tests for:
 * - Responsive breakpoints
 * - Animation smoothness
 * - Focus management
 * - Cross-browser compatibility
 */
