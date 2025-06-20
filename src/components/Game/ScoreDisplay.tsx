import { useState } from 'react';
import type { GameState } from '../../types/game';

interface ScoreDisplayProps {
  gameState: GameState;
  timeRemaining: number;
}

export function ScoreDisplay({ gameState, timeRemaining }: ScoreDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (time: number): string => {
    if (time <= 10) return 'text-red-500';
    if (time <= 20) return 'text-orange-500';
    return 'text-gray-700';
  };

  const getStreakColor = (streak: number): string => {
    if (streak >= 5) return 'text-purple-600';
    if (streak >= 3) return 'text-blue-600';
    return 'text-gray-700';
  };

  const accuracy = gameState.totalQuestions > 0 
    ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100)
    : 0;

  return (
    <div className="w-full">
      {/* Mobile-first compact view */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Score</div>
            <div className="font-bold text-lg text-blue-600">{gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Question</div>
            <div className="font-semibold text-sm">{gameState.totalQuestions + 1}/10</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Time</div>
            <div className={`font-mono font-bold ${getTimeColor(timeRemaining)}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Toggle score details"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop horizontal layout */}
      <div className="hidden md:flex md:items-center md:gap-6 md:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Score:</span>
          <span className="font-bold text-lg text-blue-600">{gameState.score}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Question:</span>
          <span className="font-semibold">{gameState.totalQuestions + 1}/10</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Accuracy:</span>
          <span className="font-semibold">{accuracy}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Streak:</span>
          <span className={`font-semibold ${getStreakColor(gameState.streak)}`}>
            {gameState.streak}{gameState.streak >= 3 && ' 🔥'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Time:</span>
          <span className={`font-mono font-bold text-lg ${getTimeColor(timeRemaining)}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Expandable details for mobile */}
      {showDetails && (
        <div className="md:hidden mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3 text-sm">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500 mb-1">Accuracy</div>
            <div className="font-semibold">{accuracy}%</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500 mb-1">Streak</div>
            <div className={`font-semibold ${getStreakColor(gameState.streak)}`}>
              {gameState.streak}{gameState.streak >= 3 && ' 🔥'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
