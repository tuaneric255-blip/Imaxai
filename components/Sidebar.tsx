
import React from 'react';
import { ModuleId, Module } from '../types';
import { MODULES, SETTINGS_MODULE } from '../constants';

interface SidebarProps {
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
  isOpen: boolean; // Mobile toggle
  isCollapsed: boolean; // Desktop rail mode
  toggleCollapse: () => void;
  onClose: () => void; // Mobile close
}

interface NavItemProps {
  module: Module;
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
  onClose: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ module, activeModule, setActiveModule, onClose, isCollapsed }) => (
  <button
      onClick={() => {
          setActiveModule(module.id);
          onClose(); 
      }}
      title={isCollapsed ? module.name : undefined}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all group ${
      activeModule === module.id
          ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20'
          : 'text-muted hover:bg-background hover:text-text'
      } ${isCollapsed ? 'justify-center' : ''}`}
  >
      <span className={`${activeModule === module.id ? 'text-white' : 'text-muted group-hover:text-text'} transition-colors`}>
          {module.icon}
      </span>
      {!isCollapsed && (
          <span className="truncate">{module.name}</span>
      )}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, isOpen, isCollapsed, toggleCollapse, onClose }) => {
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
        ></div>
      )}

      {/* Sidebar Content */}
      <nav 
        className={`fixed inset-y-0 left-0 z-50 bg-surface flex flex-col border-r border-border overflow-hidden transition-all duration-300 md:relative 
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isCollapsed ? 'w-20' : 'w-80'}
        `}
      >
        {/* Header / Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-border mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
            <div 
                className="w-8 h-8 text-primary flex-shrink-0 cursor-pointer"
                onClick={() => setActiveModule(ModuleId.HOME)}
                title="Go Home"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" className="text-text opacity-20" />
                    <path d="M7 7l10 10M17 7L7 17" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2.5" className="fill-current" />
                </svg>
            </div>
            {!isCollapsed && (
                <h1 
                    className="text-xl font-bold text-text tracking-tight cursor-pointer whitespace-nowrap overflow-hidden"
                    onClick={() => setActiveModule(ModuleId.HOME)}
                >
                    ImaXai Studio
                </h1>
            )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
            {!isCollapsed && (
                <h2 className="px-2 mb-2 text-xs font-semibold text-muted uppercase tracking-wider">Apps</h2>
            )}
            {MODULES.map((module) => (
                <NavItem 
                  key={module.id} 
                  module={module} 
                  activeModule={activeModule}
                  setActiveModule={setActiveModule}
                  onClose={onClose}
                  isCollapsed={isCollapsed}
                />
            ))}
        </div>
            
        {/* Footer Area */}
        <div className="mt-auto p-3 border-t border-border bg-surface">
             <NavItem 
                module={SETTINGS_MODULE} 
                activeModule={activeModule}
                setActiveModule={setActiveModule}
                onClose={onClose}
                isCollapsed={isCollapsed}
             />
            
             {/* Collapse Toggle (Desktop Only) */}
             <button 
                onClick={toggleCollapse}
                className="hidden md:flex w-full items-center justify-center mt-2 p-2 text-muted hover:text-text hover:bg-background rounded-lg transition-colors"
             >
                {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
                    </svg>
                )}
             </button>

             {/* Credits & Version */}
            {!isCollapsed && (
                <div className="px-2 pt-4 pb-1 text-center">
                    <p className="text-[10px] text-muted leading-relaxed">
                        Version 2.7 <br/>
                        Create by <span className="text-text font-medium">Ericnguyen</span>
                        <br />
                        <span className="text-primary">Odinflows</span> | Teamentors.com
                    </p>
                </div>
            )}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
