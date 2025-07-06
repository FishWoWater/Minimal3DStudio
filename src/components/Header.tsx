import React from 'react';
import { Moon, Sun, Settings } from 'lucide-react';

interface HeaderProps {
  credits: number;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onSettingsClick: () => void;
  isLoadingCredits?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  credits, 
  theme, 
  onThemeToggle, 
  onSettingsClick,
  isLoadingCredits = false 
}) => {
  return (
    <header className="header">
      <div className="logo">Minimal 3D Studio</div>
      <div className="header-controls">
        <div className="credits">
          Credits: {isLoadingCredits ? '...' : credits.toLocaleString()}
        </div>
        <button className="btn" onClick={onThemeToggle} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="btn" onClick={onSettingsClick} title="Settings">
          <Settings size={16} /> Settings
        </button>
      </div>
    </header>
  );
}; 