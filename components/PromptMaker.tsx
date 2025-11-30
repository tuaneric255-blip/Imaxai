
import React, { useState, useCallback } from 'react';
import { generatePromptsFromBrief } from '../services/geminiService';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

// Icon for the copy button
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v3.042m-7.332 0c-.055.194-.084.4-.084.612v3.042m0 0a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25m-7.5 0h7.5m-7.5 0a2.25 2.25 0 0 0-2.25 2.25v3c0 1.243 1.007 2.25 2.25 2.25h3c1.243 0 2.25-1.007 2.25-2.25v-3a2.25 2.25 0 0 0-2.25-2.25M15 12a2.25 2.25 0 0 1-2.25 2.25h-3a2.25 2.25 0 0 1-2.25-2.25m7.5 0h-7.5" />
    </svg>
);

const PromptMaker: React.FC = () => {
    const [brief, setBrief] = useState('');
    const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!brief.trim()) {
            setError('Vui lòng nhập tóm tắt hoặc ý tưởng.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedPrompts([]);

        try {
            const prompts = await generatePromptsFromBrief(brief);
            setGeneratedPrompts(prompts);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [brief]);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
                <h2 className="text-lg font-semibold text-text mb-2">Ý tưởng hoặc Tóm tắt</h2>
                <p className="text-sm text-muted mb-4">
                    Mô tả ý tưởng của bạn bằng vài từ. AI sẽ tạo ra các prompt chi tiết dựa trên đó.
                    <br />
                    Ví dụ: "một chú mèo đội mũ phi hành gia"
                </p>
                <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted"
                    placeholder="Nhập tóm tắt của bạn tại đây..."
                />
                <Button onClick={handleGenerate} disabled={isLoading} className="mt-4 w-full sm:w-auto">
                    {isLoading ? 'Đang tạo...' : 'Tạo Prompts'}
                </Button>
            </div>

            <div className="flex-1 mt-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Spinner />
                        <p className="mt-4 text-text">Đang tạo các prompt sáng tạo...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-center text-[#FF4444] p-4 bg-surface rounded-2xl border border-border">
                        <div>
                            <p className="font-semibold">Tạo thất bại</p>
                            <p className="text-sm mt-1">{error}</p>
                            <Button onClick={handleGenerate} className="mt-4" variant="secondary">Thử lại</Button>
                        </div>
                    </div>
                ) : generatedPrompts.length > 0 ? (
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold text-text">Các Prompt đã tạo</h3>
                        {generatedPrompts.map((prompt, index) => (
                            <div key={index} className="bg-surface border border-border rounded-lg p-4 flex justify-between items-start gap-4 shadow-sm">
                                <p className="text-sm text-text flex-1">{prompt}</p>
                                <Button variant="secondary" size="sm" onClick={() => handleCopy(prompt, index)}>
                                    {copiedIndex === index ? 'Đã sao chép!' : <CopyIcon />}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-muted bg-surface rounded-2xl border-2 border-dashed border-border">
                        <div>
                            <p className="font-semibold">Các prompt bạn tạo sẽ xuất hiện ở đây.</p>
                            <p className="text-sm">Nhập tóm tắt ở trên và nhấn "Tạo Prompts".</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptMaker;