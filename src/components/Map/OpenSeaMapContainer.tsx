import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RacingMark } from '../../types/game';
import { MarkIcon } from '../Graphics/MarkIcons';
import ReactDOMServer from 'react-dom/server';

interface OpenSeaMapContainerProps {
  marks: RacingMark[];
  center: [number, number];
  zoom?: number;
  onMarkClick?: (mark: RacingMark) => void;
  onMapClick?: (lat: number, lon: number) => void;
  highlightedMark?: string;
  hiddenMarks?: string[];
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
  hiddenMarks = [],
  className = '',
  openSeaMapEnabled = false
}: OpenSeaMapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Create custom marker icons for each mark type using the shared MarkIcon component
  const createMarkIcon = (mark: RacingMark, isHighlighted = false) => {
    const size = isHighlighted ? 40 : 24;
    // Optionally add highlight ring for highlighted marks
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
      : '';

    // Render MarkIcon as static markup and ensure SVG has xmlns attribute
    let iconSvg = ReactDOMServer.renderToStaticMarkup(
    <MarkIcon symbol={mark.symbol} size={size} />
    );
    if (!iconSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      iconSvg = iconSvg.replace(
        /^<svg\b/,
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
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
      className: 'racing-mark-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size / 2]
    });
  };


  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add OpenStreetMap base layer
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    });

    // Add OpenSeaMap overlay
    const openSeaMapLayer = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      attribution: '© OpenSeaMap contributors',
      maxZoom: 18,
      opacity: 0.8
    });

    osmLayer.addTo(map);
    
    // Conditionally add OpenSeaMap layer
    if (openSeaMapEnabled) {
      openSeaMapLayer.addTo(map);
    }

    // Add layer control
    const baseLayers = {
      'OpenStreetMap': osmLayer
    };

    const overlayLayers = {
      'OpenSeaMap': openSeaMapLayer
    };

    L.control.layers(baseLayers, overlayLayers).addTo(map);

    // Handle map clicks
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom, onMapClick]);

  // Update markers when marks change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers
    marks.forEach(mark => {
      const isHighlighted = highlightedMark === mark.id;
      const icon = createMarkIcon(mark, isHighlighted);
      
      // Remove .bindPopup to prevent mark info display on selection
      const marker = L.marker([mark.lat, mark.lon], { icon });

      if (onMarkClick) {
        marker.on('click', () => onMarkClick(mark));
      }

      marker.addTo(mapRef.current!);
      markersRef.current.set(mark.id, marker);
    });
  }, [marks, onMarkClick, highlightedMark, hiddenMarks]);

  // Update map view when center changes or highlightedMark changes
  useEffect(() => {
    if (mapRef.current) {
      // If highlightedMark is present, fit bounds to include all visible marks (target + context)
      if (highlightedMark && marks.length > 0) {
        // Zoom to area +/- 500m from the mark being guessed (highlightedMark)
        const target = marks.find(m => m.id === highlightedMark);
        if (target) {
          const delta = 0.0045; // ~500m in degrees
          const bounds: L.LatLngBoundsLiteral = [
            [target.lat - delta, target.lon - delta],
            [target.lat + delta, target.lon + delta]
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
