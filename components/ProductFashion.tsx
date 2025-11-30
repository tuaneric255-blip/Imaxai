
import React, { useState, useCallback, useRef } from 'react';
import { tryOnFashion } from '../services/geminiService';
import { processImageForGemini } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import ZoomableImage from './ui/ZoomableImage';

const ProductFashion: React.FC = () => {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [category, setCategory] = useState('clothing');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'model' | 'product'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'model') {
        setModelFile(file);
        setModelPreview(URL.createObjectURL(file));
      } else {
        setProductFile(file);
        setProductPreview(URL.createObjectURL(file));
      }
      setResultImage(null);
      setError(null);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!modelFile) {
      setError('Vui lòng tải lên ảnh người mẫu.');
      return;
    }
    if (!productFile) {
      setError('Vui lòng tải lên ảnh sản phẩm.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      // Use processImageForGemini to handle conversions (e.g. AVIF -> JPEG)
      const [modelData, productData] = await Promise.all([
        processImageForGemini(modelFile),
        processImageForGemini(productFile),
      ]);
      
      const result = await tryOnFashion(
        modelData.data,
        modelData.mimeType,
        productData.data,
        productData.mimeType,
        category
      );
      setResultImage(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred during the try-on process.');
    } finally {
      setIsLoading(false);
    }
  }, [modelFile, productFile, category]);

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
        <div className="bg-surface rounded-2xl p-4 border border-border flex flex-col shadow-sm">
             <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-2">Loại sản phẩm</label>
                <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:ring-primary outline-none"
                >
                    <option value="clothing">Quần áo (Clothing)</option>
                    <option value="watch">Đồng hồ (Watch)</option>
                    <option value="jewelry">Trang sức (Jewelry)</option>
                    <option value="bag">Túi xách (Bag)</option>
                    <option value="shoes">Giày dép (Shoes)</option>
                </select>
            </div>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border flex-1 flex flex-col shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh người mẫu</h2>
          <div className="flex-1 min-h-[200px]">
            {modelPreview ? (
              <img src={modelPreview} alt="Model" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <ImagePlaceholder onClick={() => modelInputRef.current?.click()} title="Tải ảnh người mẫu" />
            )}
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border flex-1 flex flex-col shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh sản phẩm</h2>
          <div className="flex-1 min-h-[200px]">
            {productPreview ? (
              <img src={productPreview} alt="Product" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <ImagePlaceholder onClick={() => productInputRef.current?.click()} title="Tải ảnh sản phẩm" />
            )}
          </div>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
          <Button onClick={handleGenerate} disabled={isLoading || !modelFile || !productFile} className="w-full">
            {isLoading ? 'Đang xử lý...' : 'Thử đồ'}
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
              <p className="mt-4 text-text">Đang thử đồ, vui lòng chờ...</p>
            </div>
          ) : error ? (
            <div className="text-center text-[#FF4444] p-4">
              <p className="font-semibold">Lỗi!</p>
              <p>{error}</p>
              <Button onClick={handleGenerate} className="mt-4">Thử lại</Button>
            </div>
          ) : resultImage ? (
            <ZoomableImage src={resultImage} alt="Result" className="max-w-full max-h-full h-auto rounded-lg" />
          ) : (
             <div className="text-center text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <p className="font-semibold">Kết quả sẽ hiển thị ở đây.</p>
                <p className="text-sm">Chọn loại sản phẩm, tải ảnh lên và nhấn "Thử đồ".</p>
            </div>
          )}
        </div>
      </div>
      
      <input type="file" ref={modelInputRef} onChange={(e) => handleFileChange(e, 'model')} accept="image/*" className="hidden" />
      <input type="file" ref={productInputRef} onChange={(e) => handleFileChange(e, 'product')} accept="image/*" className="hidden" />
    </div>
  );
};

export default ProductFashion;
