import type { RacingMark, MarkSymbol } from "../types/game";

// Parse GPX XML data to extract racing marks
export function parseGpxData(gpxContent: string): RacingMark[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

  const waypoints = xmlDoc.getElementsByTagName("wpt");
  const marks: RacingMark[] = [];

  for (let i = 0; i < waypoints.length; i++) {
    const wpt = waypoints[i];
    const lat = parseFloat(wpt.getAttribute("lat") || "0");
    const lon = parseFloat(wpt.getAttribute("lon") || "0");

    const nameElement = wpt.getElementsByTagName("name")[0];
    const symElement = wpt.getElementsByTagName("sym")[0];
    const descElement = wpt.getElementsByTagName("desc")[0];

    if (nameElement && symElement && descElement) {
      const name = nameElement.textContent?.trim() || "";
      const symbol = (symElement.textContent?.trim() as MarkSymbol) || "Y";
      const description = descElement.textContent?.trim() || "";

      // Extract sponsor from description if it contains * or @
      const sponsor =
        description.includes("*") || description.includes("@")
          ? description.split(/[*@]/)[0].trim()
          : undefined;

      marks.push({
        id: `mark-${i}`,
        name,
        lat,
        lon,
        symbol,
        description,
        sponsor,
      });
    }
  }

  return marks;
}

// Filter marks by difficulty level
export function getMarksByDifficulty(
  marks: RacingMark[],
  difficulty: "beginner" | "intermediate" | "advanced"
): RacingMark[] {
  switch (difficulty) {
    case "beginner":
      // Famous landmarks and well-known marks (those without sponsors)
      return marks.filter(
        (mark) =>
          !mark.sponsor &&
          (mark.description.includes("Tower") ||
            mark.description.includes("Fort") ||
            mark.description.includes("Lighthouse") ||
            mark.description.includes("Bank") ||
            mark.description.includes("Ledge"))
      );

    case "intermediate":
      // Mix of sponsor and navigation marks
      return marks.filter(
        (mark) =>
          mark.sponsor ||
          mark.description.includes("Buoy") ||
          mark.description.includes("Elbow") ||
          mark.description.includes("Head")
      );

    case "advanced":
      // All marks
      return marks;

    default:
      return marks;
  }
}

// Calculate distance between two points in meters using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Find marks within a certain radius (for context in guess mode)
export function findNearbyMarks(
  targetMark: RacingMark,
  allMarks: RacingMark[],
  radiusMeters: number
): RacingMark[] {
  return allMarks.filter((mark) => {
    if (mark.id === targetMark.id) return false;
    const distance = calculateDistance(targetMark.lat, targetMark.lon, mark.lat, mark.lon);
    return distance <= radiusMeters;
  });
}
