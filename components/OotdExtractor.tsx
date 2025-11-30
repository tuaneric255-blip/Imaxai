
import React, { useState, useCallback, useRef } from 'react';
import { extractOutfitFromImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import ZoomableImage from './ui/ZoomableImage';

const OotdExtractor: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedImage, setExtractedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSourceFile(file);
      setPreview(URL.createObjectURL(file));
      setExtractedImage(null);
      setError(null);
    }
  };

  const handleExtract = useCallback(async () => {
    if (!sourceFile) {
      setError('Vui lòng tải lên một ảnh để xử lý.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedImage(null);

    try {
      const base64Image = await fileToBase64(sourceFile);
      const result = await extractOutfitFromImage(base64Image, sourceFile.type);
      setExtractedImage(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred during extraction.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceFile]);

  const UploadPlaceholder = () => (
    <div 
      className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted cursor-pointer hover:border-primary transition-colors"
      onClick={() => fileInputRef.current?.click()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
      <p className="font-semibold">Nhấn để tải ảnh lên</p>
      <p className="text-sm">hoặc kéo và thả ảnh vào đây</p>
    </div>
  );

  const ResultPlaceholder = () => (
    <div className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted">
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.353-.026.692-.026 1.038 0 1.13.094 1.976 1.057 1.976 2.192v1.392m-7.5 0h14.382c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125V8.625c0-.621.504-1.125 1.125-1.125Z" />
      </svg>
      <p className="font-semibold">Trang phục được tách sẽ xuất hiện ở đây.</p>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Left Panel: Input Image */}
      <div className="flex-1 flex flex-col bg-surface rounded-2xl p-6 border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4">Ảnh gốc</h2>
        <div className="flex-1 min-h-[300px] md:min-h-0">
          {preview ? (
            <img src={preview} alt="Source" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <UploadPlaceholder />
          )}
        </div>
      </div>

      {/* Right Panel: Extracted Outfit */}
      <div className="flex-1 flex flex-col bg-surface rounded-2xl p-6 border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-text mb-4">Trang phục đã tách</h2>
        <div className="flex-1 min-h-[300px] md:min-h-0" style={{backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)'}}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Spinner />
              <p className="mt-4 text-text">Đang tách trang phục...</p>
            </div>
          ) : error ? (
            <div className="text-center text-[#FF4444] p-4 h-full flex items-center justify-center">
              <p>{error}</p>
            </div>
          ) : extractedImage ? (
             <ZoomableImage src={extractedImage} alt="Extracted Outfit" className="w-full h-full" />
          ) : (
            <ResultPlaceholder />
          )}
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-surface rounded-2xl p-4 border border-border self-start shadow-sm">
        <p className="text-sm text-muted mb-4">Tải lên một hình ảnh có người để tự động trích xuất trang phục của họ ra khỏi nền.</p>
        <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full mb-3">
          Chọn ảnh khác
        </Button>
        <Button onClick={handleExtract} disabled={isLoading || !sourceFile} className="w-full">
          {isLoading ? 'Đang xử lý...' : 'Tách trang phục'}
        </Button>
      </div>

    </div>
  );
};

export default OotdExtractor;
