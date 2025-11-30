
import React from 'react';
import { ModuleId } from '../types';
import { HomeIcon } from '../constants';

interface HeaderProps {
  moduleName?: string;
  avatar?: string;
  onToggleSidebar: () => void;
  activeModule: ModuleId;
  onNavigateHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ moduleName = 'ImaXai Studio', avatar, onToggleSidebar, activeModule, onNavigateHome }) => {
  
  const isHome = activeModule === ModuleId.HOME;

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
        <div className="relative hidden md:block">
          <input
            type="search"
            placeholder="Search tools..."
            className="w-96 bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-muted">Credits:</span>
          <span className="font-semibold text-text">FREE</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-border">
          <img src={avatar || "https://picsum.photos/40/40"} alt="User Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default Header;
