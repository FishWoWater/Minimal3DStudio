import React from 'react';
import { Settings, Sun, Moon, Coins } from 'lucide-react';
import { APIProvider } from '../types/api';

interface HeaderProps {
  credits: number;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onSettingsClick: () => void;
  isLoadingCredits: boolean;
  apiProvider: APIProvider;
}

export const Header: React.FC<HeaderProps> = ({
  credits,
  theme,
  onThemeToggle,
  onSettingsClick,
  isLoadingCredits,
  apiProvider,
}) => {
  return (
    <header className="header">
      <div className="logo">Minimal 3D Studio</div>
      
      <div className="header-controls">
        {apiProvider === 'tripo' ? (
          <div className="credits">
            <Coins size={16} />
            {isLoadingCredits ? 'Loading...' : `${credits} credits`}
          </div>
        ) : (
          <div className="credits">
            💳 Pay per use
          </div>
        )}
        
        <button className="btn-icon" onClick={onThemeToggle}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button className="btn-icon" onClick={onSettingsClick}>
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}; 