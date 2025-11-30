
import React from 'react';
import { ModuleId } from '../types';
import { FaceIcon, ProductIcon, LookbookIcon, TravelIcon, SettingsIcon } from '../constants';

interface MobileBottomBarProps {
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ activeModule, setActiveModule }) => {
  const menuItems = [
    { id: ModuleId.FACE_SAFE, label: 'Tạo ảnh', icon: <FaceIcon /> },
    { id: ModuleId.PRODUCT_FASHION, label: 'Sản phẩm', icon: <ProductIcon /> },
    { id: ModuleId.LOOKBOOK, label: 'Lookbook', icon: <LookbookIcon /> },
    { id: ModuleId.TRAVEL, label: 'Du lịch', icon: <TravelIcon /> },
    { id: ModuleId.SETTINGS, label: 'Cài đặt', icon: <SettingsIcon /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 md:hidden transition-colors duration-300 pb-safe">
      <div className="flex justify-around items-center p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full ${
              activeModule === item.id
                ? 'text-primary'
                : 'text-muted hover:text-text'
            }`}
          >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomBar;
