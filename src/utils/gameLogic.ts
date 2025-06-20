import type { RacingMark, GameConfig, GuessResult } from '../types/game';
import { calculateDistance, findNearbyMarks, getMarksByDifficulty } from './gpxParser';

// Generate a guess-the-mark question
export function generateGuessQuestion(
  marks: RacingMark[],
  config: GameConfig
): { targetMark: RacingMark; options: RacingMark[]; contextMarks: RacingMark[] } {
  const availableMarks = getMarksByDifficulty(marks, config.difficulty);
  
  if (availableMarks.length < config.numberOfOptions) {
    throw new Error('Not enough marks available for this difficulty level');
  }

  // Select a random target mark
  const targetMark = availableMarks[Math.floor(Math.random() * availableMarks.length)];
  
  // Find nearby marks for context (within 2km)
  const contextMarks = findNearbyMarks(targetMark, marks, 2000);
  
  // Generate wrong options - ensure at least one mark of the same type is included
  const wrongOptions: RacingMark[] = [];
  const usedIds = new Set([targetMark.id]);
  
  // Check if we have enough total marks for the requested number of options
  const totalAvailableMarks = marks.filter(mark => !usedIds.has(mark.id));
  if (totalAvailableMarks.length < config.numberOfOptions - 1) {
    throw new Error('Not enough marks available for this number of options');
  }
  
  // First, find marks with the same symbol as the target (to make it harder)
  const sameTypeMarks = marks.filter(mark => 
    !usedIds.has(mark.id) && mark.symbol === targetMark.symbol
  );
  
  // Add at least one mark of the same type if available
  if (sameTypeMarks.length > 0) {
    const randomSameType = sameTypeMarks[Math.floor(Math.random() * sameTypeMarks.length)];
    wrongOptions.push(randomSameType);
    usedIds.add(randomSameType.id);
  }
  
  // Fill remaining slots by prioritizing marks at a reasonable distance
  const remainingSlots = config.numberOfOptions - 1 - wrongOptions.length;
  if (remainingSlots > 0) {
    const goodDistanceOptions: RacingMark[] = [];
    const fallbackOptions: RacingMark[] = [];
    const allOtherMarks = marks.filter(mark => !usedIds.has(mark.id));

    // Separate marks into preferred and fallback lists
    for (const mark of allOtherMarks) {
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

    // Add the required number of options from the combined list
    for (let i = 0; i < remainingSlots; i++) {
      const option = combinedOptions[i];
      if (option) {
        wrongOptions.push(option);
        usedIds.add(option.id);
      }
    }
  }
  
  // Combine target and wrong options, then shuffle
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
  
  // Base points for correct answer
  let points = isCorrect ? 100 : 0;
  
  // Time bonus based on difficulty and time left
  let timeBonus = 0;
  if (isCorrect && config.timeLimit) {
    const maxBonusByDifficulty = {
      beginner: 30,
      intermediate: 50,
      advanced: 70
    };
    const maxBonus = maxBonusByDifficulty[config.difficulty] ?? 30;
    const timeLeft = Math.max(0, config.timeLimit - timeElapsed);
    const timeRatio = timeLeft / config.timeLimit;
    timeBonus = Math.floor(timeRatio * maxBonus);
    points += timeBonus;
  }
  
  // Difficulty multiplier
  const difficultyMultiplier = {
    beginner: 1,
    intermediate: 1.5,
    advanced: 2
  }[config.difficulty];
  
  points = Math.floor(points * difficultyMultiplier);
  
  return {
    isCorrect,
    points,
    timeBonus,
    correctMark: targetMark,
    selectedMark
  };
}


// Get hint for a mark (progressive difficulty)
export function getMarkHint(mark: RacingMark, hintLevel: number): string {
  const hints = [
    `This mark is in the ${getGeneralArea(mark)} area of the Solent.`,
    `Look for a ${mark.symbol} colored mark.`,
    `The mark is named "${mark.name.trim()}".`,
    `Description: ${mark.description}`,
    mark.sponsor ? `Sponsored by: ${mark.sponsor}` : 'This is a navigation mark.'
  ];
  
  return hints[Math.min(hintLevel, hints.length - 1)];
}

// Get general area description based on coordinates
function getGeneralArea(mark: RacingMark): string {
  const { lat, lon } = mark;
  
  // Very rough geographical areas of the Solent
  if (lon < -1.6) return 'western';
  if (lon > -1.1) return 'eastern';
  if (lat > 50.8) return 'northern';
  if (lat < 50.7) return 'southern';
  return 'central';
}

// Utility function to shuffle an array
export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Calculate streak bonus
export function calculateStreakBonus(streak: number): number {
  if (streak < 3) return 0;
  return Math.min(streak * 10, 100); // Max 100 bonus points
}

// Get difficulty-appropriate time limit
export function getTimeLimit(difficulty: GameConfig['difficulty']): number {
  switch (difficulty) {
    case 'beginner': return 30; // 30 seconds
    case 'intermediate': return 20; // 20 seconds
    case 'advanced': return 10; // 10 seconds
    default: return 30;
  }
}

// Generate game statistics
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
  
  let grade = 'F';
  if (accuracy >= 90) grade = 'A';
  else if (accuracy >= 80) grade = 'B';
  else if (accuracy >= 70) grade = 'C';
  else if (accuracy >= 60) grade = 'D';
  
  return {
    accuracy: Math.round(accuracy),
    averageTime: Math.round(averageTime),
    pointsPerMinute: Math.round(pointsPerMinute),
    grade
  };
}
