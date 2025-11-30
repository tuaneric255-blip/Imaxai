
import React, { useState, useCallback, useRef } from 'react';
import { inpaintImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Slider from './ui/Slider';
import ZoomableImage from './ui/ZoomableImage';

const Inpaint: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(40);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const setupCanvases = (img: HTMLImageElement) => {
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imageCanvas || !maskCanvas) return;

    const container = imageCanvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const scale = Math.min(1, containerWidth / img.width);
    const canvasWidth = img.width * scale;
    const canvasHeight = img.height * scale;

    imageCanvas.width = canvasWidth;
    imageCanvas.height = canvasHeight;
    maskCanvas.width = canvasWidth;
    maskCanvas.height = canvasHeight;

    const ctx = imageCanvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    
    clearMask();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSourceFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => setupCanvases(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      setResultImage(null);
      setError(null);
    }
  };

  const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(canvas, e);
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'white';

    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
  };

  const startDrawing = (e: React.MouseEvent) => {
    isDrawing.current = true;
    lastPos.current = getMousePos(maskCanvasRef.current!, e);
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // The model expects a black background with a white mask.
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) {
      setError('Vui lòng tải ảnh lên.');
      return;
    }
    if (!prompt.trim()) {
      setError('Vui lòng nhập prompt mô tả thay đổi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) {
      setIsLoading(false);
      setError("Canvas error.");
      return;
    }
    
    // Create a new canvas to resize mask to original image dimensions
    const originalImage = new Image();
    originalImage.src = URL.createObjectURL(sourceFile);
    await new Promise(resolve => { originalImage.onload = resolve; });

    const finalMaskCanvas = document.createElement('canvas');
    finalMaskCanvas.width = originalImage.width;
    finalMaskCanvas.height = originalImage.height;
    const finalMaskCtx = finalMaskCanvas.getContext('2d');
    if (!finalMaskCtx) {
        setError("Could not create final mask.");
        setIsLoading(false);
        return;
    }
    finalMaskCtx.drawImage(maskCanvas, 0, 0, originalImage.width, originalImage.height);
    const maskBase64 = finalMaskCanvas.toDataURL('image/png').split(',')[1];


    try {
      const sourceBase64 = await fileToBase64(sourceFile);
      const result = await inpaintImage(sourceBase64, sourceFile.type, maskBase64, prompt);
      setResultImage(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during inpainting.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceFile, prompt]);
  
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Left Panel: Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <Button onClick={() => fileInputRef.current?.click()} className="w-full">Tải ảnh gốc</Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <p className="text-xs text-muted mt-2 text-center">Tải ảnh bạn muốn chỉnh sửa.</p>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <label htmlFor="prompt" className="block text-sm font-medium text-text mb-2">Mô tả thay đổi</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted"
              placeholder="e.g., a pair of sunglasses on the cat"
            />
        </div>
         <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <Slider label="Kích thước cọ" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} min={5} max={100} step={1} />
            <Button onClick={clearMask} variant="secondary" size="sm" className="w-full mt-4">Xóa Mask</Button>
        </div>
        <div className="bg-surface p-4 mt-auto rounded-2xl border border-border shadow-sm">
          <Button onClick={handleGenerate} disabled={isLoading || !sourceFile} className="w-full">
            {isLoading ? 'Đang xử lý...' : 'Generate'}
          </Button>
        </div>
      </div>
      
      {/* Right Panel: Canvas and Result */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl p-4 border border-border flex flex-col shadow-sm">
            <h2 className="text-lg font-semibold text-text mb-4 text-center">Vẽ Mask để chỉnh sửa</h2>
            <div className="flex-1 w-full relative min-h-[300px] flex items-center justify-center">
                 {!sourceFile && (
                    <div className="text-center text-muted">
                        <p>Tải ảnh lên để bắt đầu.</p>
                    </div>
                 )}
                 <canvas ref={imageCanvasRef} className="absolute top-0 left-0" />
                 <canvas 
                    ref={maskCanvasRef} 
                    className="absolute top-0 left-0 cursor-crosshair opacity-70"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                 />
            </div>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border flex flex-col shadow-sm">
             <h2 className="text-lg font-semibold text-text mb-4 text-center">Kết quả</h2>
             <div className="flex-1 flex items-center justify-center bg-background rounded-lg border-2 border-dashed border-border p-2">
                {isLoading ? (
                    <div className="text-center">
                      <Spinner />
                      <p className="mt-4 text-text">Đang áp dụng thay đổi...</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-[#FF4444] p-4">
                        <p>{error}</p>
                    </div>
                ) : resultImage ? (
                    <ZoomableImage src={resultImage} alt="Inpainted Result" className="max-w-full max-h-full h-auto rounded" />
                ) : (
                    <div className="text-center text-muted">
                        <p>Kết quả sẽ hiển thị ở đây.</p>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Inpaint;
