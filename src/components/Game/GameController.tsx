import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, GameConfig, RacingMark } from "../../types/game";
import { OpenSeaMapContainer } from "../Map/OpenSeaMapContainer";
import { MarkLegend } from "../Graphics/MarkIcons";
import { GuessMode } from "./GuessMode";
import { ScoreDisplay } from "./ScoreDisplay";
import { getRacingMarks } from "../../data/marks";
import {
  generateGuessQuestion,
  evaluateGuess,
  calculateStreakBonus,
  getTimeLimit,
  generateStats,
  shuffleArray,
} from "../../utils/gameLogic";

type Stats = {
  accuracy: number;
  averageTime: number;
  pointsPerMinute: number;
  grade: string;
  bestStreak?: number;
};

import type { GuessResult } from "../../types/game";

type LastResult = GuessResult & {
  streakBonus?: number;
  totalPoints?: number;
  timeout?: boolean;
};

interface GameControllerProps {
  config: GameConfig;
  onGameEnd?: (finalScore: number, stats: Stats) => void;
  onPlayAgain?: () => void;
  onChangeSettings?: () => void;
  highScore?: number;
}

export function GameController({
  config,
  onGameEnd,
  onPlayAgain,
  onChangeSettings,
  highScore,
}: GameControllerProps) {
  const [gameState, setGameState] = useState<GameState>({
    mode: "guess",
    score: 0,
    streak: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    gameStartTime: Date.now(),
  });

  // Track used mark IDs across questions
  const usedMarkIdsRef = useRef<Set<string>>(new Set());

  const [currentQuestion, setCurrentQuestion] = useState<{
    targetMark: RacingMark;
    options?: RacingMark[];
    contextMarks?: RacingMark[];
  } | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | undefined>(undefined);
  const [gameEnded, setGameEnded] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.75, -1.3]);
  const [mapZoom, setMapZoom] = useState(11);

  const [marks, setMarks] = useState<RacingMark[] | null>(null);
  // Capture once at game-end so "New High Score" doesn't flicker when highScore prop updates
  const newHighScoreRef = useRef<boolean | null>(null);

  const generateNewQuestion = useCallback(async () => {
    try {
      if (!marks || !Array.isArray(marks) || marks.length === 0) {
        console.error("No marks available for question generation:", marks);
        setGameEnded(true);
        return;
      }
      // Pass usedMarkIdsRef.current to generateGuessQuestion
      const { targetMark, options, contextMarks } = generateGuessQuestion(
        marks,
        config,
        usedMarkIdsRef.current
      );
      setCurrentQuestion({ targetMark, options, contextMarks });

      // Center map on target area with context marks visible
      if (contextMarks.length > 0) {
        const allMarks = [targetMark, ...contextMarks];
        const avgLat = allMarks.reduce((sum, mark) => sum + mark.lat, 0) / allMarks.length;
        const avgLon = allMarks.reduce((sum, mark) => sum + mark.lon, 0) / allMarks.length;
        setMapCenter([avgLat, avgLon]);
        setMapZoom(13);
      }

      setTimeRemaining(config.timeLimit || getTimeLimit(config.difficulty));
      setShowResult(false);
      setLastResult(undefined);
    } catch (error) {
      console.error("Error generating question:", error);
      setGameEnded(true);
    }
  }, [config, marks]);

  // Load marks on mount
  useEffect(() => {
    getRacingMarks()
      .then((data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error("No racing marks loaded:", data);
          setGameEnded(true);
        } else {
          const shuffled = [...data];
          shuffleArray(shuffled);
          setMarks(shuffled);
          usedMarkIdsRef.current = new Set();
        }
      })
      .catch((err) => {
        console.error("Error loading racing marks:", err);
        setGameEnded(true);
      });
  }, []);

  // Initialize first question when marks are loaded
  useEffect(() => {
    if (marks) {
      generateNewQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, generateNewQuestion, config.openSeaMapEnabled]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 || showResult || gameEnded) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Handle timeout directly here to avoid stale closure issues
          setGameState((currentState) => {
            const newState = {
              ...currentState,
              totalQuestions: currentState.totalQuestions + 1,
              streak: 0, // Reset streak on timeout
            };

            if (currentQuestion) {
              setLastResult({
                isCorrect: false,
                points: 0,
                timeBonus: 0,
                streakBonus: 0,
                totalPoints: 0,
                correctMark: currentQuestion.targetMark,
                timeout: true,
              });
            }

            setShowResult(true);

            setTimeout(() => {
              if (newState.totalQuestions >= 10) {
                setGameEnded(true);
              } else {
                generateNewQuestion();
              }
            }, 3000);

            return newState;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResult, gameEnded, currentQuestion, generateNewQuestion]);

  const handleGuessAnswer = useCallback(
    (selectedMark: RacingMark) => {
      if (!currentQuestion || gameEnded) return;

      const timeElapsed = (config.timeLimit || getTimeLimit(config.difficulty)) - timeRemaining;
      const result = evaluateGuess(currentQuestion.targetMark, selectedMark, timeElapsed, config);

      setGameState((prev) => {
        const streakBonus = result.isCorrect ? calculateStreakBonus(prev.streak + 1) : 0;
        const totalPoints = result.points + streakBonus;

        if (currentQuestion) {
          usedMarkIdsRef.current.add(currentQuestion.targetMark.id);
        }

        const newState = {
          ...prev,
          score: prev.score + totalPoints,
          streak: result.isCorrect ? prev.streak + 1 : 0,
          totalQuestions: prev.totalQuestions + 1,
          correctAnswers: prev.correctAnswers + (result.isCorrect ? 1 : 0),
          lastAnswerTime: Date.now(),
        };

        setLastResult({ ...result, streakBonus, totalPoints });
        setShowResult(true);

        setTimeout(() => {
          if (newState.totalQuestions >= 10) {
            setGameEnded(true);
          } else {
            generateNewQuestion();
          }
        }, 3000);

        return newState;
      });
    },
    [currentQuestion, timeRemaining, config, gameEnded, generateNewQuestion]
  );

  // Handle final game end logic
  useEffect(() => {
    if (gameEnded && onGameEnd) {
      const gameTime = (Date.now() - (gameState.gameStartTime || Date.now())) / 1000;
      const stats = generateStats(
        gameState.totalQuestions,
        gameState.correctAnswers,
        gameState.score,
        gameTime
      );
      onGameEnd(gameState.score, { ...stats, bestStreak: gameState.streak });
    }
  }, [gameEnded, gameState, onGameEnd]);

  if (gameEnded) {
    const gameTime = (Date.now() - (gameState.gameStartTime || Date.now())) / 1000;
    const stats = generateStats(
      gameState.totalQuestions,
      gameState.correctAnswers,
      gameState.score,
      gameTime
    );

    // Capture once so the banner doesn't flicker when highScore prop updates after onGameEnd
    if (newHighScoreRef.current === null) {
      newHighScoreRef.current = gameState.score > (highScore ?? 0);
    }
    const isNewHighScore = newHighScoreRef.current;

    const getGradeBadge = (grade: string) => {
      switch (grade) {
        case "A+":
          return { ring: "border-[#C9A962]", text: "text-[#C9A962]", bg: "bg-[#C9A962]/10" };
        case "A":
          return { ring: "border-[#1B2A4A]", text: "text-[#1B2A4A]", bg: "bg-[#1B2A4A]/10" };
        case "B":
          return { ring: "border-sky-600", text: "text-sky-700", bg: "bg-sky-50" };
        case "C":
          return { ring: "border-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
        case "D":
          return { ring: "border-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
        default:
          return { ring: "border-slate-400", text: "text-slate-600", bg: "bg-slate-50" };
      }
    };

    const gradeBadge = getGradeBadge(stats.grade);
    const difficulty = config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1);

    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <div className="flex items-center justify-center min-h-screen p-3 sm:p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden border border-[#E8E6E1]">
              {/* Header */}
              <div className="bg-[#1B2A4A] px-5 py-6 sm:px-6 sm:py-7 text-center border-b-4 border-[#C9A962]">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#C9A962]/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#C9A962]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 3h14a1 1 0 0 1 .8 1.6L17 8l2.8 3.4A1 1 0 0 1 19 13H6v7H4V4a1 1 0 0 1 1-1z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-semibold text-white tracking-wide">
                  Navigation Complete
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  {difficulty} &middot; {gameState.totalQuestions} Questions
                </p>
              </div>

              <div className="p-5 sm:p-6">
                {/* New High Score Banner */}
                {isNewHighScore && (
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-2 bg-[#C9A962] text-[#1B2A4A] px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      New High Score
                    </div>
                  </div>
                )}

                {/* Score + Grade */}
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-serif font-bold text-[#1B2A4A]">
                      {gameState.score}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                      Final Score
                    </div>
                  </div>

                  <div className="w-px h-12 bg-[#E8E6E1]" />

                  <div className="text-center">
                    <div
                      className={`w-14 h-14 rounded-full border-4 flex items-center justify-center mx-auto ${gradeBadge.ring} ${gradeBadge.bg}`}
                    >
                      <span className={`text-xl font-serif font-bold ${gradeBadge.text}`}>
                        {stats.grade}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-1.5">
                      Grade
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="text-center p-3 bg-[#F8F7F5] rounded border border-[#E8E6E1]">
                    <div className="text-xl font-serif font-bold text-[#1B2A4A]">
                      {stats.accuracy}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                      Accuracy
                    </div>
                  </div>
                  <div className="text-center p-3 bg-[#F8F7F5] rounded border border-[#E8E6E1]">
                    <div className="text-xl font-serif font-bold text-[#1B2A4A]">
                      {gameState.correctAnswers}/{gameState.totalQuestions}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                      Correct
                    </div>
                  </div>
                  <div className="text-center p-3 bg-[#F8F7F5] rounded border border-[#E8E6E1]">
                    <div className="text-xl font-serif font-bold text-[#1B2A4A]">
                      {gameState.streak}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                      Best Streak
                    </div>
                  </div>
                  <div className="text-center p-3 bg-[#F8F7F5] rounded border border-[#E8E6E1]">
                    <div className="text-xl font-serif font-bold text-[#1B2A4A]">
                      {stats.averageTime}s
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                      Avg Time
                    </div>
                  </div>
                </div>

                {/* Performance Message */}
                <div className="mb-5">
                  {stats.accuracy >= 80 ? (
                    <div className="bg-[#F8F7F5] border-l-2 border-[#C9A962] pl-4 py-3">
                      <p className="text-sm font-medium text-[#1B2A4A]">Excellent navigation</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        You know the Solent racing marks well.
                      </p>
                    </div>
                  ) : stats.accuracy >= 60 ? (
                    <div className="bg-[#F8F7F5] border-l-2 border-[#1B2A4A] pl-4 py-3">
                      <p className="text-sm font-medium text-[#1B2A4A]">Good progress</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Keep practicing to improve your navigation.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#F8F7F5] border-l-2 border-slate-300 pl-4 py-3">
                      <p className="text-sm font-medium text-slate-700">Keep learning</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        More practice will help you master these marks.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => onPlayAgain?.()}
                    className="w-full bg-[#1B2A4A] hover:bg-[#2A3D5E] text-white font-medium py-2.5 px-6 rounded text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Play Again
                  </button>

                  <button
                    onClick={() => onChangeSettings?.()}
                    className="w-full bg-white hover:bg-[#F8F7F5] text-[#1B2A4A] font-medium py-2.5 px-6 rounded text-sm border border-[#1B2A4A] transition-colors"
                  >
                    Change Settings
                  </button>

                  <button
                    onClick={() => {
                      const text = `I scored ${gameState.score} points with ${stats.accuracy}% accuracy on the Solent Racing Mark Quiz! #SolentSailing`;
                      const url = encodeURIComponent(window.location.href);
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`,
                        "_blank"
                      );
                    }}
                    className="w-full bg-white hover:bg-[#F8F7F5] text-slate-500 font-medium py-2.5 px-6 rounded text-sm border border-[#E8E6E1] transition-colors"
                  >
                    Share Score
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Get marks to display on map - show all loaded marks
  const visibleMarks = marks || [];
  const hiddenMarks: string[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b-2 border-[#C9A962] sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
              <h1 className="text-lg md:text-xl font-serif font-semibold text-[#1B2A4A]">
                Solent Racing Marks
              </h1>
              <ScoreDisplay gameState={gameState} timeRemaining={timeRemaining} />
            </div>
          </div>
        </div>

        {/* Mobile Layout: Stack vertically */}
        <div className="md:hidden">
          {/* Map Section - Full width on mobile */}
          <div className="bg-white mt-[64px]">
            <OpenSeaMapContainer
              marks={visibleMarks}
              center={mapCenter}
              zoom={mapZoom}
              highlightedMark={currentQuestion.targetMark.id}
              hiddenMarks={hiddenMarks}
              className="h-[50vh] min-h-[300px]"
              openSeaMapEnabled={config.openSeaMapEnabled}
            />
          </div>

          {/* Game Panel - Bottom sheet style */}
          <div className="p-4">
            <GuessMode
              targetMark={currentQuestion.targetMark}
              options={currentQuestion.options || []}
              onAnswer={handleGuessAnswer}
              showResult={showResult}
              result={lastResult}
              disabled={gameEnded}
            />
          </div>

          {/* Legend - Collapsible on mobile */}
          <div className="px-4 pb-4">
            <MarkLegend className="max-w-full" />
          </div>
        </div>

        {/* Desktop Layout: Side by side */}
        <div className="hidden md:block">
          <div className="flex gap-6 p-6 h-[calc(100vh-120px)]">
            {/* Game Panel */}
            <div className="w-96 flex-shrink-0 h-full">
              <div className="h-full">
                <GuessMode
                  targetMark={currentQuestion.targetMark}
                  options={currentQuestion.options || []}
                  onAnswer={handleGuessAnswer}
                  showResult={showResult}
                  result={lastResult}
                  disabled={gameEnded}
                />
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 h-full">
              <div className="bg-white rounded-lg shadow-sm border h-full">
                <OpenSeaMapContainer
                  marks={visibleMarks}
                  center={mapCenter}
                  zoom={mapZoom}
                  highlightedMark={currentQuestion.targetMark.id}
                  hiddenMarks={hiddenMarks}
                  className="h-full rounded-lg"
                  openSeaMapEnabled={config.openSeaMapEnabled}
                />
              </div>
            </div>
          </div>

          {/* Legend - Desktop */}
          <div className="px-6 pb-6">
            <MarkLegend className="mx-auto max-w-4xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
