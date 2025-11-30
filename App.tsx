import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MobileBottomBar from './components/MobileBottomBar';
import { ModuleId } from './types';
import { MODULES, SETTINGS_MODULE } from './constants';
import Spinner from './components/ui/Spinner';
import ApiKeyModal from './components/ApiKeyModal';

// Lazy Load Components for Performance Optimization on Vercel
const FaceSafeGenerator = React.lazy(() => import('./components/FaceSafeGenerator'));
const Img2Prompt = React.lazy(() => import('./components/Img2Prompt'));
const OotdExtractor = React.lazy(() => import('./components/OotdExtractor'));
const BgSwap = React.lazy(() => import('./components/BgSwap'));
const RestorePhoto = React.lazy(() => import('./components/RestorePhoto'));
const Inpaint = React.lazy(() => import('./components/Inpaint'));
const PromptMaker = React.lazy(() => import('./components/PromptMaker'));
const IdPhoto = React.lazy(() => import('./components/IdPhoto'));
const Travel = React.lazy(() => import('./components/Travel'));
const ProductFashion = React.lazy(() => import('./components/ProductFashion'));
const Lookbook = React.lazy(() => import('./components/Lookbook'));
const Settings = React.lazy(() => import('./components/Settings'));

const App: React.FC = () => {
    // Start at Home (Dashboard)
    const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.HOME);
    
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [primaryColor, setPrimaryColor] = useState('#3B82F6');
    const [avatar, setAvatar] = useState('https://picsum.photos/200');
    
    // Sidebar States
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Apply Theme
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [theme]);

    // Apply Primary Color
    useEffect(() => {
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--primary-hover', primaryColor); 
    }, [primaryColor]);

    // Navigation Handler
    const handleModuleChange = (id: ModuleId) => {
        setActiveModule(id);
        
        // Auto-collapse sidebar when entering a tool to focus on workspace
        if (id !== ModuleId.HOME && id !== ModuleId.SETTINGS) {
            setIsSidebarCollapsed(true);
        } else {
            // Expand when going Home or Settings
            setIsSidebarCollapsed(false);
        }
    };

    const activeModuleInfo = activeModule === ModuleId.SETTINGS 
        ? SETTINGS_MODULE 
        : MODULES.find(m => m.id === activeModule);

    const renderActiveModule = () => {
        switch (activeModule) {
            case ModuleId.HOME:
                return <Dashboard setActiveModule={handleModuleChange} />;
            case ModuleId.FACE_SAFE:
                return <FaceSafeGenerator />;
            case ModuleId.IMG2PROMPT:
                return <Img2Prompt />;
            case ModuleId.OOTD_EXTRACT:
                return <OotdExtractor />;
            case ModuleId.BG_SWAP:
                return <BgSwap />;
            case ModuleId.RESTORE:
                return <RestorePhoto />;
            case ModuleId.INPAINT:
                return <Inpaint />;
            case ModuleId.PROMPT_MAKER:
                return <PromptMaker />;
            case ModuleId.ID_PHOTO:
                return <IdPhoto />;
            case ModuleId.TRAVEL:
                return <Travel />;
            case ModuleId.PRODUCT_FASHION:
                return <ProductFashion />;
            case ModuleId.LOOKBOOK:
                return <Lookbook />;
            case ModuleId.SETTINGS:
                return <Settings 
                            theme={theme} 
                            setTheme={setTheme} 
                            primaryColor={primaryColor} 
                            setPrimaryColor={setPrimaryColor} 
                            avatar={avatar}
                            setAvatar={setAvatar}
                        />;
            default:
                return <div className="text-center text-text">Module not found</div>;
        }
    };

    return (
        <div className="flex h-screen bg-background text-text font-sans transition-colors duration-300">
            <ApiKeyModal onClose={() => {}} />

            <Sidebar 
                activeModule={activeModule} 
                setActiveModule={handleModuleChange} 
                isOpen={isMobileSidebarOpen}
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onClose={() => setIsMobileSidebarOpen(false)}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header 
                    moduleName={activeModuleInfo?.name} 
                    avatar={avatar} 
                    activeModule={activeModule}
                    onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    onNavigateHome={() => handleModuleChange(ModuleId.HOME)}
                />
                
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
                    <Suspense fallback={
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <Spinner />
                            <p className="mt-4 text-muted">Loading module...</p>
                        </div>
                    }>
                        {renderActiveModule()}
                    </Suspense>
                </main>

                <MobileBottomBar activeModule={activeModule} setActiveModule={handleModuleChange} />
            </div>
        </div>
    );
};

export default App;