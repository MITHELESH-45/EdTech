import React from "react";

export interface LedVisualProps {
  on: boolean;
  brightness: number; // 0 -> 1
  color: "red" | "yellow" | "green";
}

const LED_COLORS = {
  red: {
    body: "#7a1f1f",
    glow: "rgb(255, 60, 60)",
  },
  yellow: {
    body: "#7a6a1f",
    glow: "rgb(255, 215, 0)",
  },
  green: {
    body: "#1f7a3a",
    glow: "rgb(60, 255, 140)",
  },
};

export function LedVisual({ on, brightness, color }: LedVisualProps) {
  const clampedBrightness = Math.max(0, Math.min(1, brightness));
  const colorDef = LED_COLORS[color] || LED_COLORS.red;

  return (
    <g transform="translate(0, 6)">
      {on && (
        <circle
          r={12 + clampedBrightness * 8}
          fill={colorDef.glow}
          opacity={clampedBrightness * 0.6}
          filter="url(#led-glow)"
        />
      )}

      <circle
        r={10}
        fill={colorDef.body}
        opacity={on ? 1 : 0.8}
      />
    </g>
  );
}

