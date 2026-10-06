import React, { useRef, useState, useEffect, useCallback } from 'react';

interface RotaryKnobProps {
  label: string;
  value: number; // -100 to +100 or 0 to 100
  min?: number;
  max?: number;
  defaultValue?: number;
  step?: number;
  color?: string; // hex or tailwind color
  size?: number; // px diameter
  unit?: string;
  onChange: (value: number) => void;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min = -100,
  max = 100,
  defaultValue = 0,
  step = 1,
  color = '#06b6d4',
  size = 48,
  unit = '%',
  onChange,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);

  // Map value to angle (-135deg to +135deg, 270 deg total travel)
  const range = max - min;
  const normalizedVal = (value - min) / range;
  const angle = -135 + normalizedVal * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY; // dragging up increases value
      const sensitivity = 0.8;
      const valueChange = (deltaY * sensitivity * range) / 150;
      let newVal = Math.round((startValRef.current + valueChange) / step) * step;
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(newVal);
    },
    [isDragging, max, min, onChange, range, step]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
    }
  };

  // Double click resets to defaultValue
  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  return (
    <div className="flex flex-col items-center select-none group">
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        title={`Double-click to reset (${label}: ${value}${unit})`}
        className="relative cursor-ns-resize touch-none flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer metallic bezel ring */}
        <div
          className="absolute inset-0 rounded-full bg-zinc-900 border border-zinc-700 shadow-inner"
          style={{
            boxShadow: isDragging ? `0 0 10px ${color}40, inset 0 2px 4px rgba(0,0,0,0.8)` : 'inset 0 2px 4px rgba(0,0,0,0.8)',
          }}
        />

        {/* Outer tick arc marks */}
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox="0 0 100 100"
          style={{ width: size, height: size }}
        >
          {/* Background arc track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#27272a"
            strokeWidth="3"
            strokeDasharray="197 100"
            strokeDashoffset="-66"
            strokeLinecap="round"
          />
          {/* Value colored active arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${normalizedVal * 197} 300`}
            strokeDashoffset="-66"
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        </svg>

        {/* Rotating center cap */}
        <div
          className="relative rounded-full bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 border border-zinc-600 shadow-md flex items-center justify-center transition-transform"
          style={{
            width: size * 0.72,
            height: size * 0.72,
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Top indicator notch line */}
          <div
            className="absolute top-1 w-1 rounded-full"
            style={{
              height: size * 0.22,
              backgroundColor: isDragging ? '#ffffff' : color,
              boxShadow: `0 0 4px ${color}`,
            }}
          />
          {/* Center metal rivet */}
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500/50" />
        </div>
      </div>

      {/* Label and readout */}
      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-1">
        {label}
      </span>
      <span className="text-[9px] font-mono-numbers text-zinc-400 group-hover:text-zinc-200">
        {value > 0 && min < 0 ? `+${value}` : value}
        {unit}
      </span>
    </div>
  );
};
