import React, { useState, useCallback } from 'react';
import { X, Eye, EyeOff, Save, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  onSave,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const handleSave = useCallback(() => {
    onApiKeyChange(localApiKey);
    onSave();
    onClose();
  }, [localApiKey, onApiKeyChange, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setLocalApiKey(apiKey); // Reset to original value
    onClose();
  }, [apiKey, onClose]);

  const toggleShowApiKey = useCallback(() => {
    setShowApiKey(prev => !prev);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="btn-icon" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="setting-section">
            <h3>API Configuration</h3>
            <div className="setting-item">
              <label htmlFor="apiKey">
                <Key size={16} />
                Tripo3D API Key
              </label>
              <div className="api-key-input-group">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Enter your Tripo3D API key"
                  className="api-key-input"
                />
                <button
                  type="button"
                  className="btn-icon toggle-visibility"
                  onClick={toggleShowApiKey}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="setting-description">
                Get your API key from{' '}
                <a 
                  href="https://platform.tripo3d.ai/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  platform.tripo3d.ai/api-keys
                </a>
              </p>
            </div>
          </div>

          <div className="setting-section">
            <h3>About</h3>
            <div className="setting-item">
              <p className="about-text">
                Minimal 3D Studio v0.1.0<br />
                AI-powered 3D model generation tool<br />
                Built with React, Three.js, and Electron
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}; 