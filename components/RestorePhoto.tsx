
import React, { useState, useCallback, useRef } from 'react';
import { restorePhoto } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import ZoomableImage from './ui/ZoomableImage';

const RestorePhoto: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSourceFile(file);
      setPreview(URL.createObjectURL(file));
      setRestoredImage(null);
      setError(null);
    }
  };

  const handleRestore = useCallback(async () => {
    if (!sourceFile) {
      setError('Vui lòng tải lên một ảnh để phục hồi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRestoredImage(null);

    try {
      const base64Image = await fileToBase64(sourceFile);
      const result = await restorePhoto(base64Image, sourceFile.type);
      setRestoredImage(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred during restoration.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceFile]);

  const UploadPlaceholder = () => (
    <div 
      className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted cursor-pointer hover:border-primary transition-colors p-4"
      onClick={() => fileInputRef.current?.click()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
      <p className="font-semibold text-center">Nhấn để tải ảnh cũ</p>
      <p className="text-sm text-center">hoặc kéo và thả ảnh vào đây</p>
    </div>
  );

  const ResultPlaceholder = () => (
    <div className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted p-4">
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v5.25m-4.5-5.25v5.25m8.25-5.25v5.25M3 10.5h18M3 15h18M3 4.5h18v15H3v-15Z" />
      </svg>
      <p className="font-semibold text-center">Ảnh đã phục hồi sẽ xuất hiện ở đây.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Left Panel: Input Image */}
        <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh gốc</h2>
          <div className="flex-1 min-h-[300px]">
            {preview ? (
              <img src={preview} alt="Source" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <UploadPlaceholder />
            )}
          </div>
        </div>

        {/* Right Panel: Restored Image */}
        <div className="bg-surface rounded-2xl p-6 border border-border flex flex-col shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh đã phục hồi</h2>
          <div className="flex-1 min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Spinner />
                <p className="mt-4 text-text text-center">Đang phục hồi, khử nhiễu, và tô màu...</p>
              </div>
            ) : error ? (
              <div className="text-center text-[#FF4444] p-4 h-full flex items-center justify-center">
                <p>{error}</p>
              </div>
            ) : restoredImage ? (
              <ZoomableImage src={restoredImage} alt="Restored" className="w-full h-full rounded-lg" />
            ) : (
              <ResultPlaceholder />
            )}
          </div>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="flex-shrink-0 bg-surface rounded-2xl p-4 border border-border mt-6 flex items-center justify-center gap-4 shadow-sm">
        <p className="text-sm text-muted hidden md:block">Tải lên ảnh cũ, mờ, hoặc bị xước để AI cải thiện chất lượng.</p>
        <Button onClick={handleRestore} disabled={isLoading || !sourceFile} className="w-full md:w-auto px-8">
          {isLoading ? 'Đang xử lý...' : 'Phục hồi ảnh'}
        </Button>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};

export default RestorePhoto;
