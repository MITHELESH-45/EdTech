import { useMemo, memo } from "react";

interface BreadboardVisualProps {
  hoveredTerminal?: string | null;
  wireMode?: boolean;
}

// Breadboard configuration - MUST match simulation-engine.ts exactly
const NUM_COLS = 30;
const PIN_SPACING = 8;
const START_X = -(NUM_COLS * PIN_SPACING) / 2 + PIN_SPACING / 2; // -116

// Row configurations matching simulation-engine.ts offsets
const TOP_ROWS = [
  { id: "a", y: -35 },
  { id: "b", y: -27 },
  { id: "c", y: -19 },
  { id: "d", y: -11 },
  { id: "e", y: -3 },
];

const BOTTOM_ROWS = [
  { id: "f", y: 13 },
  { id: "g", y: 21 },
  { id: "h", y: 29 },
  { id: "i", y: 37 },
  { id: "j", y: 45 },
];

// Power rail configurations
const POWER_RAILS = {
  topPower: { y: -50, type: "power" as const },
  topGnd: { y: -43, type: "ground" as const },
  bottomPower: { y: 52, type: "power" as const },
  bottomGnd: { y: 59, type: "ground" as const },
};

/**
 * Determines if a terminal is in the same electrically-connected strip as the hovered terminal.
 * This reflects REAL breadboard connectivity:
 * - Terminal strips: a-e in same column are connected, f-j in same column are connected
 * - Power rails: entire rail is connected
 * - Center trench isolates a-e from f-j
 */
function isInSameConnectedStrip(terminalId: string, hoveredTerminalId: string | null): boolean {
  if (!hoveredTerminalId) return false;
  if (terminalId === hoveredTerminalId) return true;
  
  // Parse terminal IDs
  const termMatch = terminalId.match(/^([a-j])(\d+)$/);
  const hoverMatch = hoveredTerminalId.match(/^([a-j])(\d+)$/);
  
  // Check if both are terminal strip pins (a-j rows)
  if (termMatch && hoverMatch) {
    const [, termRow, termCol] = termMatch;
    const [, hoverRow, hoverCol] = hoverMatch;
    
    // Must be same column
    if (termCol !== hoverCol) return false;
    
    // Check if both are on same side of trench
    const topRows = ['a', 'b', 'c', 'd', 'e'];
    const bottomRows = ['f', 'g', 'h', 'i', 'j'];
    
    const termIsTop = topRows.includes(termRow);
    const hoverIsTop = topRows.includes(hoverRow);
    
    // Same side of trench = connected
    return termIsTop === hoverIsTop;
  }
  
  // Check power rails - entire rail is one net
  if (terminalId.startsWith("power-top-") && hoveredTerminalId.startsWith("power-top-")) return true;
  if (terminalId.startsWith("gnd-top-") && hoveredTerminalId.startsWith("gnd-top-")) return true;
  if (terminalId.startsWith("power-bottom-") && hoveredTerminalId.startsWith("power-bottom-")) return true;
  if (terminalId.startsWith("gnd-bottom-") && hoveredTerminalId.startsWith("gnd-bottom-")) return true;
  
  return false;
}

