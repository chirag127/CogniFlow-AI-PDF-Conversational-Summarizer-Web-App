import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_MODELS } from '../constants';
import { listModels } from '../services/gemini';
import { Save, RotateCw, ExternalLink } from 'lucide-react';

interface Props {
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<Props> = ({ settings, updateSettings, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Sync local state if props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: any) => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    updateSettings(newSettings); // Autosave
  };

  const fetchModels = async () => {
    if (!localSettings.apiKey) return;
    setIsLoadingModels(true);
    try {
      const data = await listModels(localSettings.apiKey);
      if (data.models) {
         // Map API models to our format
         const mapped = data.models.map((m: any) => ({
            name: m.name.replace('models/', ''),
            displayName: m.displayName || m.name,
            description: m.description,
            inputModalities: m.inputModalities,
            outputModalities: m.outputModalities
         }));
         // Merge with defaults, prioritizing API results
         setAvailableModels(mapped);
      }
    } catch (e) {
      alert("Could not fetch models. Check API Key.");
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-paper text-slate-200 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-primary">Settings</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
      </div>

      <div className="space-y-8">
        {/* API Keys */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-blue-400">API Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Google AI Studio API Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={localSettings.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  className="flex-1 bg-dark border border-slate-600 rounded p-2 focus:border-blue-500 outline-none"
                  placeholder="Paste key here..."
                />
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center px-3 py-2 bg-slate-700 rounded hover:bg-slate-600 text-sm"
                >
                  Get Key <ExternalLink size={14} className="ml-1"/>
                </a>
              </div>
              <p className="text-xs text-slate-500 mt-1">Key is stored locally in your browser.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Backup API Key (Optional)</label>
              <input 
                type="password" 
                value={localSettings.backupApiKey}
                onChange={(e) => handleChange('backupApiKey', e.target.value)}
                className="w-full bg-dark border border-slate-600 rounded p-2 focus:border-blue-500 outline-none"
                placeholder="Secondary key for failover..."
              />
            </div>
          </div>
        </section>

        {/* Models */}
        <section>
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-lg font-semibold text-blue-400">Model Selection</h3>
             <button onClick={fetchModels} disabled={isLoadingModels} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white">
                <RotateCw size={12} className={isLoadingModels ? 'animate-spin' : ''} /> Refresh List
             </button>
          </div>
          <p className="text-xs text-slate-500 mb-2">Drag to reorder priority. Top model is tried first.</p>
          <div className="bg-dark p-2 rounded border border-slate-700">
            {localSettings.modelPriority.map((model, idx) => (
              <div key={model} className="flex justify-between items-center p-2 bg-paper mb-1 rounded">
                <span>{model}</span>
                <div className="flex gap-2">
                   <button 
                    className="text-xs text-slate-400 hover:text-white"
                    onClick={() => {
                        const newPriority = [...localSettings.modelPriority];
                        if (idx > 0) {
                            [newPriority[idx-1], newPriority[idx]] = [newPriority[idx], newPriority[idx-1]];
                            handleChange('modelPriority', newPriority);
                        }
                    }}
                   >
                     ▲
                   </button>
                   <button 
                    className="text-xs text-slate-400 hover:text-white"
                    onClick={() => {
                        const newPriority = [...localSettings.modelPriority];
                        if (idx < newPriority.length - 1) {
                            [newPriority[idx+1], newPriority[idx]] = [newPriority[idx], newPriority[idx+1]];
                            handleChange('modelPriority', newPriority);
                        }
                    }}
                   >
                     ▼
                   </button>
                   <button 
                    className="text-red-400 hover:text-red-300 text-xs"
                    onClick={() => {
                        handleChange('modelPriority', localSettings.modelPriority.filter(m => m !== model));
                    }}
                   >
                     ✕
                   </button>
                </div>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-slate-600">
                <label className="text-xs text-slate-400">Add Model:</label>
                <select 
                    className="w-full bg-paper p-1 text-sm mt-1 rounded"
                    onChange={(e) => {
                        if (e.target.value && !localSettings.modelPriority.includes(e.target.value)) {
                            handleChange('modelPriority', [...localSettings.modelPriority, e.target.value]);
                        }
                    }}
                    value=""
                >
                    <option value="">Select to add...</option>
                    {availableModels.map(m => (
                        <option key={m.name} value={m.name}>{m.displayName} ({m.name})</option>
                    ))}
                </select>
            </div>
          </div>
        </section>

        {/* Processing Rules */}
        <section>
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Processing Config</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium">Batch Size (Tokens)</label>
                <input type="number" value={localSettings.batchSize} onChange={(e) => handleChange('batchSize', parseInt(e.target.value))} className="w-full bg-dark border border-slate-600 rounded p-2"/>
            </div>
            <div>
                <label className="block text-sm font-medium">Parallel Chunks</label>
                <input type="number" value={localSettings.parallelChunks} onChange={(e) => handleChange('parallelChunks', parseInt(e.target.value))} className="w-full bg-dark border border-slate-600 rounded p-2"/>
            </div>
             <div>
                <label className="block text-sm font-medium">Max Retries</label>
                <input type="number" value={localSettings.maxRetries} onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))} className="w-full bg-dark border border-slate-600 rounded p-2"/>
            </div>
            <div>
                <label className="block text-sm font-medium">Retry Delay (ms)</label>
                <input type="number" value={localSettings.retryDelay} onChange={(e) => handleChange('retryDelay', parseInt(e.target.value))} className="w-full bg-dark border border-slate-600 rounded p-2"/>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
             <input type="checkbox" checked={localSettings.turboMode} onChange={(e) => handleChange('turboMode', e.target.checked)} id="turbo" />
             <label htmlFor="turbo" className="text-sm">Enable Turbo Mode (High concurrency, higher rate limit risk)</label>
          </div>
        </section>

        {/* Prompts */}
        <section>
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Prompt Engineering</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400">System Instruction</label>
                    <textarea 
                        className="w-full bg-dark border border-slate-600 rounded p-2 h-20 text-sm font-mono"
                        value={localSettings.systemPrompt}
                        onChange={(e) => handleChange('systemPrompt', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400">Text Transformation Prompt</label>
                    <textarea 
                        className="w-full bg-dark border border-slate-600 rounded p-2 h-32 text-sm font-mono"
                        value={localSettings.textTransformPrompt}
                        onChange={(e) => handleChange('textTransformPrompt', e.target.value)}
                    />
                </div>
            </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsPanel;