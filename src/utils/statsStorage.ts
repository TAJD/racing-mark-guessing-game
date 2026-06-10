const STATS_KEY = "gameStats";
const STATS_VERSION = 1;

interface GameRecord {
  score: number;
  accuracy: number;
  grade: string;
  bestStreak: number;
  date: string;
}

interface StoredStats {
  version: number;
  highScore: number;
  games: GameRecord[];
}

const DEFAULT_STATS: StoredStats = {
  version: STATS_VERSION,
  highScore: 0,
  games: [],
};

function isValidStats(value: unknown): value is StoredStats {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.version === "number" && typeof obj.highScore === "number" && Array.isArray(obj.games)
  );
}

function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidStats(parsed)) return { ...DEFAULT_STATS };
    return parsed;
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveGameResult(
  score: number,
  accuracy: number,
  grade: string,
  bestStreak: number
): { isNewHighScore: boolean; highScore: number } {
  const stats = loadStats();
  const isNewHighScore = score > stats.highScore;

  const updated: StoredStats = {
    version: STATS_VERSION,
    highScore: isNewHighScore ? score : stats.highScore,
    games: [
      { score, accuracy, grade, bestStreak, date: new Date().toISOString() },
      ...stats.games.slice(0, 49),
    ],
  };

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota or private browsing — silently ignore
  }

  return { isNewHighScore, highScore: updated.highScore };
}

export function getHighScore(): number {
  return loadStats().highScore;
}
