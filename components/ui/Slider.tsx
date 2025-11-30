
import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, ...props }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-text">{label}</label>
        <span className="text-sm font-mono bg-background border border-border px-2 py-1 rounded text-text">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
        {...props}
      />
    </div>
  );
};

export default Slider;