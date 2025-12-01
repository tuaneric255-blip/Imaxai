
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

    // Lock body scroll when modal is open to prevent background scrolling
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Mobile Safari fix to prevent rubber-banding if needed in future
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

    const handleClose = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsOpen(false);
        setIsZoomed(false);
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsZoomed(!isZoomed);
    };

    if (!src) return null;

    const Modal = (
        <div 
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col animate-in fade-in duration-200"
            onClick={handleClose} // Clicking the black background closes the modal
        >
             {/* Sticky Close Button (Fixed so it doesn't scroll away) */}
             <div className="absolute top-0 left-0 right-0 p-4 z-[10002] flex justify-end pointer-events-none">
                <button 
                    onClick={handleClose}
                    className="pointer-events-auto bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors shadow-lg border border-white/10 active:scale-95"
                    title="Đóng"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

             {/* Scrollable Container */}
            <div 
                className={`flex-1 w-full h-full overflow-auto custom-scrollbar flex ${isZoomed ? 'items-start justify-start' : 'items-center justify-center'}`}
            >
                <div className={`transition-all duration-300 ease-out ${isZoomed ? 'min-w-full min-h-full p-0' : 'p-4'}`}>
                    <img 
                        src={src} 
                        alt={alt} 
                        onClick={(e) => { 
                            // Stop propagation so clicking image toggles zoom instead of closing modal
                            toggleZoom(e); 
                        }}
                        className={`
                            select-none transition-transform duration-300
                            ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in rounded shadow-2xl'}
                        `}
                        style={{
                            // Zoom Logic:
                            // Fit: max 90% view, auto size.
                            // Zoom: 200% width (relative to screen), auto height.
                            maxWidth: isZoomed ? 'none' : '90vw',
                            maxHeight: isZoomed ? 'none' : '90vh',
                            width: isZoomed ? '200%' : 'auto', 
                            height: 'auto',
                            objectFit: 'contain',
                            margin: 'auto',
                            display: 'block'
                        }}
                        draggable={false}
                    />
                </div>
            </div>

            {/* Hint Badge */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10001] pointer-events-none whitespace-nowrap">
                <span className="bg-black/60 text-white/90 px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium shadow-lg border border-white/10">
                    {isZoomed ? 'Nhấn để thu nhỏ' : 'Nhấn để phóng to 200%'}
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
                {/* Thumbnail */}
                <img 
                    src={src} 
                    alt={alt} 
                    className="w-full h-full object-cover md:object-contain block transition-transform duration-300 group-hover:scale-105" 
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                
                {/* Zoom Icon Indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 text-white p-1.5 rounded-full pointer-events-none z-10 backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                    </svg>
                </div>

                {children}
            </div>

            {/* Render Modal at Root Level */}
            {isOpen && createPortal(Modal, document.body)}
        </>
    );
};

export default ZoomableImage;
