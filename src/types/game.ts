export type MarkSymbol = 'R' | 'G' | 'Y' | 'B' | 'RW' | 'YBY' | 'BYB' | 'BY' | 'YB';

export interface RacingMark {
  id: string;
  name: string;
  lat: number;
  lon: number;
  symbol: MarkSymbol;
  description: string;
  sponsor?: string;
  sponsorHintDisallowed?: boolean;
}

export interface GameState {
  mode: 'guess';
  currentMark?: RacingMark;
  options?: RacingMark[];
  score: number;
  streak: number;
  totalQuestions: number;
  correctAnswers: number;
  gameStartTime?: number;
  lastAnswerTime?: number;
}

export interface GameConfig {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  numberOfOptions: number;
  timeLimit?: number;
  hintEnabled: boolean;
  openSeaMapEnabled: boolean;
}

export interface GuessResult {
  isCorrect: boolean;
  points: number;
  timeBonus: number;
  correctMark: RacingMark;
  selectedMark?: RacingMark;
}
