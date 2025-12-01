
import React, { useState, useEffect, useRef } from 'react';
import Tabs from './ui/Tabs';
import Button from './ui/Button';
import { USER_API_KEY_STORAGE } from '../services/geminiService';
import { useToast } from './ui/Toast';

interface SettingsProps {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    avatar: string;
    setAvatar: (url: string) => void;
    language: 'vi' | 'en';
    setLanguage: (lang: 'vi' | 'en') => void;
}

const COLORS = [
    { name: 'Orange', value: '#FF6B00' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
];

// Translations for Settings Page
const TRANSLATIONS = {
    vi: {
        settingsTitle: "Cài đặt",
        settingsDesc: "Tùy chỉnh giao diện và quản lý kết nối.",
        tabInterface: "Giao diện",
        tabApiKey: "API Key & Tài khoản",
        tabGuide: "Hướng dẫn",
        
        // Interface
        personalInfo: "Thông tin cá nhân",
        changeAvatar: "Đổi Avatar",
        avatarNote: "Hỗ trợ JPG, PNG. Tối đa 2MB.",
        themeMode: "Chế độ nền",
        lightMode: "Chế độ Sáng",
        darkMode: "Chế độ Tối",
        primaryColor: "Màu chủ đạo",
        language: "Ngôn ngữ / Language",

        // API Key
        keySavedTitle: "Đã lưu API Key cá nhân",
        keyDefaultTitle: "Đang sử dụng Key Mặc định (Có thể bị giới hạn)",
        keySavedDesc: "Ứng dụng đang sử dụng API Key từ LocalStorage của bạn. Không giới hạn hạn ngạch.",
        keyDefaultDesc: "Vui lòng nhập API Key riêng để đảm bảo tốc độ và tránh lỗi 429 Quota Exceeded.",
        enterKeyTitle: "Nhập Google AI Studio Key",
        keyPlaceholder: "Dán khóa API của bạn vào đây (bắt đầu bằng AIzaSy...)",
        saveKeyBtn: "Lưu API Key",
        removeKeyBtn: "Xóa Key",
        securityNote: "Bảo mật: API Key của bạn chỉ được lưu trên trình duyệt này và gửi trực tiếp đến Google Servers. Hệ thống ImaXai Studio không thu thập hay lưu trữ key của bạn.",
        toastKeySaved: "Đã lưu API Key thành công!",
        toastKeyRemoved: "Đã xóa API Key.",
        toastInvalid: "Vui lòng nhập API Key hợp lệ.",
        toastAvatar: "Đã cập nhật Avatar",

        // Guide
        guideTitle: "Hướng dẫn lấy API Key & Cấu hình",
        step1Title: "Truy cập Google AI Studio",
        step1Desc: "Truy cập",
        step2Title: "Tạo API Key",
        step2Desc: "Nhấn nút 'Create API Key'. Bạn có thể chọn tạo key trong dự án mới hoặc dự án có sẵn.",
        step3Title: "Sao chép và Dán",
        step3Desc: "Sao chép chuỗi ký tự bắt đầu bằng AIzaSy... và dán vào tab 'API Key & Tài khoản' trong ứng dụng này.",
    },
    en: {
        settingsTitle: "Settings",
        settingsDesc: "Customize interface and manage connections.",
        tabInterface: "Interface",
        tabApiKey: "API Key & Account",
        tabGuide: "Guide",
        
        // Interface
        personalInfo: "Personal Info",
        changeAvatar: "Change Avatar",
        avatarNote: "Supports JPG, PNG. Max 2MB.",
        themeMode: "Theme Mode",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        primaryColor: "Primary Color",
        language: "Language / Ngôn ngữ",

        // API Key
        keySavedTitle: "Personal API Key Saved",
        keyDefaultTitle: "Using Default Key (Quota Limited)",
        keySavedDesc: "App is using the API Key from your LocalStorage. No quota limits.",
        keyDefaultDesc: "Please enter your own API Key to ensure speed and avoid 429 Quota Exceeded errors.",
        enterKeyTitle: "Enter Google AI Studio Key",
        keyPlaceholder: "Paste your API Key here (starts with AIzaSy...)",
        saveKeyBtn: "Save API Key",
        removeKeyBtn: "Remove Key",
        securityNote: "Security: Your API Key is stored only in this browser and sent directly to Google Servers. ImaXai Studio does not collect or store your key.",
        toastKeySaved: "API Key saved successfully!",
        toastKeyRemoved: "API Key removed.",
        toastInvalid: "Please enter a valid API Key.",
        toastAvatar: "Avatar updated",

        // Guide
        guideTitle: "How to get API Key & Configuration",
        step1Title: "Access Google AI Studio",
        step1Desc: "Go to",
        step2Title: "Create API Key",
        step2Desc: "Click 'Create API Key'. You can choose to create a key in a new or existing project.",
        step3Title: "Copy and Paste",
        step3Desc: "Copy the string starting with AIzaSy... and paste it into the 'API Key & Account' tab in this app.",
    }
};

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, primaryColor, setPrimaryColor, avatar, setAvatar, language, setLanguage }) => {
    const [userApiKey, setUserApiKey] = useState('');
    const [isKeySaved, setIsKeySaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Get current translation
    const t = TRANSLATIONS[language];

    useEffect(() => {
        const storedKey = localStorage.getItem(USER_API_KEY_STORAGE);
        if (storedKey) {
            setUserApiKey(storedKey);
            setIsKeySaved(true);
        }
    }, []);

    const handleSaveKey = () => {
        // Sanitize Input: remove invisible chars, spaces, newlines
        const cleanKey = userApiKey.replace(/[^\x20-\x7E]/g, '').trim();

        if (cleanKey) {
            localStorage.setItem(USER_API_KEY_STORAGE, cleanKey);
            setUserApiKey(cleanKey); // Update input to show clean version
            setIsKeySaved(true);
            addToast(t.toastKeySaved, 'success');
        } else {
            addToast(t.toastInvalid, 'error');
        }
    };

    const handleRemoveKey = () => {
        localStorage.removeItem(USER_API_KEY_STORAGE);
        setUserApiKey('');
        setIsKeySaved(false);
        addToast(t.toastKeyRemoved, 'info');
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAvatar(url);
            addToast(t.toastAvatar, 'success');
        }
    };

    // --- Tab Contents ---

    const ThemeSettings = () => (
        <div className="space-y-8 pt-4">
             {/* Personal Info / Avatar */}
             <div>
                <h3 className="text-lg font-semibold text-text mb-4">{t.personalInfo}</h3>
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
                            {t.changeAvatar}
                        </Button>
                        <p className="text-xs text-muted mt-2">{t.avatarNote}</p>
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
            
             {/* Language Selector */}
             <div>
                <h3 className="text-lg font-semibold text-text mb-4">{t.language}</h3>
                <div className="flex bg-background border border-border rounded-lg p-1 max-w-sm">
                    <button 
                        className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${language === 'vi' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                        onClick={() => setLanguage('vi')}
                    >
                        Tiếng Việt
                    </button>
                    <button 
                        className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${language === 'en' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                        onClick={() => setLanguage('en')}
                    >
                        English
                    </button>
                </div>
             </div>

             <div className="w-full h-px bg-border"></div>

            {/* Theme Toggle */}
            <div>
                <h3 className="text-lg font-semibold text-text mb-4">{t.themeMode}</h3>
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
                        <span className={`font-medium ${theme === 'light' ? 'text-primary' : 'text-muted'}`}>{t.lightMode}</span>
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
                        <span className={`font-medium ${theme === 'dark' ? 'text-primary' : 'text-muted'}`}>{t.darkMode}</span>
                    </button>
                </div>
            </div>

            {/* Color Picker */}
            <div>
                    <h3 className="text-lg font-semibold text-text mb-4">{t.primaryColor}</h3>
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
             <div className={`p-4 rounded-xl border ${isKeySaved ? 'bg-green-500/10 border-green-500/30' : 'bg-surface border-border'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isKeySaved ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                        <h4 className="font-semibold text-text">
                            {isKeySaved ? t.keySavedTitle : t.keyDefaultTitle}
                        </h4>
                        <p className="text-sm text-muted">
                            {isKeySaved ? t.keySavedDesc : t.keyDefaultDesc}
                        </p>
                    </div>
                </div>
             </div>

             <div>
                <h3 className="text-lg font-semibold text-text mb-2">{t.enterKeyTitle}</h3>
                <input 
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder={t.keyPlaceholder}
                    className="w-full bg-background border border-border rounded-lg p-3 text-text focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                />
                <div className="flex gap-3">
                    <Button onClick={handleSaveKey} className="flex-1">
                        {t.saveKeyBtn}
                    </Button>
                    {isKeySaved && (
                        <Button onClick={handleRemoveKey} variant="danger" className="flex-1">
                            {t.removeKeyBtn}
                        </Button>
                    )}
                </div>
             </div>
             
             <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm text-text">
                 <strong>{language === 'vi' ? 'Bảo mật:' : 'Security:'}</strong> {t.securityNote.replace('Bảo mật: ', '').replace('Security: ', '')}
             </div>
        </div>
    );

    const GuideSettings = () => (
        <div className="space-y-6 pt-4 text-text">
            <h3 className="text-lg font-semibold">{t.guideTitle}</h3>
            
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted flex-shrink-0">1</div>
                    <div>
                        <h4 className="font-medium">{t.step1Title}</h4>
                        <p className="text-sm text-muted">{t.step1Desc} <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary underline">aistudio.google.com/app/apikey</a>.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted flex-shrink-0">2</div>
                    <div>
                        <h4 className="font-medium">{t.step2Title}</h4>
                        <p className="text-sm text-muted">{t.step2Desc}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-muted flex-shrink-0">3</div>
                    <div>
                        <h4 className="font-medium">{t.step3Title}</h4>
                        <p className="text-sm text-muted">{t.step3Desc}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const tabs = [
        { title: t.tabInterface, content: <ThemeSettings /> },
        { title: t.tabApiKey, content: <ApiKeySettings /> },
        { title: t.tabGuide, content: <GuideSettings /> },
    ];

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col">
             <div className="bg-surface rounded-2xl p-6 md:p-8 border border-border shadow-sm min-h-[500px]">
                <h2 className="text-2xl font-bold text-text mb-2">{t.settingsTitle}</h2>
                <p className="text-muted mb-6">{t.settingsDesc}</p>
                
                <Tabs tabs={tabs} />
             </div>
        </div>
    );
};

export default Settings;
