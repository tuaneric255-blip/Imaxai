
import React, { useState, useCallback, useRef } from 'react';
import { generateLookbookAsset, consultLookbookShots, LookbookConsultation } from '../services/geminiService';
import { fileToBase64, processImageForGemini } from '../utils/fileUtils';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Tabs from './ui/Tabs';
import Slider from './ui/Slider';
import ZoomableImage from './ui/ZoomableImage';

type Category = 'clothing' | 'jewelry' | 'bags' | 'footwear' | 'other';

const CATEGORY_CONFIG: Record<Category, { label: string, angles: string[] }> = {
    clothing: {
        label: 'Thời trang (Quần áo)',
        angles: ['Front View (Trực diện)', 'Back View (Sau lưng)', 'Side View (Cạnh bên)', '3/4 Angle', 'Dynamic Movement (Chuyển động)']
    },
    jewelry: {
        label: 'Trang sức',
        angles: ['On-Model (Đeo trên người)', 'Flat Lay (Sắp đặt)', 'Macro Detail (Cận cảnh)', 'Side Profile', 'Perspective Shot']
    },
    bags: {
        label: 'Túi xách',
        angles: ['Front View', 'Side Profile', '3/4 Angle', 'On-Model (Đeo túi)', 'Interior Peek (Bên trong)']
    },
    footwear: {
        label: 'Giày dép',
        angles: ['Side Profile (Ngang)', 'Top-down (Từ trên xuống)', 'Front View (Mũi giày)', 'Heel Detail (Gót)', 'On-Model (Mang giày)']
    },
    other: {
        label: 'Khác / Nội thất',
        angles: ['Front View', 'Isometric 45°', 'Top-down', 'Detail Shot', 'In-Context']
    }
};

