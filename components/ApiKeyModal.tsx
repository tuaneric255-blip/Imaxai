import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { USER_API_KEY_STORAGE } from '../services/geminiService';

interface ApiKeyModalProps {
    onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if key exists
        const existingKey = localStorage.getItem(USER_API_KEY_STORAGE);
        if (!existingKey) {
            setIsVisible(true);
        }
    }, []);

    const handleSave = () => {
        if (apiKey.trim().length > 10) {
            localStorage.setItem(USER_API_KEY_STORAGE, apiKey.trim());
            setIsVisible(false);
            onClose();
        } else {
            alert("Vui lòng nhập API Key hợp lệ.");
        }
    };

    const handleUseFreeTier = () => {
        // Allow user to proceed with system key (if configured in env), 
        // but warn them about quotas.
        const confirm = window.confirm("Sử dụng gói miễn phí chung có thể gặp lỗi 'Hết hạn ngạch' (429 Error) khi nhiều người cùng sử dụng. Bạn có chắc chắn không?");
        if (confirm) {
            setIsVisible(false);
            onClose();
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-text">Cấu hình API Key</h2>
                    <p className="text-muted mt-2">
                        Để đảm bảo tốc độ cao nhất và không bị giới hạn (Quota Limit), vui lòng nhập <strong>Google AI Studio API Key</strong> của riêng bạn.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Google Gemini API Key</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:ring-2 focus:ring-primary outline-none"
                        />
                         <p className="text-xs text-muted mt-2">
                            Key của bạn được lưu trữ an toàn trong trình duyệt (LocalStorage) và không được gửi đi đâu ngoài Google Server.
                        </p>
                    </div>

                    <Button onClick={handleSave} className="w-full py-3 text-lg">
                        Lưu & Bắt đầu
                    </Button>

                    <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-primary hover:underline"
                        >
                            Lấy API Key ở đâu?
                        </a>
                        <button 
                            onClick={handleUseFreeTier}
                            className="text-sm text-muted hover:text-text transition-colors"
                        >
                            Dùng thử (Giới hạn)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