// Pin component with hover effects and larger hit area
const Pin = memo(function Pin({
  x,
  y,
  id,
  type,
  isHovered,
  isInConnectedStrip,
  wireMode,
}: {
  x: number;
  y: number;
  id: string;
  type: "signal" | "power" | "ground";
  isHovered: boolean;
  isInConnectedStrip: boolean; // True if this pin is electrically connected to the hovered pin
  wireMode?: boolean;
}) {
  // Colors for different states
  const getPinStyle = () => {
    // Directly hovered pin - strongest highlight with prominent glow
    if (isHovered) {
      return {
        fill: type === "power" ? "#dc2626" : type === "ground" ? "#2563eb" : "#22c55e",
        stroke: "#ffffff",
        strokeWidth: 2.5,
        innerFill: "rgba(255,255,255,0.8)",
        scale: 1.5,
      };
    }
    // Pin in same connected strip - shows electrical connectivity
    if (isInConnectedStrip) {
      return {
        fill: type === "power" ? "#ef4444" : type === "ground" ? "#3b82f6" : "#4ade80",
        stroke: type === "power" ? "#fca5a5" : type === "ground" ? "#93c5fd" : "#86efac",
        strokeWidth: 1.5,
        innerFill: "rgba(255,255,255,0.5)",
        scale: 1.25,
      };
    }
    // In wire mode, show pins more prominently - MUCH more visible
    if (wireMode) {
      return {
        fill: type === "power" ? "#991b1b" : type === "ground" ? "#1e40af" : "#374151",
        stroke: type === "power" ? "#f87171" : type === "ground" ? "#60a5fa" : "#9ca3af",
        strokeWidth: 1.2,
        innerFill: type === "power" ? "#450a0a" : type === "ground" ? "#172554" : "#1f2937",
        scale: 1.15,
      };
    }
    return {
      fill: "#2a2a2a",
      stroke: "#404040",
      strokeWidth: 0.5,
      innerFill: "#1a1a1a",
      scale: 1.0,
    };
  };

  const style = getPinStyle();
  const size = 6.5 * style.scale;
  const innerSize = 3.5 * style.scale;
  
  return (
    <g className="breadboard-pin" style={{ cursor: wireMode ? 'crosshair' : 'default' }}>
      {/* LARGE INVISIBLE HIT AREA - Covers entire pin cell for easy clicking */}
      <rect
        x={x - PIN_SPACING / 2}
        y={y - PIN_SPACING / 2}
        width={PIN_SPACING}
        height={PIN_SPACING}
        fill="transparent"
        style={{ cursor: wireMode ? 'crosshair' : 'pointer' }}
      />
      
      {/* Outer glow ring when hovered - makes it obvious this is clickable */}
      {isHovered && (
        <circle
          cx={x}
          cy={y}
          r={10}
          fill={type === "power" ? "rgba(220, 38, 38, 0.3)" : type === "ground" ? "rgba(37, 99, 235, 0.3)" : "rgba(34, 197, 94, 0.3)"}
          className="pointer-events-none"
        />
      )}
      
      {/* Pin hole - outer ring */}
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        rx={1.5}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        className="transition-all duration-100 pointer-events-none"
      />
      {/* Inner depth effect */}
      <rect
        x={x - innerSize / 2}
        y={y - innerSize / 2}
        width={innerSize}
        height={innerSize}
        rx={0.75}
        fill={style.innerFill}
        className="transition-all duration-100 pointer-events-none"
      />
      
      {/* Animated glow ring when hovered in wire mode */}
      {isHovered && wireMode && (
        <>
          <circle
            cx={x}
            cy={y}
            r={12}
            fill="none"
            stroke={type === "power" ? "#dc2626" : type === "ground" ? "#3b82f6" : "#22c55e"}
            strokeWidth={2.5}
            opacity={0.7}
            className="animate-pulse pointer-events-none"
          />
          {/* Click indicator dot */}
          <circle
            cx={x}
            cy={y}
            r={2}
            fill="#ffffff"
            className="pointer-events-none"
          />
        </>
      )}
      
      <title>{id}</title>
    </g>
  );
});

// Row label component
const RowLabel = memo(function RowLabel({ label, y, side }: { label: string; y: number; side: "left" | "right" }) {
  const x = side === "left" ? START_X - 10 : -START_X + 10;
  return (
    <text
      x={x}
      y={y + 1.5}
      textAnchor="middle"
      fontSize="4.5"
      fill="#777"
      fontFamily="'SF Mono', 'Monaco', 'Consolas', monospace"
      fontWeight="500"
      className="select-none pointer-events-none"
    >
      {label.toUpperCase()}
    </text>
  );
});

