import { useState } from 'react';
import { Moon, Sun, Thermometer } from 'lucide-react';
import { useStore } from './store';
import { HomeView } from './components/HomeView';
import { WorkingView } from './components/WorkingView';
import { SettingsDialog } from './components/SettingsDialog';
import { ClarificationDialog } from './components/ClarificationDialog';
import { TitleBar } from './components/TitleBar';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

/**
 * ThemeToggle Component
 *
 * Displays theme controls:
 * - Dark/Light mode toggle (Sun/Moon icon)
 * - Cool/Warm temperature toggle (optional)
 *
 * Usage: Place in TitleBar or corner of app
 */
function ThemeToggle() {
  const { mode, temperature, toggleMode, toggleTemperature } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Temperature Toggle - Optional */}
      <button
        onClick={toggleTemperature}
        className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-subtle)]"
        aria-label={`Switch to ${temperature === 'cool' ? 'warm' : 'cool'} temperature`}
        title={`Current: ${temperature} temperature`}
      >
        <Thermometer
          className={`w-4 h-4 transition-colors ${
            temperature === 'warm' ? 'text-[var(--accent)]' : 'text-[var(--fg-subtle)]'
          }`}
        />
      </button>

      {/* Mode Toggle */}
      <button
        onClick={toggleMode}
        className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-subtle)]"
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      >
        {mode === 'light' ? (
          <Moon className="w-4 h-4 text-[var(--fg-muted)]" />
        ) : (
          <Sun className="w-4 h-4 text-[var(--fg-muted)]" />
        )}
      </button>
    </div>
  );
}

/**
 * AppContent Component
 *
 * Main app layout - must be inside ThemeProvider to access theme context
 */
function AppContent() {
  const { viewMode, clarificationQuestion } = useStore();
  const { temperature } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={`h-screen flex flex-col bg-[var(--bg-base)] ${temperature === 'warm' ? 'bg-grid' : ''}`}>
      {/* Title bar for macOS */}
      <TitleBar onSettingsClick={() => setSettingsOpen(true)}>
        {/* Theme toggle in title bar */}
        <ThemeToggle />
      </TitleBar>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {viewMode === 'home' && <HomeView />}
        {viewMode === 'working' && <WorkingView />}
      </main>

      {/* Settings dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Plan Mode Clarification Dialog */}
      {clarificationQuestion && <ClarificationDialog />}
    </div>
  );
}

/**
 * App Root Component
 *
 * Wraps entire app with ThemeProvider
 * Supports 4 theme variants:
 * - dark-cool (default)
 * - dark-warm
 * - light-cool
 * - light-warm
 */
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
