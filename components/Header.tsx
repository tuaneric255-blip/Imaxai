
import React, { useState, useEffect } from 'react';
import { ModuleId } from '../types';
import { HomeIcon } from '../constants';
import { USER_API_KEY_STORAGE } from '../services/geminiService';

interface HeaderProps {
  moduleName?: string;
  avatar?: string;
  onToggleSidebar: () => void;
  activeModule: ModuleId;
  onNavigateHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ moduleName = 'ImaXai Studio', avatar, onToggleSidebar, activeModule, onNavigateHome }) => {
  const [hasPersonalKey, setHasPersonalKey] = useState(false);
  const isHome = activeModule === ModuleId.HOME;

  useEffect(() => {
    // Check key status on mount and when window gains focus (in case changed in another tab)
    const checkKey = () => {
        setHasPersonalKey(!!localStorage.getItem(USER_API_KEY_STORAGE));
    };
    checkKey();
    window.addEventListener('focus', checkKey);
    // Custom event listener if we want realtime updates from Settings
    window.addEventListener('storage', checkKey);
    return () => {
        window.removeEventListener('focus', checkKey);
        window.removeEventListener('storage', checkKey);
    };
  }, []);

  return (
    <header className="flex-shrink-0 h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 lg:px-8 transition-colors duration-300">
      <div className="flex items-center gap-4">
         {/* Hamburger Menu - Visible only on mobile */}
         <button 
            className="md:hidden p-2 -ml-2 text-muted hover:text-text"
            onClick={onToggleSidebar}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center text-sm font-medium">
            <button 
                onClick={onNavigateHome}
                className={`flex items-center gap-1 hover:text-primary transition-colors ${isHome ? 'text-primary' : 'text-muted'}`}
            >
                <div className="w-4 h-4"><HomeIcon /></div>
                <span className="hidden sm:inline">Home</span>
            </button>
            
            {!isHome && (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mx-2 text-muted">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="text-text font-semibold truncate max-w-[150px] sm:max-w-none">{moduleName}</span>
                </>
            )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Key Status Indicator */}
        <div 
            className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${
                hasPersonalKey 
                ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
            }`}
            title={hasPersonalKey ? "Using Personal API Key (Priority)" : "Using System/Shared API Key (Quota Limited)"}
        >
            <div className={`w-2 h-2 rounded-full ${hasPersonalKey ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            {hasPersonalKey ? 'Personal Key' : 'System Key'}
        </div>

        {/* Credits / Free Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
             <span className="text-xs font-bold text-primary tracking-wide">FREE</span>
        </div>

        {/* Avatar */}
        <div className="relative group">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border group-hover:border-primary transition-colors cursor-pointer">
                <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