export const BreadboardVisual = memo(function BreadboardVisual({
  hoveredTerminal,
  wireMode,
}: BreadboardVisualProps) {
  // Determine which row is hovered based on the terminal ID
  const hoveredRowId = useMemo(() => {
    if (hoveredTerminal) {
      // Extract row letter from terminal ID like "a1", "b15"
      const match = hoveredTerminal.match(/^([a-j])\d+$/);
      if (match) return match[1];
      // Power rails
      if (hoveredTerminal.startsWith("power-top")) return "power-top";
      if (hoveredTerminal.startsWith("gnd-top")) return "gnd-top";
      if (hoveredTerminal.startsWith("power-bottom")) return "power-bottom";
      if (hoveredTerminal.startsWith("gnd-bottom")) return "gnd-bottom";
    }
    return null;
  }, [hoveredTerminal]);

  // Board dimensions (matching circuit-types.ts)
  const boardWidth = 260;
  const boardHeight = 140;
  const halfW = boardWidth / 2;
  const halfH = boardHeight / 2;

  // Generate pin positions
  const pins = useMemo(() => {
    const result: Array<{
      x: number;
      y: number;
      id: string;
      type: "signal" | "power" | "ground";
      rowId: string;
    }> = [];

    // Top power rail
    for (let col = 1; col <= NUM_COLS; col++) {
      const x = START_X + (col - 1) * PIN_SPACING;
      result.push({ x, y: POWER_RAILS.topPower.y, id: `power-top-${col}`, type: "power", rowId: "power-top" });
      result.push({ x, y: POWER_RAILS.topGnd.y, id: `gnd-top-${col}`, type: "ground", rowId: "gnd-top" });
    }

    // Top rows (a-e)
    for (const row of TOP_ROWS) {
      for (let col = 1; col <= NUM_COLS; col++) {
        const x = START_X + (col - 1) * PIN_SPACING;
        result.push({ x, y: row.y, id: `${row.id}${col}`, type: "signal", rowId: row.id });
      }
    }

    // Bottom rows (f-j)
    for (const row of BOTTOM_ROWS) {
      for (let col = 1; col <= NUM_COLS; col++) {
        const x = START_X + (col - 1) * PIN_SPACING;
        result.push({ x, y: row.y, id: `${row.id}${col}`, type: "signal", rowId: row.id });
      }
    }

    // Bottom power rail
    for (let col = 1; col <= NUM_COLS; col++) {
      const x = START_X + (col - 1) * PIN_SPACING;
      result.push({ x, y: POWER_RAILS.bottomPower.y, id: `power-bottom-${col}`, type: "power", rowId: "power-bottom" });
      result.push({ x, y: POWER_RAILS.bottomGnd.y, id: `gnd-bottom-${col}`, type: "ground", rowId: "gnd-bottom" });
    }

    return result;
  }, []);

  // Calculate highlight for connected strips (columns)
  const hoveredCol = useMemo(() => {
    if (!hoveredTerminal) return null;
    const match = hoveredTerminal.match(/^[a-j](\d+)$/);
    if (match) return parseInt(match[1]);
    return null;
  }, [hoveredTerminal]);

  return (
    <g className="breadboard-visual">
      {/* Drop shadow */}
      <defs>
        <filter id="breadboard-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>

      {/* Main board body */}
      <rect
        x={-halfW}
        y={-halfH}
        width={boardWidth}
        height={boardHeight}
        rx={5}
        fill="#f5f3eb"
        stroke="#d4d0c4"
        strokeWidth={1.5}
        filter="url(#breadboard-shadow)"
      />

      {/* Wire mode indicator border */}
      {wireMode && (
        <rect
          x={-halfW - 2}
          y={-halfH - 2}
          width={boardWidth + 4}
          height={boardHeight + 4}
          rx={7}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="8 4"
          opacity={0.5}
          className="animate-pulse"
        />
      )}

      {/* ═══════════════ TOP POWER RAIL SECTION ═══════════════ */}
      <rect
        x={-halfW + 4}
        y={-halfH + 4}
        width={boardWidth - 8}
        height={22}
        fill="#ebe8df"
        rx={2}
      />
      
      {/* Red line indicator (VCC) */}
      <line
        x1={-halfW + 8}
        y1={POWER_RAILS.topPower.y}
        x2={halfW - 8}
        y2={POWER_RAILS.topPower.y}
        stroke="#dc2626"
        strokeWidth={2}
        opacity={0.7}
        strokeLinecap="round"
      />
      
      {/* Blue line indicator (GND) */}
      <line
        x1={-halfW + 8}
        y1={POWER_RAILS.topGnd.y}
        x2={halfW - 8}
        y2={POWER_RAILS.topGnd.y}
        stroke="#2563eb"
        strokeWidth={2}
        opacity={0.7}
        strokeLinecap="round"
      />

      {/* + and - markers */}
      <text x={-halfW + 3} y={POWER_RAILS.topPower.y + 1.5} fontSize="6" fill="#dc2626" fontWeight="bold">+</text>
      <text x={-halfW + 3} y={POWER_RAILS.topGnd.y + 1.5} fontSize="6" fill="#2563eb" fontWeight="bold">−</text>
      <text x={halfW - 6} y={POWER_RAILS.topPower.y + 1.5} fontSize="6" fill="#dc2626" fontWeight="bold">+</text>
      <text x={halfW - 6} y={POWER_RAILS.topGnd.y + 1.5} fontSize="6" fill="#2563eb" fontWeight="bold">−</text>

      {/* ═══════════════ TOP COMPONENT AREA (a-e) ═══════════════ */}
      <rect
        x={-halfW + 4}
        y={-41}
        width={boardWidth - 8}
        height={44}
        fill="#f8f6ee"
        rx={2}
      />

      {/* ═══════════════ CENTER TRENCH ═══════════════ */}
      <rect
        x={-halfW + 4}
        y={2}
        width={boardWidth - 8}
        height={9}
        fill="#c9c5b8"
        rx={1}
      />
      {/* Trench groove */}
      <line
        x1={-halfW + 8}
        y1={6.5}
        x2={halfW - 8}
        y2={6.5}
        stroke="#a8a498"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Top shadow on trench */}
      <rect
        x={-halfW + 4}
        y={2}
        width={boardWidth - 8}
        height={1.5}
        fill="rgba(0,0,0,0.08)"
        rx={1}
      />

      {/* ═══════════════ BOTTOM COMPONENT AREA (f-j) ═══════════════ */}
      <rect
        x={-halfW + 4}
        y={10}
        width={boardWidth - 8}
        height={44}
        fill="#f8f6ee"
        rx={2}
      />

      {/* ═══════════════ BOTTOM POWER RAIL SECTION ═══════════════ */}
      <rect
        x={-halfW + 4}
        y={halfH - 26}
        width={boardWidth - 8}
        height={22}
        fill="#ebe8df"
        rx={2}
      />
      
      {/* Red line indicator (VCC) */}
      <line
        x1={-halfW + 8}
        y1={POWER_RAILS.bottomPower.y}
        x2={halfW - 8}
        y2={POWER_RAILS.bottomPower.y}
        stroke="#dc2626"
        strokeWidth={2}
        opacity={0.7}
        strokeLinecap="round"
      />
      
      {/* Blue line indicator (GND) */}
      <line
        x1={-halfW + 8}
        y1={POWER_RAILS.bottomGnd.y}
        x2={halfW - 8}
        y2={POWER_RAILS.bottomGnd.y}
        stroke="#2563eb"
        strokeWidth={2}
        opacity={0.7}
        strokeLinecap="round"
      />

      {/* + and - markers */}
      <text x={-halfW + 3} y={POWER_RAILS.bottomPower.y + 1.5} fontSize="6" fill="#dc2626" fontWeight="bold">+</text>
      <text x={-halfW + 3} y={POWER_RAILS.bottomGnd.y + 1.5} fontSize="6" fill="#2563eb" fontWeight="bold">−</text>
      <text x={halfW - 6} y={POWER_RAILS.bottomPower.y + 1.5} fontSize="6" fill="#dc2626" fontWeight="bold">+</text>
      <text x={halfW - 6} y={POWER_RAILS.bottomGnd.y + 1.5} fontSize="6" fill="#2563eb" fontWeight="bold">−</text>

      {/* ═══════════════ COLUMN NUMBERS ═══════════════ */}
      {[1, 5, 10, 15, 20, 25, 30].map((col) => {
        const x = START_X + (col - 1) * PIN_SPACING;
        return (
          <g key={`col-num-${col}`}>
            {/* Top column number (above a row) */}
            <text
              x={x}
              y={-57}
              textAnchor="middle"
              fontSize="4"
              fill="#999"
              fontFamily="'SF Mono', 'Monaco', 'Consolas', monospace"
              className="select-none pointer-events-none"
            >
              {col}
            </text>
            {/* Bottom column number (below j row) */}
            <text
              x={x}
              y={67}
              textAnchor="middle"
              fontSize="4"
              fill="#999"
              fontFamily="'SF Mono', 'Monaco', 'Consolas', monospace"
              className="select-none pointer-events-none"
            >
              {col}
            </text>
          </g>
        );
      })}

      {/* ═══════════════ ROW LABELS ═══════════════ */}
      {TOP_ROWS.map((row) => (
        <g key={`row-label-${row.id}`}>
          <RowLabel label={row.id} y={row.y} side="left" />
          <RowLabel label={row.id} y={row.y} side="right" />
        </g>
      ))}
      {BOTTOM_ROWS.map((row) => (
        <g key={`row-label-${row.id}`}>
          <RowLabel label={row.id} y={row.y} side="left" />
          <RowLabel label={row.id} y={row.y} side="right" />
        </g>
      ))}

      {/* ═══════════════ COLUMN STRIP HIGHLIGHTS ═══════════════ */}
      {/* Only highlight the connected strip (respects center trench isolation) */}
      {hoveredCol !== null && hoveredRowId && ['a','b','c','d','e'].includes(hoveredRowId) && (
        <g className="strip-highlight">
          {/* Top half strip highlight only - trench isolates from bottom */}
          <rect
            x={START_X + (hoveredCol - 1) * PIN_SPACING - 3.5}
            y={TOP_ROWS[0].y - 4}
            width={7}
            height={TOP_ROWS[4].y - TOP_ROWS[0].y + 8}
            fill="rgba(34, 197, 94, 0.25)"
            rx={2}
            stroke="rgba(34, 197, 94, 0.5)"
            strokeWidth={1.5}
          />
        </g>
      )}
      {hoveredCol !== null && hoveredRowId && ['f','g','h','i','j'].includes(hoveredRowId) && (
        <g className="strip-highlight">
          {/* Bottom half strip highlight only - trench isolates from top */}
          <rect
            x={START_X + (hoveredCol - 1) * PIN_SPACING - 3.5}
            y={BOTTOM_ROWS[0].y - 4}
            width={7}
            height={BOTTOM_ROWS[4].y - BOTTOM_ROWS[0].y + 8}
            fill="rgba(34, 197, 94, 0.25)"
            rx={2}
            stroke="rgba(34, 197, 94, 0.5)"
            strokeWidth={1.5}
          />
        </g>
      )}

      {/* ═══════════════ POWER RAIL HIGHLIGHTS ═══════════════ */}
      {/* Power rails are continuous - entire rail highlights when any pin is hovered */}
      {hoveredRowId === "power-top" && (
        <rect
          x={-halfW + 8}
          y={POWER_RAILS.topPower.y - 4}
          width={boardWidth - 16}
          height={8}
          fill="rgba(220, 38, 38, 0.2)"
          rx={2}
          stroke="rgba(220, 38, 38, 0.5)"
          strokeWidth={1.5}
        />
      )}
      {hoveredRowId === "gnd-top" && (
        <rect
          x={-halfW + 8}
          y={POWER_RAILS.topGnd.y - 4}
          width={boardWidth - 16}
          height={8}
          fill="rgba(37, 99, 235, 0.2)"
          rx={2}
          stroke="rgba(37, 99, 235, 0.5)"
          strokeWidth={1.5}
        />
      )}
      {hoveredRowId === "power-bottom" && (
        <rect
          x={-halfW + 8}
          y={POWER_RAILS.bottomPower.y - 4}
          width={boardWidth - 16}
          height={8}
          fill="rgba(220, 38, 38, 0.2)"
          rx={2}
          stroke="rgba(220, 38, 38, 0.5)"
          strokeWidth={1.5}
        />
      )}
      {hoveredRowId === "gnd-bottom" && (
        <rect
          x={-halfW + 8}
          y={POWER_RAILS.bottomGnd.y - 4}
          width={boardWidth - 16}
          height={8}
          fill="rgba(37, 99, 235, 0.2)"
          rx={2}
          stroke="rgba(37, 99, 235, 0.5)"
          strokeWidth={1.5}
        />
      )}

      {/* ═══════════════ ALL PINS ═══════════════ */}
      {pins.map((pin) => (
        <Pin
          key={pin.id}
          x={pin.x}
          y={pin.y}
          id={pin.id}
          type={pin.type}
          isHovered={hoveredTerminal === pin.id}
          isInConnectedStrip={isInSameConnectedStrip(pin.id, hoveredTerminal ?? null)}
          wireMode={wireMode}
        />
      ))}

      {/* ═══════════════ CORNER MOUNTING HOLES ═══════════════ */}
      <circle cx={-halfW + 8} cy={-halfH + 8} r={3} fill="#e0dcd0" stroke="#c9c5b8" strokeWidth={0.5} />
      <circle cx={halfW - 8} cy={-halfH + 8} r={3} fill="#e0dcd0" stroke="#c9c5b8" strokeWidth={0.5} />
      <circle cx={-halfW + 8} cy={halfH - 8} r={3} fill="#e0dcd0" stroke="#c9c5b8" strokeWidth={0.5} />
      <circle cx={halfW - 8} cy={halfH - 8} r={3} fill="#e0dcd0" stroke="#c9c5b8" strokeWidth={0.5} />

      {/* Inner holes for mounting */}
      <circle cx={-halfW + 8} cy={-halfH + 8} r={1.5} fill="#b8b4a8" />
      <circle cx={halfW - 8} cy={-halfH + 8} r={1.5} fill="#b8b4a8" />
      <circle cx={-halfW + 8} cy={halfH - 8} r={1.5} fill="#b8b4a8" />
      <circle cx={halfW - 8} cy={halfH - 8} r={1.5} fill="#b8b4a8" />

      {/* ═══════════════ WIRE MODE INSTRUCTIONS ═══════════════ */}
      {wireMode && !hoveredTerminal && (
        <text
          x={0}
          y={halfH + 12}
          textAnchor="middle"
          fontSize="6"
          fill="#22c55e"
          className="pointer-events-none animate-pulse"
        >
          Click any pin to start/end wire
        </text>
      )}
    </g>
  );
});

export default BreadboardVisual;
