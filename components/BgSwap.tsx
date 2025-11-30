
import React, { useState, useCallback, useRef } from 'react';
import { swapBackground } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import ZoomableImage from './ui/ZoomableImage';

const BgSwap: React.FC = () => {
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [subjectPreview, setSubjectPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'subject' | 'background'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'subject') {
        setSubjectFile(file);
        setSubjectPreview(URL.createObjectURL(file));
      } else {
        setBackgroundFile(file);
        setBackgroundPreview(URL.createObjectURL(file));
      }
      setResultImage(null); 
      setError(null);
    }
  };

  const handleSwap = useCallback(async () => {
    if (!subjectFile) {
      setError('Vui lòng tải lên ảnh chủ thể.');
      return;
    }
    if (!backgroundFile) {
      setError('Vui lòng tải lên ảnh nền.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const [subjectBase64, backgroundBase64] = await Promise.all([
        fileToBase64(subjectFile),
        fileToBase64(backgroundFile),
      ]);
      
      const result = await swapBackground(
        subjectBase64,
        subjectFile.type,
        backgroundBase64,
        backgroundFile.type
      );
      setResultImage(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during background swap.');
    } finally {
      setIsLoading(false);
    }
  }, [subjectFile, backgroundFile]);

  const ImagePlaceholder: React.FC<{ onClick: () => void; title: string; }> = ({ onClick, title }) => (
    <div
      className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted cursor-pointer hover:border-primary transition-colors p-4"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
      </svg>
      <p className="font-semibold text-sm text-center">{title}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Inputs */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-surface rounded-2xl p-4 border border-border flex-1 flex flex-col shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh chủ thể</h2>
          <div className="flex-1 min-h-[200px]">
            {subjectPreview ? (
              <img src={subjectPreview} alt="Subject" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <ImagePlaceholder onClick={() => subjectInputRef.current?.click()} title="Tải ảnh chủ thể" />
            )}
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border flex-1 flex flex-col shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh nền mới</h2>
          <div className="flex-1 min-h-[200px]">
            {backgroundPreview ? (
              <img src={backgroundPreview} alt="Background" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <ImagePlaceholder onClick={() => backgroundInputRef.current?.click()} title="Tải ảnh nền" />
            )}
          </div>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
          <Button onClick={handleSwap} disabled={isLoading || !subjectFile || !backgroundFile} className="w-full">
            {isLoading ? 'Đang xử lý...' : 'Thay nền'}
          </Button>
        </div>
      </div>

      {/* Result */}
      <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border flex flex-col shadow-sm">
        <h2 className="text-xl font-semibold text-text mb-4 text-center">Kết quả</h2>
        <div className="flex-1 bg-background rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-auto p-4">
          {isLoading ? (
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-text">Đang ghép ảnh, vui lòng chờ...</p>
            </div>
          ) : error ? (
            <div className="text-center text-[#FF4444] p-4">
              <p className="font-semibold">Lỗi!</p>
              <p>{error}</p>
              <Button onClick={handleSwap} className="mt-4">Thử lại</Button>
            </div>
          ) : resultImage ? (
            <ZoomableImage src={resultImage} alt="Result" className="max-w-full max-h-full h-auto rounded-lg" />
          ) : (
             <div className="text-center text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p className="font-semibold">Kết quả sẽ hiển thị ở đây.</p>
                <p className="text-sm">Tải lên cả hai ảnh và nhấn "Thay nền".</p>
            </div>
          )}
        </div>
      </div>
      
      <input type="file" ref={subjectInputRef} onChange={(e) => handleFileChange(e, 'subject')} accept="image/*" className="hidden" />
      <input type="file" ref={backgroundInputRef} onChange={(e) => handleFileChange(e, 'background')} accept="image/*" className="hidden" />
    </div>
  );
};

export default BgSwap;
