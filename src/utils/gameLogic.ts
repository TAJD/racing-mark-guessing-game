import type { RacingMark, GameConfig, GuessResult } from "../types/game";
import {
  calculateDistance,
  findNearbyMarks,
  getMarksByDifficulty,
  getMarksByProximity,
  DEFAULT_COWES_RADIUS,
} from "./gpxParser";

// Generate a guess-the-mark question
export function generateGuessQuestion(
  marks: RacingMark[],
  config: GameConfig,
  usedMarkIds?: Set<string>
): { targetMark: RacingMark; options: RacingMark[]; contextMarks: RacingMark[] } {
  const usedSet = usedMarkIds ?? new Set<string>();

  // Active difficulty pool for target selection
  let availableMarks = marks;
  if (config.proximityMode === "cowes") {
    const radius = config.cowesRadius ?? DEFAULT_COWES_RADIUS;
    availableMarks = getMarksByProximity(marks, radius).filter((mark) => !usedSet.has(mark.id));
  } else {
    availableMarks = getMarksByDifficulty(availableMarks, config.difficulty).filter(
      (mark) => !usedSet.has(mark.id)
    );
  }

  if (availableMarks.length < config.numberOfOptions) {
    throw new Error("Not enough marks available for this difficulty level");
  }

  const targetMark = availableMarks[Math.floor(Math.random() * availableMarks.length)];
  // Only the target goes into usedSet — distractors may be reused
  usedSet.add(targetMark.id);

  const contextMarks = findNearbyMarks(targetMark, marks, 2000);

  // Distractor pool: prefer active difficulty pool, fall back to all marks
  const difficultyPool =
    config.proximityMode === "cowes" ? marks : getMarksByDifficulty(marks, config.difficulty);
  const difficultyPoolIds = new Set(difficultyPool.map((m) => m.id));

  const wrongOptions: RacingMark[] = [];
  const usedIds = new Set([targetMark.id]);

  const totalAvailableMarks = marks.filter((mark) => !usedIds.has(mark.id));
  if (totalAvailableMarks.length < config.numberOfOptions - 1) {
    throw new Error("Not enough marks available for this number of options");
  }

  // Add at least one same-type mark — prefer from difficulty pool, fall back to all marks
  const sameTypeFromPool = difficultyPool.filter(
    (mark) => !usedIds.has(mark.id) && mark.symbol === targetMark.symbol
  );
  const sameTypeAll = marks.filter(
    (mark) => !usedIds.has(mark.id) && mark.symbol === targetMark.symbol
  );
  const sameTypeMarks = sameTypeFromPool.length > 0 ? sameTypeFromPool : sameTypeAll;

  if (sameTypeMarks.length > 0) {
    let nearestSameType = sameTypeMarks[0];
    let minDistance = calculateDistance(
      targetMark.lat,
      targetMark.lon,
      nearestSameType.lat,
      nearestSameType.lon
    );
    for (const mark of sameTypeMarks) {
      const dist = calculateDistance(targetMark.lat, targetMark.lon, mark.lat, mark.lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestSameType = mark;
      }
    }
    wrongOptions.push(nearestSameType);
    usedIds.add(nearestSameType.id);
  }

  const remainingSlots = config.numberOfOptions - 1 - wrongOptions.length;
  if (remainingSlots > 0) {
    const goodDistanceOptions: RacingMark[] = [];
    const fallbackOptions: RacingMark[] = [];

    // Build distractor candidates: difficulty pool first, then non-pool marks as fallback
    const candidatesFromPool = difficultyPool.filter(
      (mark) => !usedIds.has(mark.id) && mark.symbol !== targetMark.symbol
    );
    const candidatesFallback = marks.filter(
      (mark) =>
        !usedIds.has(mark.id) &&
        mark.symbol !== targetMark.symbol &&
        !difficultyPoolIds.has(mark.id)
    );
    const allCandidates = [...candidatesFromPool, ...candidatesFallback];

    for (const mark of allCandidates) {
      const distance = calculateDistance(targetMark.lat, targetMark.lon, mark.lat, mark.lon);
      if (distance > 500 && distance < 10000) {
        goodDistanceOptions.push(mark);
      } else {
        fallbackOptions.push(mark);
      }
    }

    shuffleArray(goodDistanceOptions);
    shuffleArray(fallbackOptions);

    const combinedOptions = [...goodDistanceOptions, ...fallbackOptions];
    for (let i = 0; i < remainingSlots; i++) {
      const option = combinedOptions[i];
      if (option) {
        wrongOptions.push(option);
        usedIds.add(option.id);
      }
    }
  }

  const options = [targetMark, ...wrongOptions];
  shuffleArray(options);

  return { targetMark, options, contextMarks };
}

// Evaluate a guess answer
export function evaluateGuess(
  targetMark: RacingMark,
  selectedMark: RacingMark,
  timeElapsed: number,
  config: GameConfig
): GuessResult {
  const isCorrect = targetMark.id === selectedMark.id;

  let points = isCorrect ? 100 : 0;

  let timeBonus = 0;
  if (isCorrect && config.timeLimit) {
    const maxBonusByDifficulty = {
      beginner: 30,
      intermediate: 50,
      advanced: 70,
    };
    const maxBonus = maxBonusByDifficulty[config.difficulty] ?? 30;
    const timeLeft = Math.max(0, config.timeLimit - timeElapsed);
    const timeRatio = timeLeft / config.timeLimit;
    timeBonus = Math.floor(timeRatio * maxBonus);
    points += timeBonus;
  }

  const difficultyMultiplier = {
    beginner: 1,
    intermediate: 1.5,
    advanced: 2,
  }[config.difficulty];

  points = Math.floor(points * difficultyMultiplier);

  return {
    isCorrect,
    points,
    timeBonus,
    correctMark: targetMark,
    selectedMark,
  };
}

export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function calculateStreakBonus(streak: number): number {
  if (streak < 3) return 0;
  return Math.min(streak * 10, 100);
}

export function getTimeLimit(difficulty: GameConfig["difficulty"]): number {
  switch (difficulty) {
    case "beginner":
      return 30;
    case "intermediate":
      return 20;
    case "advanced":
      return 10;
    default:
      return 30;
  }
}

export function generateStats(
  totalQuestions: number,
  correctAnswers: number,
  totalPoints: number,
  gameTime: number
): {
  accuracy: number;
  averageTime: number;
  pointsPerMinute: number;
  grade: string;
} {
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const averageTime = totalQuestions > 0 ? gameTime / totalQuestions : 0;
  const pointsPerMinute = gameTime > 0 ? (totalPoints / gameTime) * 60 : 0;

  let grade = "F";
  if (accuracy >= 90) grade = "A";
  else if (accuracy >= 80) grade = "B";
  else if (accuracy >= 70) grade = "C";
  else if (accuracy >= 60) grade = "D";

  return {
    accuracy: Math.round(accuracy),
    averageTime: Math.round(averageTime),
    pointsPerMinute: Math.round(pointsPerMinute),
    grade,
  };
}
