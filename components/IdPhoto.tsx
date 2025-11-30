
import React, { useState, useCallback, useRef } from 'react';
import { generateIdPhoto } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import ZoomableImage from './ui/ZoomableImage';

const backgroundOptions = [
  { name: 'White', value: 'white' },
  { name: 'Light Blue', value: '#dbe9fa' },
  { name: 'Gray', value: '#e5e7eb' },
];

const IdPhoto: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState(backgroundOptions[0].value);
  const [addAttire, setAddAttire] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSourceFile(file);
      setPreview(URL.createObjectURL(file));
      setResultImage(null);
      setError(null);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) {
      setError('Vui lòng tải lên ảnh chân dung.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const base64Image = await fileToBase64(sourceFile);
      const result = await generateIdPhoto(base64Image, sourceFile.type, backgroundColor, addAttire);
      setResultImage(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during photo generation.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceFile, backgroundColor, addAttire]);

  const UploadPlaceholder = () => (
    <div
      className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted cursor-pointer hover:border-primary transition-colors p-4"
      onClick={() => fileInputRef.current?.click()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
      <p className="font-semibold text-center">Nhấn để tải ảnh chân dung</p>
      <p className="text-sm text-center">Mẹo: ảnh rõ mặt, nhìn thẳng</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Controls Panel */}
      <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-6">
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh gốc</h2>
          <div className="aspect-[3/4] w-full max-w-xs mx-auto">
            {preview ? (
              <img src={preview} alt="Source" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <UploadPlaceholder />
            )}
          </div>
        </div>
        
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-md font-semibold text-text mb-4">Tùy chọn</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-3">Màu nền</label>
              <div className="flex items-center gap-3">
                {backgroundOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setBackgroundColor(opt.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${backgroundColor === opt.value ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-surface' : 'border-gray-500'}`}
                    style={{ backgroundColor: opt.value }}
                    aria-label={`Select ${opt.name} background`}
                  />
                ))}
              </div>
            </div>
            <div>
               <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-text">Thêm trang phục công sở</span>
                <div className="relative">
                    <input type="checkbox" checked={addAttire} onChange={(e) => setAddAttire(e.target.checked)} className="sr-only" />
                    <div className={`block w-12 h-7 rounded-full transition ${addAttire ? 'bg-primary' : 'bg-background border border-border'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition transform shadow-sm ${addAttire ? 'translate-x-5' : ''}`}></div>
                </div>
                </label>
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 mt-auto rounded-2xl border border-border shadow-sm">
          <Button onClick={handleGenerate} disabled={isLoading || !sourceFile} className="w-full">
            {isLoading ? 'Đang tạo...' : 'Tạo ảnh thẻ'}
          </Button>
        </div>
      </div>

      {/* Result Panel */}
      <div className="flex-1 bg-surface rounded-2xl p-6 border border-border flex flex-col shadow-sm">
        <h2 className="text-xl font-semibold text-text mb-4 text-center">Kết quả</h2>
        <div className="flex-1 bg-background rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-auto p-4">
          {isLoading ? (
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-text">Đang xử lý ảnh...</p>
            </div>
          ) : error ? (
            <div className="text-center text-[#FF4444] p-4">
              <p className="font-semibold">Lỗi!</p>
              <p>{error}</p>
            </div>
          ) : resultImage ? (
            <div className="w-full p-4 bg-white grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {Array(15).fill(0).map((_, i) => (
                  <ZoomableImage key={i} src={resultImage} alt="ID Photo" className="w-full aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted p-4">
              <p className="font-semibold">Kết quả ảnh thẻ sẽ hiển thị ở đây.</p>
              <p className="text-sm">Tải ảnh lên và chọn tùy chọn để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,image/heic,image/heif" className="hidden" />
    </div>
  );
};

export default IdPhoto;
