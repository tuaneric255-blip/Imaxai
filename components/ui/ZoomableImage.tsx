
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ZoomableImageProps {
    src: string;
    alt?: string;
    className?: string;
    children?: React.ReactNode;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, className = "", children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
        setIsZoomed(false);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsZoomed(!isZoomed);
    };

    const Modal = (
        <div 
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
            onClick={handleClose}
        >
             {/* Close Button */}
             <button 
                onClick={handleClose}
                className="absolute top-4 right-4 z-[10002] bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition-colors cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>

             {/* Container for scrolling when zoomed */}
            <div 
                className={`w-full h-full overflow-auto custom-scrollbar flex ${isZoomed ? 'items-start justify-start' : 'items-center justify-center'}`}
                onClick={toggleZoom}
            >
                <div className={`${isZoomed ? 'min-w-full min-h-full p-8' : 'p-4'}`}>
                    <img 
                        src={src} 
                        alt={alt} 
                        onClick={(e) => { e.stopPropagation(); toggleZoom(e); }} // Clicking image toggles zoom
                        className={`transition-all duration-300 ease-out select-none ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                        style={{
                            maxWidth: isZoomed ? 'none' : '90vw',
                            maxHeight: isZoomed ? 'none' : '90vh',
                            width: isZoomed ? '200%' : 'auto', 
                            objectFit: 'contain',
                            margin: 'auto',
                            display: 'block'
                        }}
                    />
                </div>
            </div>

            {/* Hint */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10001] pointer-events-none">
                <span className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium">
                    {isZoomed ? 'Nhấn để thu nhỏ' : 'Nhấn để Zoom 200%'}
                </span>
            </div>
        </div>
    );

    return (
        <>
            <div 
                className={`relative group cursor-zoom-in overflow-hidden ${className}`} 
                onClick={handleOpen}
            >
                <img src={src} alt={alt} className="w-full h-full object-contain block" />
                
                {/* Plus Icon Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1.5 rounded-full pointer-events-none z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                    </svg>
                </div>

                {children}
            </div>

            {/* Use Portal to render outside root div, fixing stacking issues */}
            {isOpen && createPortal(Modal, document.body)}
        </>
    );
};

export default ZoomableImage;
