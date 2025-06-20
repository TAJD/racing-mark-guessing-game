import type { RacingMark } from '../types/game';
import { parseGpxData } from '../utils/gpxParser';

// GPX data is now loaded at runtime from the public/data/2025_racing_marks.gpx file

// Parse the GPX data lazily to avoid build-time issues
let _racingMarks: RacingMark[] | null = null;

export const getRacingMarks = async (): Promise<RacingMark[]> => {
  if (_racingMarks !== null) return _racingMarks;
  try {
    const res = await fetch('/data/2025_racing_marks.gpx');
    if (!res.ok) {
      throw new Error(`Failed to fetch GPX: ${res.status} ${res.statusText}`);
    }
    const gpxText = await res.text();
    _racingMarks = parseGpxData(gpxText);
    if (!_racingMarks || _racingMarks.length === 0) {
      throw new Error('No marks parsed from GPX data');
    }
    return _racingMarks;
  } catch (err) {
    console.error('Error in getRacingMarks:', err);
    return [];
  }
};

// No eager export of racingMarks to avoid build-time evaluation

// Solent bounds for map centering
export const solentBounds = {
  north: 50.9,
  south: 50.6,
  east: -0.9,
  west: -1.95
};

// Default map center (approximately center of Solent)
export const mapCenter: [number, number] = [50.75, -1.3];
