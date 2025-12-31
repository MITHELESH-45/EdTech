import React from "react";

export interface LedVisualProps {
  on: boolean;
  brightness: number; // 0 -> 1
  color: "red" | "yellow" | "green";
}

const LED_COLORS = {
  red: {
    body: "#7a1f1f",
    glow: { r: 255, g: 60, b: 60 },
  },
  yellow: {
    body: "#7a6a1f",
    glow: { r: 255, g: 215, b: 0 },
  },
  green: {
    body: "#1f7a3a",
    glow: { r: 60, g: 255, b: 140 },
  },
};

export function LedVisual({ on, brightness, color }: LedVisualProps) {
  const clampedBrightness = Math.max(0, Math.min(1, brightness));
  const colorDef = LED_COLORS[color] || LED_COLORS.red;
  
  // Calculate glow alpha: brightness * 0.6, clamped to max 0.6
  const glowAlpha = Math.min(clampedBrightness * 0.6, 0.6);
  
  // Construct rgba color for glow
  const glowColor = `rgba(${colorDef.glow.r}, ${colorDef.glow.g}, ${colorDef.glow.b}, ${glowAlpha})`;
  
  // Body opacity: full when ON, dimmed when OFF (max 0.6)
  const bodyOpacity = on ? 1 : 0.6;
  
  // Glow radius scales with brightness
  const glowRadius = 16 + clampedBrightness * 8;

  return (
    <g transform="translate(0, 0)">
      {/* Glow layer - only when ON */}
      {on && (
        <circle
          cx="0"
          cy="0"
          r={glowRadius}
          fill={glowColor}
          filter="url(#led-glow)"
          style={{
            transition: "opacity 0.3s ease",
          }}
        />
      )}
      
      {/* LED body */}
      <circle
        cx="0"
        cy="0"
        r="16"
        fill={colorDef.body}
        opacity={bodyOpacity}
        style={{
          transition: "opacity 0.3s ease",
        }}
      />
    </g>
  );
}

