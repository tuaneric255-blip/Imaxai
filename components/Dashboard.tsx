
import React from 'react';
import { MODULES, SETTINGS_MODULE } from '../constants';
import { ModuleId } from '../types';

interface DashboardProps {
  setActiveModule: (id: ModuleId) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveModule }) => {
  const allModules = [...MODULES, SETTINGS_MODULE];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-text mb-2">Welcome to ImaXai Studio</h2>
            <p className="text-muted text-lg">AI-Powered Creative Suite for Everyone</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allModules.map((module) => (
                <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className="group bg-surface hover:bg-surface/80 border border-border hover:border-primary/50 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
                >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <div className="w-6 h-6">
                            {module.icon}
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-primary transition-colors">{module.name}</h3>
                    <p className="text-sm text-muted leading-relaxed">{module.description}</p>
                </button>
            ))}
        </div>
    </div>
  );
};

export default Dashboard;
