import React, { useState, useCallback } from 'react';
import { X, Eye, EyeOff, Save, Key, Zap } from 'lucide-react';
import { APIProvider } from '../types/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  replicateApiKey: string;
  onReplicateApiKeyChange: (key: string) => void;
  apiProvider: APIProvider;
  onApiProviderChange: (provider: APIProvider) => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  replicateApiKey,
  onReplicateApiKeyChange,
  apiProvider,
  onApiProviderChange,
  onSave,
}) => {
  const [showTripoApiKey, setShowTripoApiKey] = useState(false);
  const [showReplicateApiKey, setShowReplicateApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localReplicateApiKey, setLocalReplicateApiKey] = useState(replicateApiKey);
  const [localApiProvider, setLocalApiProvider] = useState(apiProvider);

  const handleSave = useCallback(() => {
    onApiKeyChange(localApiKey);
    onReplicateApiKeyChange(localReplicateApiKey);
    onApiProviderChange(localApiProvider);
    onSave();
    onClose();
  }, [localApiKey, localReplicateApiKey, localApiProvider, onApiKeyChange, onReplicateApiKeyChange, onApiProviderChange, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setLocalApiKey(apiKey); // Reset to original values
    setLocalReplicateApiKey(replicateApiKey);
    setLocalApiProvider(apiProvider);
    onClose();
  }, [apiKey, replicateApiKey, apiProvider, onClose]);

  const toggleShowTripoApiKey = useCallback(() => {
    setShowTripoApiKey(prev => !prev);
  }, []);

  const toggleShowReplicateApiKey = useCallback(() => {
    setShowReplicateApiKey(prev => !prev);
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
            <h3>API Provider</h3>
            <div className="setting-item">
              <label>
                <Zap size={16} />
                Choose API Provider
              </label>
              <div className="provider-selection">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="apiProvider"
                    value="tripo"
                    checked={localApiProvider === 'tripo'}
                    onChange={(e) => setLocalApiProvider(e.target.value as APIProvider)}
                  />
                  <span>Tripo3D</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="apiProvider"
                    value="replicate"
                    checked={localApiProvider === 'replicate'}
                    onChange={(e) => setLocalApiProvider(e.target.value as APIProvider)}
                  />
                  <span>Replicate</span>
                </label>
              </div>
            </div>
          </div>

          <div className="setting-section">
            <h3>API Configuration</h3>
            
            {/* Tripo3D API Key */}
            <div className={`setting-item ${localApiProvider === 'tripo' ? 'active' : 'inactive'}`}>
              <label htmlFor="tripoApiKey">
                <Key size={16} />
                Tripo3D API Key
              </label>
              <div className="api-key-input-group">
                <input
                  id="tripoApiKey"
                  type={showTripoApiKey ? 'text' : 'password'}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Enter your Tripo3D API key"
                  className="api-key-input"
                  disabled={localApiProvider !== 'tripo'}
                />
                <button
                  type="button"
                  className="btn-icon toggle-visibility"
                  onClick={toggleShowTripoApiKey}
                  disabled={localApiProvider !== 'tripo'}
                >
                  {showTripoApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
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

            {/* Replicate API Key */}
            <div className={`setting-item ${localApiProvider === 'replicate' ? 'active' : 'inactive'}`}>
              <label htmlFor="replicateApiKey">
                <Key size={16} />
                Replicate API Key
              </label>
              <div className="api-key-input-group">
                <input
                  id="replicateApiKey"
                  type={showReplicateApiKey ? 'text' : 'password'}
                  value={localReplicateApiKey}
                  onChange={(e) => setLocalReplicateApiKey(e.target.value)}
                  placeholder="Enter your Replicate API key"
                  className="api-key-input"
                  disabled={localApiProvider !== 'replicate'}
                />
                <button
                  type="button"
                  className="btn-icon toggle-visibility"
                  onClick={toggleShowReplicateApiKey}
                  disabled={localApiProvider !== 'replicate'}
                >
                  {showReplicateApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="setting-description">
                Get your API key from{' '}
                <a 
                  href="https://replicate.com/account/api-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  replicate.com/account/api-tokens
                </a>
              </p>
            </div>
          </div>

          <div className="setting-section">
            <h3>About</h3>
            <div className="setting-item">
              <p className="about-text">
                Minimal 3D Studio v0.2.0
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