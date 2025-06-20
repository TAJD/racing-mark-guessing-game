import { useState, useEffect, useCallback } from 'react';
import type { GameState, GameConfig, RacingMark } from '../../types/game';
import { OpenSeaMapContainer } from '../Map/OpenSeaMapContainer';
import { MarkLegend } from '../Graphics/MarkIcons';
import { GuessMode } from './GuessMode';
import { ScoreDisplay } from './ScoreDisplay';
import { getRacingMarks } from '../../data/marks';
import { 
  generateGuessQuestion, 
  evaluateGuess, 
  calculateStreakBonus,
  getTimeLimit,
  generateStats,
  shuffleArray
} from '../../utils/gameLogic';

interface GameControllerProps {
  config: GameConfig;
  onGameEnd?: (finalScore: number, stats: any) => void;
}

export function GameController({ config, onGameEnd }: GameControllerProps) {
  const [gameState, setGameState] = useState<GameState>({
    mode: 'guess',
    score: 0,
    streak: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    gameStartTime: Date.now()
  });

  const [currentQuestion, setCurrentQuestion] = useState<{
    targetMark: RacingMark;
    options?: RacingMark[];
    contextMarks?: RacingMark[];
  } | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.75, -1.3]);
  const [mapZoom, setMapZoom] = useState(11);

  const [marks, setMarks] = useState<RacingMark[] | null>(null);

  const generateNewQuestion = useCallback(async () => {
    try {
      if (!marks || !Array.isArray(marks) || marks.length === 0) {
        console.error('No marks available for question generation:', marks);
        setGameEnded(true);
        return;
      }
      const { targetMark, options, contextMarks } = generateGuessQuestion(marks, config);
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
      setLastResult(null);
    } catch (error) {
      console.error('Error generating question:', error);
      setGameEnded(true);
    }
  }, [config, marks]);

  // Load marks on mount
  useEffect(() => {
    getRacingMarks().then((data) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('No racing marks loaded:', data);
        setGameEnded(true);
      } else {
        // Shuffle marks for true randomness each game
        const shuffled = [...data];
        shuffleArray(shuffled);
        setMarks(shuffled);
      }
    }).catch((err) => {
      console.error('Error loading racing marks:', err);
      setGameEnded(true);
    });
  }, []);

  // Initialize first question when marks are loaded
  useEffect(() => {
    if (marks) {
      generateNewQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, generateNewQuestion]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 || showResult || gameEnded) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Handle timeout directly here to avoid stale closure issues
          setGameState(currentState => {
            const newState = {
              ...currentState,
              totalQuestions: currentState.totalQuestions + 1,
              streak: 0 // Reset streak on timeout
            };

            setLastResult({
              isCorrect: false,
              points: 0,
              timeBonus: 0,
              streakBonus: 0,
              totalPoints: 0,
              correctMark: currentQuestion?.targetMark,
              timeout: true
            });

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

  const handleGuessAnswer = useCallback((selectedMark: RacingMark) => {
    if (!currentQuestion || gameEnded) return;

    const timeElapsed = (config.timeLimit || getTimeLimit(config.difficulty)) - timeRemaining;
    const result = evaluateGuess(currentQuestion.targetMark, selectedMark, timeElapsed, config);
    
    setGameState(prev => {
      // Add streak bonus
      const streakBonus = result.isCorrect ? calculateStreakBonus(prev.streak + 1) : 0;
      const totalPoints = result.points + streakBonus;

      const newState = {
        ...prev,
        score: prev.score + totalPoints,
        streak: result.isCorrect ? prev.streak + 1 : 0,
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (result.isCorrect ? 1 : 0),
        lastAnswerTime: Date.now()
      };

      setLastResult({ ...result, streakBonus, totalPoints });
      setShowResult(true);

      // Auto-advance after showing result
      setTimeout(() => {
        if (newState.totalQuestions >= 10) { // End after 10 questions
          setGameEnded(true);
        } else {
          generateNewQuestion();
        }
      }, 3000);

      return newState;
    });
  }, [currentQuestion, timeRemaining, config, gameEnded, generateNewQuestion]);

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
      onGameEnd(gameState.score, stats);
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

    const getGradeEmoji = (grade: string) => {
      switch (grade) {
        case 'A+': return '🏆';
        case 'A': return '🥇';
        case 'B': return '🥈';
        case 'C': return '🥉';
        case 'D': return '📚';
        default: return '💪';
      }
    };

    const getGradeColor = (grade: string) => {
      switch (grade) {
        case 'A+': return 'text-yellow-600';
        case 'A': return 'text-yellow-500';
        case 'B': return 'text-blue-600';
        case 'C': return 'text-green-600';
        case 'D': return 'text-orange-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-2xl md:text-3xl font-bold">Game Complete!</h2>
                <p className="text-blue-100 mt-2">Well done on completing the challenge!</p>
              </div>

              <div className="p-6">
                {/* Score Section */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                    <span className="text-3xl font-bold text-blue-600">{gameState.score}</span>
                  </div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>

                {/* Grade */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                    <span className="text-2xl">{getGradeEmoji(stats.grade)}</span>
                    <span className={`text-xl font-bold ${getGradeColor(stats.grade)}`}>
                      Grade {stats.grade}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{stats.accuracy}%</div>
                    <div className="text-xs text-gray-600">Accuracy</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{gameState.correctAnswers}/{gameState.totalQuestions}</div>
                    <div className="text-xs text-gray-600">Correct</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{gameState.streak}</div>
                    <div className="text-xs text-gray-600">Best Streak</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">{stats.averageTime}s</div>
                    <div className="text-xs text-gray-600">Avg Time</div>
                  </div>
                </div>

                {/* Performance Message */}
                <div className="text-center mb-6">
                  {stats.accuracy >= 80 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-green-600 font-medium">🌟 Excellent Knowledge!</div>
                      <div className="text-sm text-green-600">You really know the Solent racing marks!</div>
                    </div>
                  ) : stats.accuracy >= 60 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-blue-600 font-medium">👍 Good Progress!</div>
                      <div className="text-sm text-blue-600">Keep practicing to improve your knowledge.</div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="text-orange-600 font-medium">💪 Keep Learning!</div>
                      <div className="text-sm text-orange-600">More practice will help you master these marks.</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    🔄 Play Again
                  </button>
                  
                  <button
                    onClick={() => {
                      const text = `I just scored ${gameState.score} points with ${stats.accuracy}% accuracy on the Solent Racing Mark Game! 🏆 #SolentSailing`;
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors border border-gray-300"
                  >
                    📱 Share Score
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
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
              <h1 className="text-xl md:text-2xl font-bold text-blue-600">Guess the Mark!</h1>
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
