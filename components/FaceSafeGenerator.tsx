
import React, { useState, useCallback, useRef } from 'react';
import { generateFaceSafeImage, formatGeminiError } from '../services/geminiService';
import { processImageForGemini } from '../utils/fileUtils';
import Button from './ui/Button';
import Slider from './ui/Slider';
import Tabs from './ui/Tabs';
import Spinner from './ui/Spinner';
import ZoomableImage from './ui/ZoomableImage';
import { useToast } from './ui/Toast';

// --- Configuration Data ---

type Gender = 'male' | 'female';

interface StyleOption {
    id: string;
    name: string;        // Vietnamese Name for UI
    description: string; // Vietnamese Description for UI
    promptStyle: string; // English Description for AI Prompt
    defaultBg: string;   // English for AI Prompt
    defaultPose: string; // English for AI Prompt
}

const STYLES: Record<Gender, StyleOption[]> = {
    female: [
        { 
            id: 'business', 
            name: 'Doanh nhân (Business)', 
            description: 'Vest may đo chuyên nghiệp, thần thái tự tin', 
            promptStyle: 'Professional tailored suit, confident look',
            defaultBg: 'Modern office with glass windows', 
            defaultPose: 'Standing confident with crossed arms or holding a tablet' 
        },
        { 
            id: 'casual', 
            name: 'Dạo phố (Casual Street)', 
            description: 'Quần jeans, áo thun thoải mái, đời thường', 
            promptStyle: 'Relaxed jeans and t-shirt, everyday vibe',
            defaultBg: 'Blurry city street with cafe in background', 
            defaultPose: 'Walking naturally or leaning on a wall' 
        },
        { 
            id: 'school', 
            name: 'Nữ sinh (School)', 
            description: 'Đồng phục học đường, trẻ trung, tươi sáng', 
            promptStyle: 'Academy uniform, youthful and bright',
            defaultBg: 'University campus library or hallway', 
            defaultPose: 'Holding books, smiling slightly' 
        },
        { 
            id: 'sport', 
            name: 'Thể thao (Sport/Gym)', 
            description: 'Đồ tập gym, năng động, khỏe khoắn', 
            promptStyle: 'Athletic wear, yoga pants and crop top',
            defaultBg: 'High-end gym or outdoor yoga park', 
            defaultPose: 'Stretching or jogging mid-action' 
        },
        { 
            id: 'evening', 
            name: 'Dạ hội (Evening Gown)', 
            description: 'Đầm dạ hội dài sang trọng, thảm đỏ', 
            promptStyle: 'Elegant long dress, red carpet style',
            defaultBg: 'Luxury gala event with bokeh lights', 
            defaultPose: 'Elegant standing pose, hand on hip' 
        },
        { 
            id: 'vintage', 
            name: 'Cổ điển (Vintage 50s)', 
            description: 'Váy chấm bi retro, trang điểm cổ điển', 
            promptStyle: 'Retro polka dot dress, classic makeup',
            defaultBg: 'Old American diner or vintage car', 
            defaultPose: 'Playful retro pose' 
        },
        { 
            id: 'cyberpunk', 
            name: 'Cyberpunk (Tương lai)', 
            description: 'Trang phục neon, công nghệ cao, bí ẩn', 
            promptStyle: 'Futuristic neon outfit, techwear',
            defaultBg: 'Neon-lit rainy futuristic city street', 
            defaultPose: 'Looking over shoulder, mysterious' 
        },
        { 
            id: 'boho', 
            name: 'Boho (Mùa hè)', 
            description: 'Váy hoa, phóng khoáng, biển cả', 
            promptStyle: 'Flowy floral dress, beach vibes',
            defaultBg: 'Sunset beach or flower field', 
            defaultPose: 'Twirling or looking at sunset' 
        },
        { 
            id: 'winter', 
            name: 'Mùa đông (Cozy Winter)', 
            description: 'Áo len rộng, khăn quàng, ấm cúng', 
            promptStyle: 'Oversized sweater, scarf, warm look',
            defaultBg: 'Snowy street or beside a fireplace', 
            defaultPose: 'Holding a hot cup, cozy posture' 
        },
        { 
            id: 'minimal', 
            name: 'Tối giản (Minimalist)', 
            description: 'Màu đơn sắc, đường nét tinh tế', 
            promptStyle: 'Solid colors, clean lines, high fashion',
            defaultBg: 'Solid studio color background', 
            defaultPose: 'High fashion artistic pose' 
        },
    ],
    male: [
        { 
            id: 'business', 
            name: 'Doanh nhân (Business)', 
            description: 'Vest xanh navy, sơ mi trắng, lịch lãm', 
            promptStyle: 'Navy bespoke suit, crisp white shirt',
            defaultBg: 'Corporate boardroom or skyscraper view', 
            defaultPose: 'Adjusting cuff or standing confident' 
        },
        { 
            id: 'casual', 
            name: 'Lịch sự (Smart Casual)', 
            description: 'Quần Chinos, áo polo, thoải mái', 
            promptStyle: 'Chinos, polo shirt, relaxed fit',
            defaultBg: 'Coffee shop or park bench', 
            defaultPose: 'Sitting relaxed or walking' 
        },
        { 
            id: 'sport', 
            name: 'Thể thao (Athlete)', 
            description: 'Đồ tập gym, cơ bắp, hiệu suất cao', 
            promptStyle: 'Performance gym gear, muscular definition',
            defaultBg: 'Stadium track or weight room', 
            defaultPose: 'Running or lifting weights' 
        },
        { 
            id: 'school', 
            name: 'Sinh viên (Student)', 
            description: 'Áo hoodie, balo, giản dị', 
            promptStyle: 'Casual hoodie and backpack',
            defaultBg: 'College campus green', 
            defaultPose: 'Walking with backpack' 
        },
        { 
            id: 'tuxedo', 
            name: 'Tuxedo (Black Tie)', 
            description: 'Tuxedo đen cổ điển, nơ, trang trọng', 
            promptStyle: 'Classic black tuxedo, bow tie',
            defaultBg: 'Grand ballroom or opera house', 
            defaultPose: 'Formal stance, hands in pockets' 
        },
        { 
            id: 'streetwear', 
            name: 'Đường phố (Streetwear)', 
            description: 'Hoodie rộng, giày sneaker, cá tính', 
            promptStyle: 'Oversized hoodie, sneakers, hypebeast',
            defaultBg: 'Urban graffiti wall or subway station', 
            defaultPose: 'Crouching or leaning cool' 
        },
        { 
            id: 'cyberpunk', 
            name: 'Cyberpunk', 
            description: 'Techwear chiến thuật, điểm nhấn neon', 
            promptStyle: 'Tactical techwear, neon accents',
            defaultBg: 'Cyberpunk alleyway with holograms', 
            defaultPose: 'Action ready stance' 
        },
        { 
            id: 'leather', 
            name: 'Áo da (Edgy Leather)', 
            description: 'Áo khoác da, áo thun trắng, phong cách Rock', 
            promptStyle: 'Leather jacket, white tee, rock style',
            defaultBg: 'Brick wall or motorcycle', 
            defaultPose: 'Looking cool, thumbs in pockets' 
        },
        { 
            id: 'vacation', 
            name: 'Nghỉ mát (Vacation)', 
            description: 'Áo sơ mi linen, quần short, kính mát', 
            promptStyle: 'Linen shirt, shorts, sunglasses',
            defaultBg: 'Tropical resort pool side', 
            defaultPose: 'Relaxed, holding a drink' 
        },
        { 
            id: 'minimal', 
            name: 'Tối giản (Studio)', 
            description: 'Áo cổ lọ, thẩm mỹ sạch sẽ', 
            promptStyle: 'Turtleneck, clean aesthetic',
            defaultBg: 'Grey studio background', 
            defaultPose: 'Portrait headshot focus' 
        },
    ]
};