const Lookbook: React.FC = () => {
    // Inputs
    const [category, setCategory] = useState<Category>('clothing');
    const [productFile, setProductFile] = useState<File | null>(null);
    const [productPreview, setProductPreview] = useState<string | null>(null);
    
    // New Product Details
    const [productName, setProductName] = useState('');
    const [productFeatures, setProductFeatures] = useState('');
    const [productDescription, setProductDescription] = useState('');
    
    // Background State
    const [bgMode, setBgMode] = useState<'image' | 'prompt'>('prompt');
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const [bgPrompt, setBgPrompt] = useState('');

    // Model State
    const [modelMode, setModelMode] = useState<'image' | 'prompt'>('prompt');
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [modelPrompt, setModelPrompt] = useState('');

    // Settings
    const [modelLock, setModelLock] = useState(80);
    const [bgLock, setBgLock] = useState(70);
    const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
    
    // Special Shots
    const [isTextureMacro, setIsTextureMacro] = useState(false);
    
    // Multiple Functional Details
    const [functionalDetails, setFunctionalDetails] = useState<string[]>([]);
    const [currentDetailInput, setCurrentDetailInput] = useState('');
    
    const [isBrandDetail, setIsBrandDetail] = useState(false);
    const [isDetailCircle, setIsDetailCircle] = useState(false);
    const [isVariations, setIsVariations] = useState(false);

    // Consultant
    const [isConsulting, setIsConsulting] = useState(false);
    const [consultation, setConsultation] = useState<LookbookConsultation | null>(null);

    // Output
    const [generatedImages, setGeneratedImages] = useState<{type: string, src: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTask, setCurrentTask] = useState('');

    // Stop signal
    const isStoppedRef = useRef(false);

    const productInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const modelInputRef = useRef<HTMLInputElement>(null);

    const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProductFile(file);
            setProductPreview(URL.createObjectURL(file));
        }
    };

    const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBgFile(file);
            setBgPreview(URL.createObjectURL(file));
        }
    };

    const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setModelFile(file);
            setModelPreview(URL.createObjectURL(file));
        }
    };

    const toggleAngle = (angle: string) => {
        setSelectedAngles(prev => 
            prev.includes(angle) ? prev.filter(a => a !== angle) : [...prev, angle]
        );
    };

    const addFunctionalDetail = () => {
        if (currentDetailInput.trim()) {
            setFunctionalDetails([...functionalDetails, currentDetailInput.trim()]);
            setCurrentDetailInput('');
        }
    };

    const removeFunctionalDetail = (index: number) => {
        setFunctionalDetails(functionalDetails.filter((_, i) => i !== index));
    };

    const handleConsult = async () => {
        if (!productFile) {
            alert("Vui lòng tải ảnh sản phẩm trước khi tư vấn.");
            return;
        }
        setIsConsulting(true);
        try {
            const processed = await processImageForGemini(productFile);
            // Combine all available info for context
            const context = `Name: ${productName}. Features: ${productFeatures}. Desc: ${productDescription}`;
            const result = await consultLookbookShots(processed.data, processed.mimeType, context);
            setConsultation(result);
        } catch (e: any) {
            console.error(e);
            alert("Lỗi khi tư vấn: " + e.message);
        } finally {
            setIsConsulting(false);
        }
    };

    const applyConsultation = (shots: {shot_name: string}[]) => {
        const newAngles = [...selectedAngles];
        shots.forEach(s => {
            if (!newAngles.includes(s.shot_name)) {
                newAngles.push(s.shot_name);
            }
        });
        setSelectedAngles(newAngles);
    };

    const handleStop = () => {
        isStoppedRef.current = true;
        setCurrentTask('Đang dừng...');
    };

    const handleGenerate = useCallback(async () => {
        if (!productFile) {
            alert("Vui lòng tải ảnh sản phẩm gốc.");
            return;
        }
        
        // Basic Validation
        const hasAngles = selectedAngles.length > 0;
        const hasSpecial = isTextureMacro || functionalDetails.length > 0 || isBrandDetail || isDetailCircle || isVariations;

        if (!hasAngles && !hasSpecial) {
            alert("Vui lòng chọn ít nhất một kiểu ảnh (góc chụp hoặc chi tiết).");
            return;
        }

        setIsLoading(true);
        setGeneratedImages([]);
        isStoppedRef.current = false;
        
        try {
            // Process Product Image
            setCurrentTask('Đang xử lý ảnh đầu vào...');
            const processedProduct = await processImageForGemini(productFile);
            
            // Contexts
            let bgContext: { type: 'prompt' | 'image', value: string, mimeType?: string } = { 
                type: 'prompt', 
                value: bgPrompt || 'Professional studio lighting, neutral background' 
            };
            if (bgMode === 'image' && bgFile) {
                const processedBg = await processImageForGemini(bgFile);
                bgContext = { type: 'image', value: processedBg.data, mimeType: processedBg.mimeType };
            }

            let modelContext: { type: 'prompt' | 'image', value: string, mimeType?: string } = { 
                type: 'prompt', 
                value: modelPrompt || 'Professional fashion model, natural pose' 
            };
            if (modelMode === 'image' && modelFile) {
                const processedModel = await processImageForGemini(modelFile);
                modelContext = { type: 'image', value: processedModel.data, mimeType: processedModel.mimeType };
            }

            // Build Task List
            const tasks: string[] = [...selectedAngles];
            
            if (isTextureMacro) tasks.push('Texture Macro (Chất liệu)');
            if (isBrandDetail) tasks.push('Brand Tag / Lining (Mác/Lót)');
            if (isDetailCircle) tasks.push('Detail Circle Shot (Kính lúp)');
            
            // Add individual functional details as separate tasks
            functionalDetails.forEach(detail => {
                tasks.push(`Functional Detail: ${detail}`);
            });

            if (isVariations) {
                tasks.push('Variation 1');
                tasks.push('Variation 2');
                tasks.push('Variation 3');
                tasks.push('Variation 4');
            }

            // Expert Guidance from Consultation
            const guidance = consultation ? 
                `Material: ${consultation.material_analysis}. Lighting: ${consultation.lighting_suggestion}.` 
                : "";
            
            // Product Data
            const productDetails = {
                name: productName,
                features: productFeatures
            };

            for (let i = 0; i < tasks.length; i++) {
                if (isStoppedRef.current) {
                    alert('Tiến trình đã được dừng bởi người dùng.');
                    break;
                }

                const task = tasks[i];
                setCurrentTask(`Đang tạo (${i + 1}/${tasks.length}): ${task}...`);
                
                try {
                        const result = await generateLookbookAsset(
                        processedProduct.data,
                        processedProduct.mimeType,
                        task,
                        bgContext,
                        modelContext,
                        { modelLock, bgLock },
                        guidance,
                        productDetails
                    );
                    setGeneratedImages(prev => [...prev, { type: task, src: result }]); 
                } catch (e: any) {
                    console.error(`Failed to generate ${task}`, e);
                    // If it's a critical error (like Quota Exceeded bubbling up after retries), stop the queue
                    if (e.message?.includes('Quota') || e.message?.includes('quá tải')) {
                        alert(`Dừng tiến trình do lỗi hệ thống/quota: ${e.message}`);
                        break; 
                    }
                    // Otherwise continue to next task
                }

                // Add delay between tasks to be gentle on rate limits
                if (i < tasks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        } catch (error: any) {
            console.error(error);
            alert(`Có lỗi xảy ra: ${error.message}`);
        } finally {
            setIsLoading(false);
            setCurrentTask('');
            isStoppedRef.current = false;
        }

    }, [productFile, bgMode, bgFile, bgPrompt, modelMode, modelFile, modelPrompt, selectedAngles, isTextureMacro, functionalDetails, isBrandDetail, isDetailCircle, isVariations, modelLock, bgLock, consultation, productName, productFeatures]);


    const bgTabs = [
        {
            title: 'Gợi ý AI',
            content: (
                <textarea 
                    className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:ring-primary focus:outline-none"
                    rows={3}
                    placeholder="Mô tả bối cảnh..."
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                />
            )
        },
        {
            title: 'Tải ảnh nền',
            content: (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => bgInputRef.current?.click()}>
                    {bgPreview ? (
                        <img src={bgPreview} className="h-24 mx-auto object-contain rounded" alt="BG" />
                    ) : (
                        <div className="text-muted text-sm">Nhấn để tải ảnh bối cảnh</div>
                    )}
                    <input type="file" ref={bgInputRef} onChange={handleBgFileChange} className="hidden" accept="image/*" />
                </div>
            )
        }
    ];

    const modelTabs = [
         {
            title: 'Gợi ý AI',
            content: (
                <textarea 
                    className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:ring-primary focus:outline-none"
                    rows={3}
                    placeholder="Mô tả người mẫu (vd: Nữ, tóc vàng, dáng cao...)"
                    value={modelPrompt}
                    onChange={(e) => setModelPrompt(e.target.value)}
                />
            )
        },
        {
            title: 'Tải ảnh mẫu',
            content: (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => modelInputRef.current?.click()}>
                     {modelPreview ? (
                        <img src={modelPreview} className="h-24 mx-auto object-contain rounded" alt="Model" />
                    ) : (
                        <div className="text-muted text-sm">Nhấn để tải ảnh người mẫu</div>
                    )}
                    <input type="file" ref={modelInputRef} onChange={handleModelFileChange} className="hidden" accept="image/*" />
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-full">
            {/* Left Sidebar: Configuration */}
            <div className="w-full xl:w-[500px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* 1. Product & Category */}
                <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
                    <h3 className="font-semibold text-text mb-3">1. Sản phẩm & Danh mục</h3>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-text mb-2">Loại sản phẩm</label>
                        <select 
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value as Category);
                                setSelectedAngles([]); // Reset angles when category changes
                            }}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:ring-primary"
                        >
                            <option value="clothing">Thời trang (Quần áo)</option>
                            <option value="jewelry">Trang sức (Nhẫn, Dây chuyền)</option>
                            <option value="bags">Túi xách & Ví</option>
                            <option value="footwear">Giày dép</option>
                            <option value="other">Khác (Nội thất, Decor)</option>
                        </select>
                    </div>
                    
                    {/* New Product Info Fields */}
                    <div className="grid grid-cols-1 gap-3 mb-4">
                        <input
                            type="text"
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:ring-primary focus:outline-none"
                            placeholder="Tên sản phẩm (VD: Đầm lụa Maxi)"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
                         <textarea
                            className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:ring-primary focus:outline-none"
                            rows={2}
                            placeholder="Tính năng nổi bật (Hot features)..."
                            value={productFeatures}
                            onChange={(e) => setProductFeatures(e.target.value)}
                        />
                    </div>

                    <div className="aspect-video bg-background border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-primary transition-all relative overflow-hidden mb-4" onClick={() => productInputRef.current?.click()}>
                        {productPreview ? (
                            <img src={productPreview} alt="Product" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center text-muted">
                                <ProductIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <span className="text-sm font-medium">Tải ảnh sản phẩm</span>
                            </div>
                        )}
                        <input type="file" ref={productInputRef} onChange={handleProductChange} className="hidden" accept="image/*" />
                    </div>

                    <textarea
                        className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:ring-primary focus:outline-none mb-3"
                        rows={2}
                        placeholder="Mô tả thêm về chất liệu, kiểu dáng..."
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                    />
                    
                    <Button 
                        onClick={handleConsult} 
                        disabled={isConsulting || !productFile} 
                        variant="secondary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                    >
                        {isConsulting ? <Spinner /> : <span>✨ Tư vấn AI (Consultant)</span>}
                    </Button>

                    {/* Consultation Result Area */}
                    {consultation && (
                        <div className="mt-4 p-3 bg-background rounded-lg border border-primary/30 text-sm">
                            <p className="font-semibold text-primary mb-1">Gợi ý từ Chuyên gia:</p>
                            <p className="text-text mb-2 text-xs"><strong>Material:</strong> {consultation.material_analysis}</p>
                            <ul className="space-y-2 mb-3">
                                {consultation.recommended_shots.slice(0, 3).map((shot, idx) => (
                                    <li key={idx} className="bg-surface p-2 rounded border border-border text-xs">
                                        <strong>{shot.shot_name}:</strong> {shot.rationale}
                                    </li>
                                ))}
                            </ul>
                            <Button size="sm" onClick={() => applyConsultation(consultation.recommended_shots)} className="w-full text-xs">
                                Áp dụng gợi ý (Chọn góc chụp)
                            </Button>
                        </div>
                    )}
                </div>

                {/* 2. Context & Model */}
                <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-text">2. Bối cảnh</h3>
                            <span className="text-xs text-primary cursor-pointer" onClick={() => setBgMode(bgMode === 'image' ? 'prompt' : 'image')}>Chuyển đổi</span>
                        </div>
                        {bgMode === 'prompt' ? bgTabs[0].content : bgTabs[1].content}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-text">3. Người mẫu</h3>
                            <span className="text-xs text-primary cursor-pointer" onClick={() => setModelMode(modelMode === 'image' ? 'prompt' : 'image')}>Chuyển đổi</span>
                        </div>
                         {modelMode === 'prompt' ? modelTabs[0].content : modelTabs[1].content}
                    </div>

                    <div className="pt-2 border-t border-border">
                        <div className="mb-4">
                             <Slider label="Model Lock" value={modelLock} onChange={(e) => setModelLock(Number(e.target.value))} min={0} max={100} />
                        </div>
                        <div>
                             <Slider label="BG Lock" value={bgLock} onChange={(e) => setBgLock(Number(e.target.value))} min={0} max={100} />
                        </div>
                    </div>
                </div>

                 {/* 3. Output Settings */}
                 <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
                    <h3 className="font-semibold text-text mb-3">4. Góc chụp & Chi tiết</h3>
                    
                    {/* Dynamic Angles based on Category */}
                    <div className="mb-4">
                        <label className="text-sm font-medium text-text block mb-2">{CATEGORY_CONFIG[category].label}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORY_CONFIG[category].angles.map(angle => (
                                <label key={angle} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${selectedAngles.includes(angle) ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted hover:border-primary/50'}`}>
                                    <input type="checkbox" className="hidden" checked={selectedAngles.includes(angle)} onChange={() => toggleAngle(angle)} />
                                    <span className="text-[11px] font-medium leading-tight">{angle}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Special Detail Shots */}
                    <div className="space-y-3 pt-2 border-t border-border">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider">Đặc tả chi tiết (Close-up)</p>
                        
                        <label className={`flex items-center p-2.5 rounded-lg border cursor-pointer transition-all ${isTextureMacro ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-text hover:border-primary/50'}`}>
                            <input type="checkbox" className="mr-3 accent-primary w-4 h-4" checked={isTextureMacro} onChange={(e) => setIsTextureMacro(e.target.checked)} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Texture Macro</span>
                                <span className="text-[10px] opacity-70">Cận cảnh chất liệu vải/da/bề mặt</span>
                            </div>
                        </label>

                        {/* Split Functional Details */}
                        <div className="p-2.5 bg-background border border-border rounded-lg">
                             <label className="block text-sm font-medium text-text mb-2">Functional Detail (Chi tiết chức năng)</label>
                             <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    className="flex-1 bg-surface border border-border rounded p-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                    placeholder="VD: Khóa kéo, Cúc áo..."
                                    value={currentDetailInput}
                                    onChange={(e) => setCurrentDetailInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addFunctionalDetail()}
                                />
                                <Button size="sm" onClick={addFunctionalDetail} disabled={!currentDetailInput.trim()}>
                                    +
                                </Button>
                             </div>
                             {functionalDetails.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {functionalDetails.map((detail, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs border border-primary/20">
                                            {detail}
                                            <button onClick={() => removeFunctionalDetail(idx)} className="hover:text-red-500 font-bold ml-1">&times;</button>
                                        </span>
                                    ))}
                                </div>
                             )}
                             <p className="text-[10px] text-muted mt-1">Mỗi chi tiết sẽ tạo ra 1 ảnh riêng biệt.</p>
                        </div>

                         <label className={`flex items-center p-2.5 rounded-lg border cursor-pointer transition-all ${isBrandDetail ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-text hover:border-primary/50'}`}>
                            <input type="checkbox" className="mr-3 accent-primary w-4 h-4" checked={isBrandDetail} onChange={(e) => setIsBrandDetail(e.target.checked)} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Brand Tag / Lining</span>
                                <span className="text-[10px] opacity-70">Cận cảnh mác hoặc lót trong</span>
                            </div>
                        </label>

                         <label className={`flex items-center p-2.5 rounded-lg border cursor-pointer transition-all ${isDetailCircle ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-text hover:border-primary/50'}`}>
                            <input type="checkbox" className="mr-3 accent-primary w-4 h-4" checked={isDetailCircle} onChange={(e) => setIsDetailCircle(e.target.checked)} />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Magnified Circle</span>
                                <span className="text-[10px] opacity-70">Ảnh có vòng tròn phóng to chi tiết</span>
                            </div>
                        </label>
                        
                         <label className={`flex items-center p-2.5 rounded-lg border cursor-pointer transition-all ${isVariations ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-text hover:border-primary/50'}`}>
                            <input type="checkbox" className="mr-3 accent-primary w-4 h-4" checked={isVariations} onChange={(e) => setIsVariations(e.target.checked)} />
                            <span className="text-sm font-medium">Tạo 4 biến thể (Variations)</span>
                        </label>
                    </div>

                    <div className="flex gap-2 mt-6">
                        <Button onClick={handleGenerate} disabled={isLoading} className="flex-1 py-3 shadow-lg shadow-primary/20">
                            {isLoading ? 'Đang xử lý...' : 'Chụp Lookbook'}
                        </Button>
                        {isLoading && (
                            <Button onClick={handleStop} variant="danger" className="w-16 flex items-center justify-center">
                                ■
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Results */}
            <div className="flex-1 bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col min-h-[500px]">
                <h2 className="text-xl font-bold text-text mb-4 flex justify-between items-center">
                    <span>Kết quả Lookbook</span>
                    {isLoading && <span className="text-sm font-normal text-primary animate-pulse">{currentTask}</span>}
                </h2>
                
                <div className="flex-1 bg-background rounded-xl border-2 border-dashed border-border p-4 overflow-y-auto custom-scrollbar">
                    {generatedImages.length > 0 ? (
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                            {generatedImages.map((img, idx) => (
                                <div key={idx} className="break-inside-avoid bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
                                    <ZoomableImage src={img.src} alt={img.type} className="w-full h-auto">
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button size="sm" variant="secondary" onClick={(e) => {
                                                e.stopPropagation();
                                                const link = document.createElement('a');
                                                link.href = img.src;
                                                link.download = `lookbook-${img.type}-${idx}.png`;
                                                link.click();
                                            }}>Tải về</Button>
                                        </div>
                                    </ZoomableImage>
                                    <div className="p-2 bg-surface border-t border-border">
                                        <p className="text-xs font-medium text-text text-center truncate">{img.type}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="break-inside-avoid flex items-center justify-center h-40 bg-surface/50 rounded-lg border border-border">
                                    <Spinner />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted">
                             <ProductIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Chưa có ảnh nào được tạo</p>
                            <p className="text-sm max-w-md text-center mt-2">Nhập tên sản phẩm, chọn danh mục và góc chụp để bắt đầu.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductIcon = ({className}: {className?: string}) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

export default Lookbook;
