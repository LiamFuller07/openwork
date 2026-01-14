import { useState } from 'react';
import { useStore } from './store';
import { HomeView } from './components/HomeView';
import { WorkingView } from './components/WorkingView';
import { SettingsDialog } from './components/SettingsDialog';
import { TitleBar } from './components/TitleBar';

function App() {
  const { viewMode } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-cream-200 grid-background">
      {/* Title bar for macOS */}
      <TitleBar onSettingsClick={() => setSettingsOpen(true)} />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {viewMode === 'home' && <HomeView />}
        {viewMode === 'working' && <WorkingView />}
      </main>

      {/* Settings dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

export default App;
