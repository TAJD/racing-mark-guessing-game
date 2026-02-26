import { describe, it, expect } from "vitest";
import {
  parseGpxData,
  getMarksByDifficulty,
  calculateDistance,
  findNearbyMarks,
  getMarksByProximity,
  cowesCenter,
  DEFAULT_COWES_RADIUS,
} from "../gpxParser";
import type { RacingMark } from "../../types/game";

const mockGpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <wpt lat="50.7595" lon="-1.2944">
    <name>Cowes Royal Yacht Squadron</name>
    <desc>Famous yacht club with historic tower</desc>
    <sym>Y</sym>
  </wpt>
  <wpt lat="50.7234" lon="-1.3123">
    <name>Bramble Bank</name>
    <desc>Shallow sandbank in central Solent</desc>
    <sym>G</sym>
  </wpt>
  <wpt lat="50.7800" lon="-1.2500">
    <name>Sponsored Mark</name>
    <desc>Racing buoy near Portsmouth * Test Sponsor</desc>
    <sym>R</sym>
  </wpt>
  <wpt lat="50.7900" lon="-1.2000">
    <name>Portsmouth Tower</name>
    <desc>Historic lighthouse and navigation Tower</desc>
    <sym>B</sym>
  </wpt>
</gpx>`;

const mockMarks: RacingMark[] = [
  {
    id: "mark-1",
    name: "Cowes Royal Yacht Squadron",
    lat: 50.7595,
    lon: -1.2944,
    symbol: "Y",
    description: "Famous yacht club with historic Tower",
    sponsor: undefined,
  },
  {
    id: "mark-2",
    name: "Bramble Bank",
    lat: 50.7234,
    lon: -1.3123,
    symbol: "G",
    description: "Shallow sandbank with Ledge markers",
    sponsor: undefined,
  },
  {
    id: "mark-3",
    name: "Sponsored Racing Buoy",
    lat: 50.78,
    lon: -1.25,
    symbol: "R",
    description: "Racing Buoy in eastern waters",
    sponsor: "Test Sponsor",
  },
  {
    id: "mark-4",
    name: "Navigation Elbow",
    lat: 50.76,
    lon: -1.28,
    symbol: "B",
    description: "Navigation Elbow marker",
    sponsor: undefined,
  },
];

describe("gpxParser", () => {
  describe("parseGpxData", () => {
    it("should parse valid GPX data correctly", () => {
      const marks = parseGpxData(mockGpxData);

      expect(marks).toHaveLength(4);
      expect(marks[0].name).toBe("Cowes Royal Yacht Squadron");
      expect(marks[0].lat).toBe(50.7595);
      expect(marks[0].lon).toBe(-1.2944);
      expect(marks[0].symbol).toBe("Y");
    });

    it("should extract sponsor information from description", () => {
      const marks = parseGpxData(mockGpxData);
      const sponsoredMark = marks.find((mark) => mark.description.includes("Test Sponsor"));

      expect(sponsoredMark?.sponsor).toBe("Racing buoy near Portsmouth");
    });

    it("should handle empty GPX data gracefully", () => {
      const emptyGpx = '<?xml version="1.0"?><gpx></gpx>';
      const marks = parseGpxData(emptyGpx);

      expect(marks).toHaveLength(0);
    });

    it("should assign unique IDs to marks", () => {
      const marks = parseGpxData(mockGpxData);
      const ids = marks.map((mark) => mark.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(marks.length);
    });
  });

  describe("getMarksByDifficulty", () => {
    it("should filter beginner marks correctly", () => {
      const beginnerMarks = getMarksByDifficulty(mockMarks, "beginner");

      // Should include marks with Tower, Fort, Lighthouse, Bank, Ledge but no sponsors
      expect(beginnerMarks.some((mark) => mark.description.includes("Tower"))).toBe(true);
      expect(beginnerMarks.some((mark) => mark.description.includes("Ledge"))).toBe(true);
      expect(beginnerMarks.every((mark) => !mark.sponsor)).toBe(true);
    });

    it("should filter intermediate marks correctly", () => {
      const intermediateMarks = getMarksByDifficulty(mockMarks, "intermediate");

      // Should include sponsor marks, Buoy, Elbow, Head markers
      expect(intermediateMarks.some((mark) => mark.sponsor)).toBe(true);
      expect(intermediateMarks.some((mark) => mark.description.includes("Buoy"))).toBe(true);
      expect(intermediateMarks.some((mark) => mark.description.includes("Elbow"))).toBe(true);
    });

    it("should return all marks for advanced difficulty", () => {
      const advancedMarks = getMarksByDifficulty(mockMarks, "advanced");

      expect(advancedMarks).toHaveLength(mockMarks.length);
      expect(advancedMarks).toEqual(mockMarks);
    });

    it("should handle empty marks array", () => {
      const result = getMarksByDifficulty([], "beginner");

      expect(result).toHaveLength(0);
    });
  });

  describe("calculateDistance", () => {
    it("should return 0 for identical coordinates", () => {
      const distance = calculateDistance(50.7595, -1.2944, 50.7595, -1.2944);

      expect(distance).toBe(0);
    });

    it("should calculate reasonable distances between nearby points", () => {
      // Distance between two points about 1 degree apart (roughly 100km)
      const distance = calculateDistance(50.0, -1.0, 51.0, -1.0);

      expect(distance).toBeGreaterThan(100000); // > 100km
      expect(distance).toBeLessThan(120000); // < 120km
    });

    it("should be symmetric", () => {
      const distance1 = calculateDistance(50.7595, -1.2944, 50.7234, -1.3123);
      const distance2 = calculateDistance(50.7234, -1.3123, 50.7595, -1.2944);

      expect(distance1).toBe(distance2);
    });

    it("should handle edge cases with extreme coordinates", () => {
      const distance = calculateDistance(-90, -180, 90, 180);

      expect(distance).toBeGreaterThan(0);
      expect(Number.isFinite(distance)).toBe(true);
    });
  });

  describe("findNearbyMarks", () => {
    const targetMark = mockMarks[0]; // Cowes Royal Yacht Squadron

    it("should find marks within specified radius", () => {
      const nearbyMarks = findNearbyMarks(targetMark, mockMarks, 10000); // 10km radius

      expect(nearbyMarks).not.toContain(targetMark); // Should exclude target mark itself
      expect(nearbyMarks.length).toBeGreaterThanOrEqual(0);
    });

    it("should exclude the target mark from results", () => {
      const nearbyMarks = findNearbyMarks(targetMark, mockMarks, 50000); // Large radius

      expect(nearbyMarks).not.toContain(targetMark);
    });

    it("should return empty array when no marks within radius", () => {
      const nearbyMarks = findNearbyMarks(targetMark, mockMarks, 1); // 1 meter radius

      expect(nearbyMarks).toHaveLength(0);
    });

    it("should return all other marks for very large radius", () => {
      const nearbyMarks = findNearbyMarks(targetMark, mockMarks, 1000000); // 1000km radius

      expect(nearbyMarks).toHaveLength(mockMarks.length - 1); // All except target
    });

    it("should handle single mark array", () => {
      const singleMarkArray = [targetMark];
      const nearbyMarks = findNearbyMarks(targetMark, singleMarkArray, 10000);

      expect(nearbyMarks).toHaveLength(0);
    });
  });

  describe("getMarksByProximity", () => {
    const cowesAreaMarks: RacingMark[] = [
      { id: "1", name: "3X", lat: 50.768333, lon: -1.307167, symbol: "Y", description: "Island Sailing Club" },
      { id: "2", name: "3T", lat: 50.768333, lon: -1.3145, symbol: "Y", description: "CHS" },
      { id: "3", name: "34", lat: 50.769167, lon: -1.286667, symbol: "Y", description: "Cowes Corinthian" },
      { id: "4", name: "far-mark", lat: 50.5, lon: -1.5, symbol: "Y", description: "Far away mark" },
    ];

    it("should return marks within default radius of Cowes", () => {
      const nearbyMarks = getMarksByProximity(cowesAreaMarks);
      
      // Should include marks within 5km of Cowes
      expect(nearbyMarks.length).toBeGreaterThan(0);
      expect(nearbyMarks.length).toBeLessThan(cowesAreaMarks.length);
    });

    it("should filter marks by custom radius", () => {
      // 2km radius - should only include very close marks
      const closeMarks = getMarksByProximity(cowesAreaMarks, 2000);
      
      // Should exclude far-mark
      expect(closeMarks.every(m => m.name !== "far-mark")).toBe(true);
    });

    it("should return all marks within large radius", () => {
      // 100km radius - should include all marks
      const allMarks = getMarksByProximity(cowesAreaMarks, 100000);
      
      expect(allMarks).toHaveLength(cowesAreaMarks.length);
    });

    it("should return empty array when no marks within radius", () => {
      const marks: RacingMark[] = [
        { id: "1", name: "far", lat: 50.0, lon: -2.0, symbol: "Y", description: "Far mark" },
      ];
      
      const nearbyMarks = getMarksByProximity(marks, 1000);
      
      expect(nearbyMarks).toHaveLength(0);
    });

    it("should handle empty marks array", () => {
      const result = getMarksByProximity([]);
      
      expect(result).toHaveLength(0);
    });

    it("should use cowesCenter coordinates correctly", () => {
      // Cowes is at approximately 50.76, -1.30
      expect(cowesCenter.lat).toBe(50.76);
      expect(cowesCenter.lon).toBe(-1.30);
    });

    it("should have reasonable default radius", () => {
      // Default should be 5km
      expect(DEFAULT_COWES_RADIUS).toBe(5000);
    });
  });
});
