import type { RacingMark, GuessResult } from "../../types/game";
import { MarkIcon } from "../Graphics/MarkIcons";

interface GuessModeProps {
  targetMark: RacingMark;
  options: RacingMark[];
  onAnswer: (selectedMark: RacingMark) => void;
  showResult: boolean;
  result?: GuessResult & { streakBonus?: number; totalPoints?: number; timeout?: boolean };
  disabled: boolean;
}

export function GuessMode({
  targetMark,
  options,
  onAnswer,
  showResult,
  result,
  disabled,
}: GuessModeProps) {
  if (showResult && result) {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
        <div className="p-4 md:p-6 flex-1">
          <div className="flex items-center gap-2 mb-4">
            {result.timeout ? (
              <>
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-sm">⏰</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-orange-600">Time's Up!</h2>
              </>
            ) : result.isCorrect ? (
              <>
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-green-600">Correct!</h2>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-sm">✗</span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-red-600">Incorrect!</h2>
              </>
            )}
          </div>

          <div
            className={`p-3 md:p-4 rounded-lg mb-4 ${
              result.isCorrect
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <MarkIcon symbol={targetMark.symbol} size={32} className="flex-shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900">{targetMark.name}</div>
                <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {targetMark.description}
                </div>
              </div>
            </div>

            {result.selectedMark && !result.isCorrect && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="text-xs text-red-600 font-medium mb-1">You selected:</div>
                <div className="flex items-center gap-2">
                  <MarkIcon symbol={result.selectedMark.symbol} size={20} />
                  <span className="text-sm font-medium text-gray-700">
                    {result.selectedMark.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {result.isCorrect && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Points:</span>
                <span className="font-medium">{result.points - (result.timeBonus || 0)}</span>
              </div>

              {result.timeBonus && result.timeBonus > 0 && (
                <div className="flex justify-between items-center text-blue-600">
                  <span>Time Bonus:</span>
                  <span className="font-medium">+{result.timeBonus}</span>
                </div>
              )}

              {result.streakBonus && result.streakBonus > 0 && (
                <div className="flex justify-between items-center text-purple-600">
                  <span>Streak Bonus:</span>
                  <span className="font-medium">+{result.streakBonus}</span>
                </div>
              )}

              <div className="flex justify-between items-center font-bold text-base border-t border-gray-200 pt-2 mt-2">
                <span>Total Points:</span>
                <span className="text-blue-600">{result.totalPoints || result.points}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 md:p-6 flex-1 flex flex-col">
        <div className="mb-6">
          {targetMark.sponsor && !targetMark.sponsorHintDisallowed && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-sm mt-0.5">💡</span>
                <div>
                  <div className="text-xs font-medium text-blue-700 mb-1">Hint:</div>
                  <div className="text-sm text-blue-600">
                    This mark is sponsored by {targetMark.sponsor}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 flex-1 flex flex-col">
          <h3 className="font-medium text-gray-700 text-sm">Choose the correct mark:</h3>

          <div className="flex-1 flex flex-col space-y-3">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => onAnswer(option)}
                disabled={disabled || showResult}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                style={{ minHeight: "64px" }} // Ensures good touch target size
              >
                <div className="flex items-center gap-3">
                  <MarkIcon symbol={option.symbol} size={32} className="flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-base leading-tight">
                      {option.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