const LIGHTING_OPTIONS = [
    'Cinematic Lighting (Dramatic)',
    'Soft Studio Lighting (Flattering)',
    'Natural Sunlight (Golden Hour)',
    'Neon Lights (Cyberpunk)',
    'Rembrandt Lighting (Moody)',
    'Flat Lighting (Bright/Even)'
];

const CAMERA_OPTIONS = [
    '85mm Portrait Lens (Blurry Background)',
    '35mm Wide Angle (Contextual)',
    '50mm Standard',
    'Low Angle (Heroic)',
    'High Angle',
    'Close-up Headshot'
];

const FaceSafeGenerator: React.FC = () => {
    // Inputs
    const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    
    // Config State
    const [gender, setGender] = useState<Gender>('female');
    const [selectedStyleId, setSelectedStyleId] = useState<string>(STYLES['female'][0].id);
    
    const [bgMode, setBgMode] = useState<'auto' | 'custom'>('auto');
    const [customBgPrompt, setCustomBgPrompt] = useState('');
    
    const [lighting, setLighting] = useState(LIGHTING_OPTIONS[1]);
    const [camera, setCamera] = useState(CAMERA_OPTIONS[0]);
    
    // Tech Settings
    const [negativePrompt, setNegativePrompt] = useState('mutated face, deformed, ugly, bad anatomy, extra limbs, blurry, low quality');
    const [faceLock, setFaceLock] = useState(85);
    
    // Output
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files: File[] = [...(event.target.files || [])].slice(0, 3);
        setReferenceFiles(files);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
    };

    const handleGenerate = useCallback(async () => {
        if (referenceFiles.length === 0) {
            addToast('Vui lòng tải lên ít nhất một ảnh tham chiếu.', 'warning');
            return;
        }

        setIsLoading(true);
        setGeneratedImages([]);

        try {
            // Get selected style details
            const currentStyle = STYLES[gender].find(s => s.id === selectedStyleId) || STYLES[gender][0];

            // Construct Prompt using English descriptions (promptStyle)
            let prompt = `A highly photorealistic portrait of a ${gender}, ${currentStyle.promptStyle}. `;
            
            // Context (BG & Pose)
            if (bgMode === 'auto') {
                prompt += `Context/Background: ${currentStyle.defaultBg}. `;
                prompt += `Pose: ${currentStyle.defaultPose}, naturally fitting the scene. `;
            } else {
                prompt += `Context/Background: ${customBgPrompt}. `;
                prompt += `Pose: Auto-generated dynamic pose suitable for this custom background. `;
            }

            // Tech Specs
            prompt += `Lighting: ${lighting}. Camera: ${camera}. `;
            prompt += `Face Match: Ensure the face strongly resembles the reference image provided (Lock Strength: ${faceLock}%).`;

            // Process Image (AVIF check)
            const referenceFile = referenceFiles[0];
            const processedImage = await processImageForGemini(referenceFile);

            const result = await generateFaceSafeImage(
                prompt,
                negativePrompt,
                processedImage.data,
                processedImage.mimeType,
                faceLock
            );
            setGeneratedImages([result]);
        } catch (e: any) {
            console.error(e);
            addToast(formatGeminiError(e), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [referenceFiles, gender, selectedStyleId, bgMode, customBgPrompt, lighting, camera, negativePrompt, faceLock, addToast]);

    // Derived state for UI
    const currentStyleList = STYLES[gender];

    const tabs = [
        {
            title: 'Cài đặt Nâng cao',
            content: (
                <div className="space-y-6 p-1">
                     <div>
                        <label className="block text-sm font-medium text-text mb-2">Ánh sáng (Lighting)</label>
                        <select 
                            value={lighting}
                            onChange={(e) => setLighting(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:ring-primary outline-none"
                        >
                            {LIGHTING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Góc máy (Camera)</label>
                         <select 
                            value={camera}
                            onChange={(e) => setCamera(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:ring-primary outline-none"
                        >
                            {CAMERA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <Slider label={`Face Lock Strength (${faceLock}%)`} value={faceLock} onChange={(e) => setFaceLock(Number(e.target.value))} min={0} max={100} step={1} />
                        <p className="text-xs text-muted mt-1">Cao hơn = Giống ảnh gốc hơn (nhưng có thể ít sáng tạo hơn).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">Negative Prompt</label>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted"
                        />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col xl:flex-row gap-8 h-full">
            {/* Left Panel: Inputs & Configuration */}
            <div className="w-full xl:w-[480px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* 1. Reference Image */}
                <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-text">1. Ảnh tham chiếu</h2>
                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Tải ảnh lên</Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {previews.map((src, index) => (
                            <div key={index} className="aspect-square bg-background rounded-lg overflow-hidden border border-border">
                                <img src={src} alt={`Ref ${index + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {Array(3 - previews.length).fill(0).map((_, index) => (
                            <div key={index} className="aspect-square bg-background rounded-lg border border-dashed border-border flex items-center justify-center text-muted cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Style & Gender */}
                <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
                    <h2 className="text-lg font-semibold text-text mb-4">2. Phong cách & Giới tính</h2>
                    
                    {/* Gender Toggle */}
                    <div className="flex bg-background rounded-lg p-1 border border-border mb-4">
                        <button 
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${gender === 'female' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                            onClick={() => { setGender('female'); setSelectedStyleId(STYLES['female'][0].id); }}
                        >
                            Nữ (Female)
                        </button>
                        <button 
                             className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${gender === 'male' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                             onClick={() => { setGender('male'); setSelectedStyleId(STYLES['male'][0].id); }}
                        >
                            Nam (Male)
                        </button>
                    </div>

                    {/* Style Grid */}
                    <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                        {currentStyleList.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyleId(style.id)}
                                className={`text-left p-2.5 rounded-lg border transition-all ${
                                    selectedStyleId === style.id 
                                    ? 'bg-primary/10 border-primary shadow-sm' 
                                    : 'bg-background border-border hover:border-primary/50'
                                }`}
                            >
                                <div className={`font-medium text-sm ${selectedStyleId === style.id ? 'text-primary' : 'text-text'}`}>
                                    {style.name}
                                </div>
                                <div className="text-[10px] text-muted truncate mt-0.5">
                                    {style.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Context & Background */}
                <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                         <h2 className="text-lg font-semibold text-text">3. Bối cảnh & Tư thế</h2>
                         <div className="flex items-center bg-background rounded p-0.5 border border-border">
                            <button 
                                className={`px-2 py-1 text-xs rounded transition-colors ${bgMode === 'auto' ? 'bg-primary text-white' : 'text-muted'}`}
                                onClick={() => setBgMode('auto')}
                            >Auto</button>
                            <button 
                                className={`px-2 py-1 text-xs rounded transition-colors ${bgMode === 'custom' ? 'bg-primary text-white' : 'text-muted'}`}
                                onClick={() => setBgMode('custom')}
                            >Custom</button>
                         </div>
                    </div>

                    {bgMode === 'auto' ? (
                        <div className="p-3 bg-background border border-border rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✨</span>
                                <div>
                                    <p className="text-sm font-medium text-text">AI tự động đề xuất (Based on {currentStyleList.find(s => s.id === selectedStyleId)?.name}):</p>
                                    <p className="text-xs text-muted mt-1">
                                        Context: {currentStyleList.find(s => s.id === selectedStyleId)?.defaultBg}
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        Pose: {currentStyleList.find(s => s.id === selectedStyleId)?.defaultPose}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                             <textarea
                                value={customBgPrompt}
                                onChange={(e) => setCustomBgPrompt(e.target.value)}
                                rows={2}
                                className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:ring-primary"
                                placeholder="Nhập mô tả bối cảnh và tư thế mong muốn..."
                            />
                        </div>
                    )}
                </div>
                
                {/* Advanced Settings Tab Container */}
                <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <Tabs tabs={tabs} />
                </div>

                 <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm mt-auto sticky bottom-0 z-10">
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full py-3 text-base shadow-lg shadow-primary/20">
                        {isLoading ? 'Đang sáng tạo...' : 'Tạo ảnh ngay'}
                    </Button>
                </div>
            </div>

            {/* Right Panel: Preview & Results */}
            <div className="flex-1 flex flex-col bg-surface rounded-2xl p-6 border border-border shadow-sm min-h-[500px]">
                <h2 className="text-xl font-bold text-text mb-4">Kết quả</h2>
                
                <div className="flex-1 bg-background rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-auto p-4 relative">
                    {isLoading ? (
                        <div className="text-center z-10">
                            <Spinner />
                            <p className="mt-4 text-text font-medium animate-pulse">AI đang vẽ style {currentStyleList.find(s => s.id === selectedStyleId)?.name}...</p>
                            <p className="text-xs text-muted mt-1">Đang tinh chỉnh ánh sáng & góc máy</p>
                        </div>
                    ) : generatedImages.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 w-full h-full content-start">
                            {generatedImages.map((src, index) => (
                                <ZoomableImage key={index} src={src} alt={`Generated image ${index + 1}`} className="max-w-full max-h-[80vh] h-auto mx-auto rounded-lg shadow-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted">
                            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 opacity-50">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                </svg>
                            </div>
                            <p className="font-semibold text-lg">Sẵn sàng sáng tạo</p>
                            <p className="text-sm mt-2 max-w-xs mx-auto">Chọn giới tính, phong cách và tải ảnh của bạn để AI tạo ra phiên bản độc đáo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaceSafeGenerator;
