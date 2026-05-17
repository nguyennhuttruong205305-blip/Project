import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface KnobProps {
  label: string;
  color?: 'red' | 'blue';
  value?: number;
  onChange?: (val: number) => void;
}

export const Knob: React.FC<KnobProps> = ({ label, color = 'red', onChange }) => {
  const [angle, setAngle] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastY.current = e.clientY;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = lastY.current - e.clientY;
      const newAngle = Math.max(-140, Math.min(140, angle + delta * 2));
      setAngle(newAngle);
      lastY.current = e.clientY;
      if (onChange) onChange(newAngle);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [angle, onChange]);

  const isBlue = color === 'blue';

  return (
    <div className="flex flex-col items-center gap-3 cursor-pointer group">
      <div
        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all relative
          ${isBlue 
            ? 'border-blue-900/50 bg-linear-to-br from-[#222] to-[#0a0a0a]' 
            : 'border-[#1a1a1a] bg-linear-to-br from-[#222] to-[#0a0a0a]'}`}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="absolute w-1 h-7 top-1.5 rounded-full transform origin-bottom transition-colors"
          style={{ 
            transform: `rotate(${angle}deg)`, 
            backgroundColor: isBlue ? '#3b82f6' : '#dc2626',
            bottom: '50%'
          }}
        />
        <div className="w-14 h-14 rounded-full bg-[#111] border border-[#333] shadow-inner" />
      </div>
      <span className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">{label}</span>
    </div>
  );
};

interface FaderProps {
  color: string;
  name: string;
  value: number;
  onChange: (val: number) => void;
  vuLevel: number;
}

export const ChannelFader: React.FC<FaderProps> = ({ color, name, value, onChange, vuLevel }) => {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = (startY.current - e.clientY) * 1.5;
      const newVal = Math.max(0, Math.min(100, startVal.current + delta));
      onChange(newVal);
    };
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [value, onChange]);

  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-lg flex flex-col items-center py-4 px-2 gap-3 shadow-xl">
      <span className="text-[9px] font-bold text-gray-500 tracking-widest uppercase">{name}</span>
      <div className="w-2 h-16 bg-black rounded-full overflow-hidden relative border border-[#222]">
        <motion.div 
          className="absolute bottom-0 left-0 right-0 rounded-full"
          animate={{ height: `${vuLevel}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ backgroundColor: color }}
        />
      </div>
      <div 
        className="w-4 h-24 bg-[#111] rounded-full relative cursor-ns-resize border border-[#333] shadow-inner"
        onMouseDown={handleMouseDown}
      >
        <div 
          className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-red-900/40 to-transparent"
          style={{ height: `${value}%`, borderTop: `2px solid ${color}` }}
        />
      </div>
      <div className="flex flex-col gap-1.5 mt-1">
        <button className="w-7 py-1 text-[10px] font-bold text-orange-500/70 border border-[#222] rounded bg-black/40 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all">S</button>
        <button className="w-7 py-1 text-[10px] font-bold text-red-500/70 border border-[#222] rounded bg-black/40 hover:bg-red-500/10 hover:border-red-500/50 transition-all">M</button>
      </div>
    </div>
  );
};
