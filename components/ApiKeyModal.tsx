
import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { USER_API_KEY_STORAGE } from '../services/geminiService';

interface ApiKeyModalProps {
    onClose: () => void;
    language: 'vi' | 'en';
    setLanguage: (lang: 'vi' | 'en') => void;
}

const TRANSLATIONS = {
    vi: {
        title: "Cấu hình API Key",
        desc: "Để đảm bảo tốc độ cao nhất và không bị giới hạn (Quota Limit), vui lòng nhập",
        descBold: "Google AI Studio API Key",
        descEnd: "của riêng bạn.",
        label: "Google Gemini API Key",
        placeholder: "AIzaSy...",
        securityNote: "Key của bạn được lưu trữ an toàn trong trình duyệt (LocalStorage) và không được gửi đi đâu ngoài Google Server.",
        saveBtn: "Lưu & Bắt đầu",
        invalidAlert: "Vui lòng nhập API Key hợp lệ.",
        howToGet: "Lấy API Key ở đâu?",
        tryFree: "Dùng thử (Giới hạn)",
        freeTierConfirm: "Sử dụng gói miễn phí chung có thể gặp lỗi 'Hết hạn ngạch' (429 Error) khi nhiều người cùng sử dụng. Bạn có chắc chắn không?",
    },
    en: {
        title: "Configure API Key",
        desc: "To ensure highest speed and avoid Quota Limits, please enter your own",
        descBold: "Google AI Studio API Key",
        descEnd: ".",
        label: "Google Gemini API Key",
        placeholder: "AIzaSy...",
        securityNote: "Your key is stored safely in your browser (LocalStorage) and is only sent directly to Google Servers.",
        saveBtn: "Save & Start",
        invalidAlert: "Please enter a valid API Key.",
        howToGet: "Where to get API Key?",
        tryFree: "Try Free (Limited)",
        freeTierConfirm: "Using the shared free tier may result in 'Quota Exceeded' (429 Error) due to high traffic. Are you sure?",
    }
};

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, language, setLanguage }) => {
    const [apiKey, setApiKey] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if key exists
        const existingKey = localStorage.getItem(USER_API_KEY_STORAGE);
        if (!existingKey) {
            setIsVisible(true);
        }
    }, []);

    const t = TRANSLATIONS[language];

    const handleSave = () => {
        // Clean the key: remove invisible characters, spaces, newlines
        const cleanKey = apiKey.replace(/[^\x20-\x7E]/g, '').trim();

        if (cleanKey.length > 10) {
            localStorage.setItem(USER_API_KEY_STORAGE, cleanKey);
            setIsVisible(false);
            onClose();
        } else {
            alert(t.invalidAlert);
        }
    };

    const handleUseFreeTier = () => {
        // Allow user to proceed with system key (if configured in env), 
        // but warn them about quotas.
        const confirm = window.confirm(t.freeTierConfirm);
        if (confirm) {
            setIsVisible(false);
            onClose();
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
                {/* Language Switcher */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                        onClick={() => setLanguage('vi')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${language === 'vi' ? 'bg-primary text-white' : 'text-muted hover:text-text'}`}
                    >
                        VN
                    </button>
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-primary text-white' : 'text-muted hover:text-text'}`}
                    >
                        EN
                    </button>
                </div>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-text">{t.title}</h2>
                    <p className="text-muted mt-2">
                        {t.desc} <strong>{t.descBold}</strong> {t.descEnd}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-2">{t.label}</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t.placeholder}
                            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:ring-2 focus:ring-primary outline-none"
                        />
                         <p className="text-xs text-muted mt-2">
                            {t.securityNote}
                        </p>
                    </div>

                    <Button onClick={handleSave} className="w-full py-3 text-lg">
                        {t.saveBtn}
                    </Button>

                    <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-primary hover:underline"
                        >
                            {t.howToGet}
                        </a>
                        <button 
                            onClick={handleUseFreeTier}
                            className="text-sm text-muted hover:text-text transition-colors"
                        >
                            {t.tryFree}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
