
import React, { useState, useCallback, useRef } from 'react';
import { getImageDescription, ImageAnalysisResult } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';

// Icon for the copy button
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v3.042m-7.332 0c-.055.194-.084.4-.084.612v3.042m0 0a2.25 2.25 0 0 0 2.25 2.25h3a2.25 2.25 0 0 0 2.25-2.25m-7.5 0h7.5m-7.5 0a2.25 2.25 0 0 0-2.25 2.25v3c0 1.243 1.007 2.25 2.25 2.25h3c1.243 0 2.25-1.007 2.25-2.25v-3a2.25 2.25 0 0 0-2.25-2.25M15 12a2.25 2.25 0 0 1-2.25 2.25h-3a2.25 2.25 0 0 1-2.25-2.25m7.5 0h-7.5" />
    </svg>
);

const Img2Prompt: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSourceFile(file);
      setPreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!sourceFile) {
      setError('Vui lòng tải lên một ảnh để phân tích.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCopied(false);

    try {
      const base64Image = await fileToBase64(sourceFile);
      const result = await getImageDescription(base64Image, sourceFile.type);
      setAnalysisResult(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceFile]);
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const ResultDisplay = () => {
    if (!analysisResult) return null;
    return (
      <div className="space-y-6">
        <div>
          <label className="text-sm font-semibold text-text mb-2 flex justify-between items-center">
            Prompt
            <Button variant="secondary" size="sm" onClick={() => handleCopy(analysisResult.prompt)}>
              {copied ? 'Đã sao chép!' : <CopyIcon className="w-4 h-4" />}
            </Button>
          </label>
          <p className="text-sm bg-background p-3 rounded-lg border border-border text-text">{analysisResult.prompt}</p>
        </div>
        <div>
          <label className="text-sm font-semibold text-text mb-2 block">Negative Prompt</label>
          <p className="text-sm bg-background p-3 rounded-lg border border-border text-text">{analysisResult.negativePrompt}</p>
        </div>
         <div>
          <label className="text-sm font-semibold text-text mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-2">
            {analysisResult.tags.map((tag, index) => (
              <span key={index} className="bg-border text-xs text-text px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-sm font-semibold text-text mb-2 block">Camera</label>
                <p className="text-sm text-muted">{analysisResult.camera}</p>
            </div>
            <div>
                <label className="text-sm font-semibold text-text mb-2 block">Lighting</label>
                <p className="text-sm text-muted">{analysisResult.lighting}</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Left Panel: Input & Actions */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col">
        <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col items-center shadow-sm">
            <h2 className="text-lg font-semibold text-text mb-4">Ảnh tham chiếu</h2>
            <div 
              className="w-full aspect-square bg-background rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
                {preview ? (
                    <img src={preview} alt="Source Preview" className="w-full h-full object-contain rounded-lg"/>
                ) : (
                    <div className="text-center text-muted p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                        </svg>
                        <p className="text-sm font-medium">Nhấn để tải ảnh</p>
                    </div>
                )}
            </div>
             <p className="text-xs text-center text-muted mt-4">Tải ảnh lên để phân tích phong cách, ánh sáng, và bố cục.</p>
        </div>
         <div className="flex-shrink-0 bg-surface p-4 mt-4 rounded-2xl border border-border shadow-sm">
            <Button onClick={handleAnalyze} disabled={isLoading || !sourceFile} className="w-full">
                {isLoading ? 'Đang phân tích...' : 'Phân tích ảnh'}
            </Button>
        </div>
      </div>

      {/* Right Panel: Analysis Results */}
      <div className="flex-1 flex flex-col bg-surface rounded-2xl p-6 border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4">Kết quả phân tích</h2>
        <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <Spinner />
                    <p className="mt-4 text-text">Đang phân tích hình ảnh...</p>
                </div>
            ) : error ? (
                <div className="text-center text-[#FF4444] p-4 h-full flex items-center justify-center">
                    <p>{error}</p>
                </div>
            ) : analysisResult ? (
                <ResultDisplay />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted">
                    <Img2PromptIcon />
                    <p className="font-semibold mt-4">Kết quả phân tích sẽ xuất hiện ở đây.</p>
                    <p className="text-sm">Tải lên một ảnh và nhấn "Phân tích ảnh".</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const Img2PromptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);


export default Img2Prompt;