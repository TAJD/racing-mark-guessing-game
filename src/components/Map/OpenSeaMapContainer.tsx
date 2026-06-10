import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RacingMark } from "../../types/game";
import { MarkIcon } from "../Graphics/MarkIcons";
import ReactDOMServer from "react-dom/server";

function createMarkIcon(mark: RacingMark, isHighlighted = false): L.DivIcon {
  const size = isHighlighted ? 40 : 24;
  const highlightRing = isHighlighted
    ? `<div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: ${size + 16}px;
          height: ${size + 16}px;
          border: 3px solid #f59e0b;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.2);
          animation: highlight-pulse 1.5s infinite;
          z-index: 1;
        "></div>
        <div style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: ${size + 8}px;
          height: ${size + 8}px;
          border: 2px solid #fbbf24;
          border-radius: 50%;
          animation: highlight-pulse 1.5s infinite 0.3s;
          z-index: 2;
        "></div>`
    : "";

  let iconSvg = ReactDOMServer.renderToStaticMarkup(<MarkIcon symbol={mark.symbol} size={size} />);
  if (!iconSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    iconSvg = iconSvg.replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const iconHtml = `
    <div style="position: relative;">
      ${highlightRing}
      <div style="position: relative; z-index: 3;">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "racing-mark-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size / 2],
  });
}

interface OpenSeaMapContainerProps {
  marks: RacingMark[];
  center: [number, number];
  zoom?: number;
  onMarkClick?: (mark: RacingMark) => void;
  onMapClick?: (lat: number, lon: number) => void;
  highlightedMark?: string;
  className?: string;
  openSeaMapEnabled?: boolean;
}

export function OpenSeaMapContainer({
  marks,
  center,
  zoom = 11,
  onMarkClick,
  onMapClick,
  highlightedMark,
  className = "",
  openSeaMapEnabled = false,
}: OpenSeaMapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const marksByIdRef = useRef<Map<string, RacingMark>>(new Map());
  const prevHighlightedRef = useRef<string | undefined>(undefined);
  const highlightedMarkRef = useRef<string | undefined>(highlightedMark);
  const onMarkClickRef = useRef(onMarkClick);

  // Keep refs current so effects always see the latest values without re-running
  highlightedMarkRef.current = highlightedMark;
  onMarkClickRef.current = onMarkClick;

  // Initialize map exactly once — repositioning is handled by the setView/fitBounds effect below
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    });

    const openSeaMapLayer = L.tileLayer("https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png", {
      attribution: "© OpenSeaMap contributors",
      maxZoom: 18,
      opacity: 0.8,
    });

    osmLayer.addTo(map);
    if (openSeaMapEnabled) {
      openSeaMapLayer.addTo(map);
    }
    L.control.layers({ OpenStreetMap: osmLayer }, { OpenSeaMap: openSeaMapLayer }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach/detach onMapClick handler in its own effect so the map is never recreated
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;
    const map = mapRef.current;
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [onMapClick]);

  // Create markers once per marks identity; uses refs for current highlighted/click values
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const byId = new Map<string, RacingMark>();
    marks.forEach((mark) => {
      byId.set(mark.id, mark);
      const icon = createMarkIcon(mark, highlightedMarkRef.current === mark.id);
      const marker = L.marker([mark.lat, mark.lon], { icon });
      marker.on("click", () => onMarkClickRef.current?.(mark));
      marker.addTo(map);
      markersRef.current.set(mark.id, marker);
    });
    marksByIdRef.current = byId;
    prevHighlightedRef.current = highlightedMarkRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks]);

  // Update only the two affected marker icons when the highlighted mark changes
  useEffect(() => {
    if (!mapRef.current || markersRef.current.size === 0) return;

    const prevId = prevHighlightedRef.current;

    if (prevId && prevId !== highlightedMark) {
      const marker = markersRef.current.get(prevId);
      const mark = marksByIdRef.current.get(prevId);
      if (marker && mark) marker.setIcon(createMarkIcon(mark, false));
    }

    if (highlightedMark) {
      const marker = markersRef.current.get(highlightedMark);
      const mark = marksByIdRef.current.get(highlightedMark);
      if (marker && mark) marker.setIcon(createMarkIcon(mark, true));
    }

    prevHighlightedRef.current = highlightedMark;
  }, [highlightedMark]);

  // Update map view when center or highlighted mark changes
  useEffect(() => {
    if (mapRef.current) {
      if (highlightedMark && marks.length > 0) {
        const target = marks.find((m) => m.id === highlightedMark);
        if (target) {
          const delta = 0.0045; // ~500m in degrees
          const bounds: L.LatLngBoundsLiteral = [
            [target.lat - delta, target.lon - delta],
            [target.lat + delta, target.lon + delta],
          ];
          mapRef.current.fitBounds(bounds, { maxZoom: zoom });
          return;
        }
      }
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom, highlightedMark, marks]);

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full h-full rounded-lg" />
      <style>{`
        .racing-mark-icon {
          background: none !important;
          border: none !important;
        }

        @keyframes highlight-pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }

        .leaflet-popup-content {
          margin: 8px 12px;
        }
      `}</style>
    </div>
  );
}
