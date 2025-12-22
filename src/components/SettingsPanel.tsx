import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { CEREBRAS_MODELS } from '../constants';
import { ChevronUp, ExternalLink, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- PROPS ---
interface SettingsPanelProps {
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  onClose: () => void;
}

// --- SUB-COMPONENTS ---
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <section className="border-b border-slate-800 pb-6 mb-6">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left mb-3">
        <h3 className="text-lg font-semibold text-blue-400">{title}</h3>
        <ChevronUp size={20} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const TextInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; helpText?: string }> =
  ({ label, value, onChange, type = 'text', placeholder, helpText }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dark border border-slate-600 rounded p-2 focus:border-blue-500 outline-none transition-colors"
        placeholder={placeholder}
      />
      {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
    </div>
  );

const NumberInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; }> =
  ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} className="w-full bg-dark border border-slate-600 rounded p-2" />
  </div>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (c: boolean) => void; helpText?: string }> = ({ label, checked, onChange, helpText }) => (
    <div className="flex items-center gap-3 mt-4">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} id={label} className="form-checkbox h-4 w-4 rounded bg-dark border-slate-600 text-blue-500 focus:ring-blue-500"/>
        <div>
          <label htmlFor={label} className="text-sm cursor-pointer">{label}</label>
          {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
        </div>
    </div>
);


const TextArea: React.FC<{ label: string; value: string; onChange: (v: string) => void; rows?: number; }> = ({ label, value, onChange, rows = 3 }) => (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      <textarea
        className="w-full bg-dark border border-slate-600 rounded p-2 text-sm font-mono focus:border-blue-500 outline-none transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </div>
);

// --- MAIN COMPONENT ---
const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, updateSettings, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: any) => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    updateSettings(newSettings); // Autosave on change
  };

  return (
    <div className="h-full flex flex-col bg-paper text-slate-200 p-6 overflow-y-auto border-l border-slate-800 shadow-2xl">
      <header className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </header>

      <div className="space-y-8">
        <Section title="API Configuration">
            <div className="flex gap-2">
                <TextInput
                    label="Cerebras API Key"
                    type="password"
                    value={localSettings.apiKey}
                    onChange={(v) => handleChange('apiKey', v)}
                    placeholder="Paste key here..."
                    helpText="Key is stored locally and securely in your browser."
                />
                 <a
                  href="https://www.cerebras.net/sign-up-for-free-access-to-the-cerebras-software-platform/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center self-end px-3 py-2 bg-slate-700 rounded hover:bg-slate-600 text-sm h-10 mt-auto"
                >
                  Get Key <ExternalLink size={14} className="ml-1"/>
                </a>
            </div>
        </Section>

        <Section title="Model Selection">
            <p className="text-xs text-slate-500 mb-2">Drag to reorder priority. The top model will be tried first.</p>
            {/* Simple reordering UI for now. A drag-and-drop library would be overkill. */}
            <div className="bg-dark p-2 rounded border border-slate-700 space-y-1">
                {localSettings.modelPriority.map((model, idx) => (
                    <div key={model} className="flex justify-between items-center p-2 bg-paper rounded">
                        <span className="font-mono text-sm">{model}</span>
                        <div className="flex gap-1">
                            <button disabled={idx === 0} onClick={() => {
                                const newPrio = [...localSettings.modelPriority];
                                [newPrio[idx-1], newPrio[idx]] = [newPrio[idx], newPrio[idx-1]];
                                handleChange('modelPriority', newPrio);
                            }} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">▲</button>
                            <button disabled={idx === localSettings.modelPriority.length - 1} onClick={() => {
                                const newPrio = [...localSettings.modelPriority];
                                [newPrio[idx+1], newPrio[idx]] = [newPrio[idx], newPrio[idx+1]];
                                handleChange('modelPriority', newPrio);
                            }} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">▼</button>
                             <button onClick={() => {
                                handleChange('modelPriority', localSettings.modelPriority.filter(m => m !== model));
                            }} className="text-red-500 hover:text-red-400">✕</button>
                        </div>
                    </div>
                ))}
            </div>
             <select
                className="w-full bg-dark border border-slate-600 p-2 text-sm mt-2 rounded"
                onChange={(e) => {
                    const modelToAdd = e.target.value;
                    if (modelToAdd && !localSettings.modelPriority.includes(modelToAdd)) {
                        handleChange('modelPriority', [...localSettings.modelPriority, modelToAdd]);
                    }
                }}
                value=""
            >
                <option value="">Add a model to the list...</option>
                {CEREBRAS_MODELS.filter(m => !localSettings.modelPriority.includes(m.name)).map(m => (
                    <option key={m.name} value={m.name}>{m.displayName}</option>
                ))}
            </select>
        </Section>

        <Section title="Processing Configuration">
            <div className="grid grid-cols-2 gap-4">
                <NumberInput label="Batch Size (Tokens)" value={localSettings.batchSize} onChange={(v) => handleChange('batchSize', v)} />
                <NumberInput label="Parallel Chunks" value={localSettings.parallelChunks} onChange={(v) => handleChange('parallelChunks', v)} />
                <NumberInput label="Max Retries" value={localSettings.maxRetries} onChange={(v) => handleChange('maxRetries', v)} />
                <NumberInput label="Retry Delay (ms)" value={localSettings.retryDelay} onChange={(v) => handleChange('retryDelay', v)} />
            </div>
            <Toggle label="Turbo Mode" checked={localSettings.turboMode} onChange={v => handleChange('turboMode', v)} helpText="Higher concurrency, but increases risk of rate-limiting." />
        </Section>

        <Section title="Prompt Engineering">
             <div className="space-y-4">
                <TextArea label="System Instruction" value={localSettings.systemPrompt} onChange={v => handleChange('systemPrompt', v)} rows={5} />
                <TextArea label="Text Transformation Prompt" value={localSettings.textTransformPrompt} onChange={v => handleChange('textTransformPrompt', v)} rows={8} />
             </div>
        </Section>
      </div>
    </div>
  );
};

export default SettingsPanel;
