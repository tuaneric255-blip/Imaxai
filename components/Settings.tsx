
import React, { useState, useEffect, useRef } from 'react';
import Tabs from './ui/Tabs';
import Button from './ui/Button';

interface SettingsProps {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    avatar: string;
    setAvatar: (url: string) => void;
}

const COLORS = [
    { name: 'Orange', value: '#FF6B00' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
];

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, primaryColor, setPrimaryColor, avatar, setAvatar }) => {
    const [apiKeyStatus, setApiKeyStatus] = useState<'checked' | 'unchecked' | 'checking'>('checking');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const checkApiKey = async () => {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeyStatus(hasKey ? 'checked' : 'unchecked');
        } else {
            // Fallback environment where window.aistudio might not exist
            setApiKeyStatus('unchecked');
        }
    };

    useEffect(() => {
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio && window.aistudio.openSelectKey) {
            try {
                await window.aistudio.openSelectKey();
                // Re-check status after selection
                await checkApiKey();
            } catch (e) {
                console.error("Error selecting key:", e);
                // Even if error, re-check as user might have cancelled or updated
                await checkApiKey();
            }
        } else {
            alert("Trình quản lý API Key chưa sẵn sàng trong môi trường này.");
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAvatar(url);
        }
    };

    // --- Tab Contents ---

    const ThemeSettings = () => (
        <div className="space-y-8 pt-4">
             {/* Personal Info / Avatar */}
             <div>
                <h3 className="text-lg font-semibold text-text mb-4">Thông tin cá nhân</h3>
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                            <img src={avatar} alt="Current Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div 
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                            Đổi Avatar
                        </Button>
                        <p className="text-xs text-muted mt-2">Hỗ trợ JPG, PNG. Tối đa 2MB.</p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>
                </div>
             </div>

             <div className="w-full h-px bg-border"></div>

            {/* Theme Toggle */}
            <div>
                <h3 className="text-lg font-semibold text-text mb-4">Chế độ nền</h3>
                <div className="flex gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/50'}`}
                    >
                        <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-900">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                            </svg>
                        </div>
                        <span className={`font-medium ${theme === 'light' ? 'text-primary' : 'text-muted'}`}>Chế độ Sáng</span>
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/50'}`}
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-900 shadow-md flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                            </svg>
                        </div>
                        <span className={`font-medium ${theme === 'dark' ? 'text-primary' : 'text-muted'}`}>Chế độ Tối</span>
                    </button>
                </div>
            </div>

            {/* Color Picker */}
            <div>
                    <h3 className="text-lg font-semibold text-text mb-4">Màu chủ đạo</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {COLORS.map((color) => (
                            <button
                            key={color.value}
                            onClick={() => setPrimaryColor(color.value)}
                            className={`group relative flex flex-col items-center gap-2`}
                            >
                            <div 
                                className={`w-12 h-12 rounded-full transition-transform ${primaryColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface ring-primary' : 'hover:scale-105'}`}
                                style={{ backgroundColor: color.value }}
                            />
                            <span className={`text-xs ${primaryColor === color.value ? 'text-text font-bold' : 'text-muted'}`}>{color.name}</span>
                            {primaryColor === color.value && (
                                <div className="absolute -bottom-2 w-1 h-1 bg-text rounded-full"></div>
                            )}
                            </button>
                        ))}
                    </div>
            </div>
        </div>
    );

    const ApiKeySettings = () => (
        <div className="space-y-6 pt-4">
             <div className={`p-4 rounded-xl border ${apiKeyStatus === 'checked' ? 'bg-green-500/10 border-green-500/30' : 'bg-surface border-border'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${apiKeyStatus === 'checked' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                        <h4 className="font-semibold text-text">
                            {apiKeyStatus === 'checked' ? 'Đã kết nối Google Cloud' : 'Chưa kết nối Project'}
                        </h4>
                        <p className="text-sm text-muted">
                            {apiKeyStatus === 'checked' 
                                ? 'Ứng dụng đang sử dụng API Key từ tài khoản Google của bạn.' 
                                : 'Kết nối để sử dụng các tính năng nâng cao (Gemini, Imagen, Veo).'}
                        </p>
                    </div>
                </div>
             </div>

             <div>
                <h3 className="text-lg font-semibold text-text mb-2">Quản lý API Key</h3>
                <p className="text-sm text-muted mb-4">
                    Nhấn nút bên dưới để mở trình quản lý bảo mật của Google AI Studio. Bạn có thể chọn Project có sẵn hoặc tạo mới.
                </p>
                <Button onClick={handleSelectKey} className="w-full sm:w-auto">
                    {apiKeyStatus === 'checked' ? 'Thay đổi API Key / Project' : 'Kết nối Google Cloud Project'}
                </Button>
             </div>
             
             {apiKeyStatus === 'unchecked' && (
                 <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm text-text">
                     <strong>Lưu ý:</strong> Một số tính năng như tạo ảnh chất lượng cao (Imagen 3) hoặc Lookbook yêu cầu API Key từ Project có kích hoạt thanh toán (Billing enabled).
                 </div>
             )}
        </div>
    );

    const GuideSettings = () => (
        <div className="space-y-6 pt-4 text-text">
            <h3 className="text-lg font-semibold">Hướng dẫn lấy API Key & Cấu hình</h3>
            
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted flex-shrink-0">1</div>
                    <div>
                        <h4 className="font-medium">Truy cập Google AI Studio</h4>
                        <p className="text-sm text-muted">Nhấn vào nút <strong>"Kết nối Google Cloud Project"</strong> ở tab API Key.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted flex-shrink-0">2</div>
                    <div>
                        <h4 className="font-medium">Chọn hoặc Tạo Project</h4>
                        <p className="text-sm text-muted">Trong hộp thoại hiện ra, chọn một dự án Google Cloud hiện có hoặc nhấn "Create new project".</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted flex-shrink-0">3</div>
                    <div>
                        <h4 className="font-medium">Kích hoạt Billing (Quan trọng)</h4>
                        <p className="text-sm text-muted mb-2">Để sử dụng các model như Gemini 1.5 Pro hoặc Imagen, bạn cần liên kết tài khoản thanh toán.</p>
                        <a 
                            href="https://ai.google.dev/gemini-api/docs/billing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                        >
                            Xem hướng dẫn Billing chính thức &rarr;
                        </a>
                    </div>
                </div>
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted flex-shrink-0">4</div>
                    <div>
                        <h4 className="font-medium">Hoàn tất</h4>
                        <p className="text-sm text-muted">Sau khi chọn xong, ứng dụng sẽ tự động tải lại quyền truy cập. Bạn có thể bắt đầu sáng tạo!</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const tabs = [
        { title: 'Giao diện', content: <ThemeSettings /> },
        { title: 'API Key & Tài khoản', content: <ApiKeySettings /> },
        { title: 'Hướng dẫn', content: <GuideSettings /> },
    ];

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col">
             <div className="bg-surface rounded-2xl p-6 md:p-8 border border-border shadow-sm min-h-[500px]">
                <h2 className="text-2xl font-bold text-text mb-2">Cài đặt</h2>
                <p className="text-muted mb-6">Tùy chỉnh giao diện và quản lý kết nối.</p>
                
                <Tabs tabs={tabs} />
             </div>
        </div>
    );
};

export default Settings;