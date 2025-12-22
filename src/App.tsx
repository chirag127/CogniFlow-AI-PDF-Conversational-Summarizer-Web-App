import React, { useState, useEffect, useCallback } from 'react';
import { Settings, FileText, Trash2 } from 'lucide-react';
import { AppSettings, ProcessLog } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { getSettings, saveSettings, getLogs, clearAllData } from './services/storage';
import SettingsPanel from './components/SettingsPanel';
import LogViewer from './components/LogViewer';
import JobOrchestrator from './components/JobOrchestrator';

/**
 * Main application component. Manages settings, logs, and UI layout.
 */
const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [logs, setLogs] = useState<ProcessLog[]>([]);

  /**
   * Fetches the latest logs from storage and updates the state.
   */
  const refreshLogs = useCallback(async () => {
    const currentLogs = await getLogs();
    setLogs(currentLogs);
  }, []);

  // Load initial settings and logs from storage
  useEffect(() => {
    const loadInitialData = async () => {
      const settings = await getSettings();
      setSettings(settings);
      refreshLogs();
    };
    loadInitialData();
  }, [refreshLogs]);

  /**
   * Handles saving updated settings and persists them to storage.
   * @param updatedSettings The new settings object.
   */
  const handleSettingsUpdate = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  /**
   * Prompts the user and, if confirmed, clears all application data.
   */
  const handleReset = async () => {
    if (window.confirm("Are you sure you want to erase all data, logs, and settings? This action cannot be undone.")) {
      try {
        await clearAllData();
        window.location.reload();
      } catch (error) {
        console.error("Failed to clear all data:", error);
        alert("There was an error while trying to clear the data. Please check the console for more details.");
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-dark text-slate-300">
      {/* Sidebar */}
      <Sidebar onShowSettings={() => setShowSettings(true)} onReset={handleReset} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {showSettings && (
          <div className="absolute inset-0 z-50">
            <SettingsPanel
              settings={settings}
              updateSettings={handleSettingsUpdate}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <JobOrchestrator settings={settings} refreshLogs={refreshLogs} />
          <LogViewer logs={logs} />
        </main>
      </div>
    </div>
  );
};

/**
 * Sidebar component for navigation and application-level actions.
 */
const Sidebar: React.FC<{ onShowSettings: () => void; onReset: () => void }> = ({ onShowSettings, onReset }) => {
  return (
    <aside className="w-64 bg-dark border-r border-slate-800 flex flex-col p-4">
      <header className="mb-8">
        <h1 className="text-xl font-bold text-blue-500 leading-tight">CogniFlow AI</h1>
        <p className="text-xs text-slate-500 mt-1">PDF Conversation & Summarizer</p>
      </header>

      <nav className="flex-1 space-y-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded bg-slate-800 text-white cursor-default">
          <FileText size={18} /> Dashboard
        </button>
        <button onClick={onShowSettings} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-800 text-slate-400 transition">
          <Settings size={18} /> Settings
        </button>
      </nav>

      <footer className="mt-auto">
        <button onClick={onReset} className="text-xs text-red-500 flex items-center gap-2 hover:text-red-400 transition-colors">
          <Trash2 size={14} /> Erase All Data
        </button>
      </footer>
    </aside>
  );
};

export default App;
