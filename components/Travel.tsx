
import React, { useState, useCallback, useRef } from 'react';
import { generateTravelPhoto } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import ZoomableImage from './ui/ZoomableImage';

const popularLocations = [
    'Eiffel Tower, Paris',
    'Colosseum, Rome',
    'Statue of Liberty, New York',
    'Machu Picchu, Peru',
    'Great Wall of China',
    'Pyramids of Giza, Egypt',
    'Sydney Opera House, Australia',
    'Taj Mahal, India',
    'Santorini, Greece',
    'Shibuya Crossing, Tokyo',
];

const photoStyles = ['Photorealistic', 'Cinematic', 'Vintage', 'Anime Art', 'Fantasy Art'];
const timesOfDay = ['Daytime', 'Golden Hour', 'Twilight', 'Night', 'Blue Hour'];


const Travel: React.FC = () => {
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [subjectPreview, setSubjectPreview] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [style, setStyle] = useState(photoStyles[0]);
  const [timeOfDay, setTimeOfDay] = useState(timesOfDay[0]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubjectFile(file);
      setSubjectPreview(URL.createObjectURL(file));
      setResultImage(null);
      setError(null);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!subjectFile) {
      setError('Vui lòng tải lên ảnh chủ thể.');
      return;
    }
    if (!location.trim()) {
      setError('Vui lòng chọn hoặc nhập một địa điểm.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const subjectBase64 = await fileToBase64(subjectFile);
      const result = await generateTravelPhoto(subjectBase64, subjectFile.type, location, style, timeOfDay);
      setResultImage(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during photo generation.');
    } finally {
      setIsLoading(false);
    }
  }, [subjectFile, location, style, timeOfDay]);

  const UploadPlaceholder = () => (
    <div
      className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted cursor-pointer hover:border-primary transition-colors p-4"
      onClick={() => fileInputRef.current?.click()}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
      <p className="font-semibold text-center">Tải ảnh chân dung</p>
    </div>
  );
  
  const SelectControl: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-medium text-text mb-2">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23A2A6B3' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
  );


  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Controls Panel */}
      <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-6">
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-4 text-center">Ảnh chủ thể</h2>
          <div className="aspect-square w-full max-w-xs mx-auto">
            {subjectPreview ? (
              <img src={subjectPreview} alt="Subject" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <UploadPlaceholder />
            )}
          </div>
           <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full mt-4">
             {subjectFile ? 'Chọn ảnh khác' : 'Tải ảnh lên'}
           </Button>
        </div>
        
        <div className="bg-surface rounded-2xl p-6 border border-border space-y-4 shadow-sm">
          <div>
            <h3 className="text-md font-semibold text-text mb-2">Chọn địa điểm</h3>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary mb-2 placeholder-muted"
              placeholder="e.g., on a beach in Hawaii"
            />
            <div className="flex flex-wrap gap-2">
              {popularLocations.map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${location === loc ? 'bg-primary text-white' : 'bg-background text-muted hover:bg-border'}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <SelectControl label="Phong cách" value={style} onChange={(e) => setStyle(e.target.value)} options={photoStyles} />
          <SelectControl label="Thời gian trong ngày" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} options={timesOfDay} />
        </div>

        <div className="bg-surface p-4 mt-auto rounded-2xl border border-border shadow-sm">
          <Button onClick={handleGenerate} disabled={isLoading || !subjectFile || !location} className="w-full">
            {isLoading ? 'Đang tạo...' : 'Tạo ảnh du lịch'}
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
              <p className="mt-4 text-text">Đang ghép bạn vào địa điểm mơ ước...</p>
            </div>
          ) : error ? (
            <div className="text-center text-[#FF4444] p-4">
              <p className="font-semibold">Lỗi!</p>
              <p>{error}</p>
            </div>
          ) : resultImage ? (
            <ZoomableImage src={resultImage} alt="Travel result" className="max-w-full max-h-full h-auto rounded-lg" />
          ) : (
            <div className="text-center text-muted p-4">
              <p className="font-semibold">Ảnh du lịch của bạn sẽ xuất hiện ở đây.</p>
              <p className="text-sm">Tải ảnh lên, chọn địa điểm, và bắt đầu chuyến đi!</p>
            </div>
          )}
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};

export default Travel;
