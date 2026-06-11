import React, { useState } from "react";
import { GameController } from "./components/Game/GameController";
import type { GameConfig } from "./types/game";
import { getTimeLimit } from "./utils/gameLogic";
import { getHighScore, saveGameResult } from "./utils/statsStorage";
import "./App.css";

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const getInitialConfig = (): GameConfig => {
    const defaults: GameConfig = {
      difficulty: "beginner",
      numberOfOptions: 5,
      timeLimit: getTimeLimit("beginner"),
      hintEnabled: false,
      openSeaMapEnabled: false,
      proximityMode: "full",
    };

    const cached = localStorage.getItem("gameConfig");
    if (!cached) return defaults;

    try {
      const p = JSON.parse(cached);
      if (typeof p !== "object" || p === null) return defaults;

      const difficulty = (["beginner", "intermediate", "advanced"] as const).includes(p.difficulty)
        ? (p.difficulty as GameConfig["difficulty"])
        : defaults.difficulty;

      const numberOfOptions =
        typeof p.numberOfOptions === "number" && p.numberOfOptions >= 2 && p.numberOfOptions <= 10
          ? p.numberOfOptions
          : defaults.numberOfOptions;

      const timeLimit =
        typeof p.timeLimit === "number" && p.timeLimit > 0 ? p.timeLimit : getTimeLimit(difficulty);

      const hintEnabled = typeof p.hintEnabled === "boolean" ? p.hintEnabled : defaults.hintEnabled;

      const openSeaMapEnabled =
        typeof p.openSeaMapEnabled === "boolean" ? p.openSeaMapEnabled : defaults.openSeaMapEnabled;

      const proximityMode = (["cowes", "full"] as const).includes(p.proximityMode)
        ? (p.proximityMode as GameConfig["proximityMode"])
        : defaults.proximityMode;

      const cowesRadius =
        typeof p.cowesRadius === "number" && p.cowesRadius > 0 ? p.cowesRadius : undefined;

      return {
        difficulty,
        numberOfOptions,
        timeLimit,
        hintEnabled,
        openSeaMapEnabled,
        proximityMode,
        cowesRadius,
      };
    } catch {
      return defaults;
    }
  };

  const [gameConfig, setGameConfig] = useState<GameConfig>(getInitialConfig());
  const [gameKey, setGameKey] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore());

  const handleGameStart = () => {
    setGameStarted(true);
  };

  const handlePlayAgain = () => {
    setGameKey((k) => k + 1);
  };

  const handleChangeSettings = () => {
    setGameStarted(false);
  };

  // Save config to localStorage on change
  // Only cache before game starts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!gameStarted) {
      localStorage.setItem("gameConfig", JSON.stringify(gameConfig));
    }
  }, [gameConfig, gameStarted]);

  type Stats = {
    accuracy: number;
    averageTime: number;
    pointsPerMinute: number;
    grade: string;
    bestStreak?: number;
  };
  const handleGameEnd = (finalScore: number, stats: Stats) => {
    const { highScore: newHighScore } = saveGameResult(
      finalScore,
      stats.accuracy,
      stats.grade,
      stats.bestStreak ?? 0
    );
    setHighScore(newHighScore);
  };

  if (gameStarted) {
    return (
      <GameController
        key={gameKey}
        config={gameConfig}
        onGameEnd={handleGameEnd}
        onPlayAgain={handlePlayAgain}
        onChangeSettings={handleChangeSettings}
        highScore={highScore}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col">
      {/* Site navigation — matches the .site-nav bar on the static pages */}
      <nav
        aria-label="Site"
        className="bg-[#1B2A4A] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 px-4 py-2.5"
      >
        <a href="/" className="text-white font-serif font-semibold text-sm tracking-wide">
          Guess the Mark
        </a>
        <div className="flex gap-4 text-xs">
          <a href="/" aria-current="page" className="text-[#C9A962] font-medium">
            Play
          </a>
          <a href="/learn/" className="text-slate-300 hover:text-white transition-colors">
            Learn the Marks
          </a>
          <a
            href="/solent-racing-marks-2026/"
            className="text-slate-300 hover:text-white transition-colors"
          >
            2026 Changes
          </a>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden border border-[#E8E6E1]">
            {/* Header */}
            <div className="bg-[#1B2A4A] px-5 py-6 sm:px-6 sm:py-8 text-center border-b-4 border-[#C9A962]">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#C9A962]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#C9A962]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.71 4.04c-.18-.18-.43-.29-.71-.29H4c-.28 0-.53.11-.71.29l-.04.04v.5l-1.3 8.4c-.19 1.2.68 2.35 1.89 2.56l11.22 1.93c.17.03.34.05.52.05.89 0 1.71-.51 2.11-1.33l1.45-2.96 2.96-1.45c.82-.4 1.33-1.22 1.33-2.11V4.37c0-.28-.11-.53-.29-.71l-.12-.12-.11-.11zM6.5 16.5l-1.09-7.51L18.3 5.8l-1.09 7.51c-.18 1.15-.98 2.14-2.1 2.44-.37.1-.75.15-1.14.15H6.5z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-white tracking-wide">
                Solent Racing Marks
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Navigation Training</p>
            </div>

            <div className="p-5 sm:p-6">
              {/* Description */}
              <div className="mb-6 sm:mb-7">
                <div className="bg-[#F8F7F5] border-l-2 border-[#1B2A4A] pl-4 py-3">
                  <h2 className="text-sm font-medium text-[#1B2A4A] mb-1.5">How to Play</h2>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Identify racing marks on an interactive chart. Use context clues and
                    geographical knowledge to test your Solent navigation.
                  </p>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-[#F8F7F5] rounded-lg p-4 sm:p-5 mb-5 sm:mb-6">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">
                  Settings
                </h3>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Difficulty
                      </label>
                      <select
                        value={gameConfig.difficulty}
                        onChange={(e) => {
                          const newDifficulty = e.target.value as GameConfig["difficulty"];
                          setGameConfig((prev) => ({
                            ...prev,
                            difficulty: newDifficulty,
                            timeLimit: getTimeLimit(newDifficulty),
                          }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-[#1B2A4A] focus:border-[#1B2A4A] transition-colors"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Options
                      </label>
                      <select
                        value={gameConfig.numberOfOptions}
                        onChange={(e) =>
                          setGameConfig((prev) => ({
                            ...prev,
                            numberOfOptions: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-[#1B2A4A] focus:border-[#1B2A4A] transition-colors"
                      >
                        <option value={5}>5 choices</option>
                        <option value={6}>6 choices</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                      <input
                        type="checkbox"
                        id="hints"
                        checked={gameConfig.hintEnabled}
                        onChange={(e) =>
                          setGameConfig((prev) => ({
                            ...prev,
                            hintEnabled: e.target.checked,
                          }))
                        }
                        className="h-3.5 w-3.5 text-[#1B2A4A] focus:ring-[#1B2A4A] border-slate-300 rounded"
                      />
                      <span className="text-xs text-slate-600">Show hints for sponsored marks</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                      <input
                        type="checkbox"
                        id="openSeaMap"
                        checked={gameConfig.openSeaMapEnabled}
                        onChange={(e) =>
                          setGameConfig((prev) => ({
                            ...prev,
                            openSeaMapEnabled: e.target.checked,
                          }))
                        }
                        className="h-3.5 w-3.5 text-[#1B2A4A] focus:ring-[#1B2A4A] border-slate-300 rounded"
                      />
                      <span className="text-xs text-slate-600">Show nautical chart layers</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-[#FFFBEB] rounded border border-[#FCD34D] cursor-pointer hover:border-[#FBBF24] transition-colors">
                      <input
                        type="checkbox"
                        id="cowesMode"
                        checked={gameConfig.proximityMode === "cowes"}
                        onChange={(e) =>
                          setGameConfig((prev) => ({
                            ...prev,
                            proximityMode: e.target.checked ? "cowes" : "full",
                          }))
                        }
                        className="h-3.5 w-3.5 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                      />
                      <span className="text-xs text-amber-800 font-medium">Cowes Daring Mode</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Personal Best */}
              {highScore > 0 && (
                <div className="text-center mb-4 py-2 px-4 bg-[#F8F7F5] border border-[#E8E6E1] rounded flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">
                    Personal Best
                  </span>
                  <span className="text-sm font-serif font-semibold text-[#1B2A4A]">
                    {highScore}
                  </span>
                </div>
              )}

              {/* Start Button */}
              <div className="text-center mb-5">
                <button
                  onClick={handleGameStart}
                  className="bg-[#1B2A4A] hover:bg-[#2A3D5E] text-white font-medium py-2.5 px-8 rounded text-sm transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
                >
                  Begin Quiz
                </button>
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                <p>
                  Mark data from{" "}
                  <a
                    href="https://www.scra.org.uk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-[#1B2A4A] underline"
                  >
                    SCRA
                  </a>
                </p>
                <p className="mt-1">
                  <a
                    href="/solent-racing-marks-2026/"
                    className="text-slate-500 hover:text-[#1B2A4A] underline"
                  >
                    2026 mark changes
                  </a>
                  {" · "}
                  <a href="/learn/" className="text-slate-500 hover:text-[#1B2A4A] underline">
                    Learn the marks
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
