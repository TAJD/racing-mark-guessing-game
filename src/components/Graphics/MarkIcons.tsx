import type { MarkSymbol } from "../../types/game";

interface MarkIconProps {
  symbol: MarkSymbol;
  size?: number;
  className?: string;
}

export function MarkIcon({ symbol, size = 20, className = "" }: MarkIconProps) {
  // Helper to render a banded cylinder for cardinal/safe water marks
  const renderBandedCylinder = (bands: { color: string; height: number }[]) => {
    let y = 4;
    return (
      <>
        {bands.map((band, i) => {
          const rect = (
            <rect
              key={i}
              x={8}
              y={y}
              width={8}
              height={band.height}
              fill={band.color}
              stroke="#374151"
              strokeWidth="0"
            />
          );
          y += band.height;
          return rect;
        })}
        {/* Outline */}
        <rect x="8" y="4" width="8" height="16" fill="none" stroke="#374151" strokeWidth="1" />
      </>
    );
  };

  // Special cases for banded marks
  if (symbol === "RW") {
    // Safe Water: vertical red/white stripes
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        {/* 4 vertical stripes */}
        <rect x="8" y="4" width="2" height="16" fill="#dc2626" />
        <rect x="10" y="4" width="2" height="16" fill="#fff" />
        <rect x="12" y="4" width="2" height="16" fill="#dc2626" />
        <rect x="14" y="4" width="2" height="16" fill="#fff" />
        {/* Outline */}
        <rect x="8" y="4" width="8" height="16" fill="none" stroke="#374151" strokeWidth="1" />
      </svg>
    );
  }
  if (symbol === "YBY") {
    // West Cardinal: yellow-black-yellow horizontal bands
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        {renderBandedCylinder([
          { color: "#ca8a04", height: 5.33 },
          { color: "#000", height: 5.33 },
          { color: "#ca8a04", height: 5.34 },
        ])}
      </svg>
    );
  }
  if (symbol === "BYB") {
    // East Cardinal: black-yellow-black horizontal bands
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        {renderBandedCylinder([
          { color: "#000", height: 5.33 },
          { color: "#ca8a04", height: 5.33 },
          { color: "#000", height: 5.34 },
        ])}
      </svg>
    );
  }
  if (symbol === "BY") {
    // North Cardinal: black over yellow
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        {renderBandedCylinder([
          { color: "#000", height: 8 },
          { color: "#ca8a04", height: 8 },
        ])}
      </svg>
    );
  }
  if (symbol === "YB") {
    // South Cardinal: yellow over black
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        {renderBandedCylinder([
          { color: "#ca8a04", height: 8 },
          { color: "#000", height: 8 },
        ])}
      </svg>
    );
  }

  // Special case for 'Y' symbol - render as yellow circle
  if (symbol === "Y") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="10" fill="#ca8a04" stroke="#374151" strokeWidth="1" />
      </svg>
    );
  }

  // Default: solid color cylinder
  const color = (() => {
    switch (symbol) {
      case "R":
        return "#dc2626";
      case "G":
        return "#16a34a";
      case "B":
        return "#2563eb";
      default:
        return "#ca8a04";
    }
  })();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      {/* Cylinder shape */}
      <rect x="8" y="4" width="8" height="16" fill={color} stroke="#374151" strokeWidth="1" />
    </svg>
  );
}

interface MarkLegendProps {
  className?: string;
}

export function MarkLegend({ className = "" }: MarkLegendProps) {
  const markTypes: { symbol: MarkSymbol; description: string }[] = [
    { symbol: "R", description: "Port Hand Mark" },
    { symbol: "G", description: "Starboard Hand Mark" },
    { symbol: "Y", description: "Special Mark" },
    { symbol: "B", description: "Blue Mark" },
    { symbol: "RW", description: "Safe Water Mark" },
    { symbol: "YBY", description: "West Cardinal Mark" },
    { symbol: "BYB", description: "East Cardinal Mark" },
    { symbol: "BY", description: "North Cardinal Mark" },
    { symbol: "YB", description: "South Cardinal Mark" },
  ];

  return (
    <div className={`bg-white p-4 rounded-lg shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Mark Types</h3>
      <div className="grid grid-cols-2 gap-2">
        {markTypes.map(({ symbol, description }) => (
          <div key={symbol} className="flex items-center gap-2">
            <MarkIcon symbol={symbol} size={24} />
            <span className="text-sm">{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
