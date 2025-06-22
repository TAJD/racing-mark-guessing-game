import { useState } from 'react'
import { GameController } from './components/Game/GameController'
import type { GameConfig } from './types/game'
import { getTimeLimit } from './utils/gameLogic'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    difficulty: 'beginner',
    numberOfOptions: 5,
    timeLimit: getTimeLimit('beginner'),
    hintEnabled: false, // changed from true to false
    openSeaMapEnabled: false
  })

  const handleGameStart = () => {
    setGameStarted(true)
  }

  type Stats = {
    accuracy: number;
    averageTime: number;
    pointsPerMinute: number;
    grade: string;
  };
  const handleGameEnd = (finalScore: number, stats: Stats) => {
    console.log('Game ended with score:', finalScore, 'Stats:', stats)
    // Could save to local storage or send to API
  }

  if (gameStarted) {
    return <GameController config={gameConfig} onGameEnd={handleGameEnd} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 md:p-8 text-center">
              <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
                Guess the Mark!
              </h1>
              <p className="text-blue-100 text-base md:text-lg">
                Test your knowledge of racing marks in the Solent!
              </p>
            </div>

            <div className="p-6 md:p-8">
              {/* Game Description */}
              <div className="mb-6 md:mb-8">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 md:p-6 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-blue-700 mb-2">How to Play</h3>
                      <p className="text-gray-600 mb-3 text-sm md:text-base leading-relaxed">
                        Look at the chart and identify which racing mark is highlighted. Use nearby context marks and chart features to help you.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs md:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          <span>Multiple choice</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          <span>Context marks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          <span>Time bonuses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Settings */}
              <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>⚙️</span>
                  Game Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={gameConfig.difficulty}
                        onChange={(e) => {
                          const newDifficulty = e.target.value as GameConfig['difficulty'];
                          setGameConfig(prev => ({
                            ...prev,
                            difficulty: newDifficulty,
                            timeLimit: getTimeLimit(newDifficulty)
                          }));
                        }}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
                      >
                        <option value="beginner">🌟 Beginner - Famous landmarks</option>
                        <option value="intermediate">⭐ Intermediate - Mixed marks</option>
                        <option value="advanced">🏆 Advanced - All marks</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Answer Options
                      </label>
                      <select
                        value={gameConfig.numberOfOptions}
                        onChange={(e) => setGameConfig(prev => ({ 
                          ...prev, 
                          numberOfOptions: parseInt(e.target.value)
                        }))}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
                      >
                        <option value={5}>5 choices (standard)</option>
                        <option value={6}>6 choices (expert)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="hints"
                        checked={gameConfig.hintEnabled}
                        onChange={(e) => setGameConfig(prev => ({ 
                          ...prev, 
                          hintEnabled: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hints" className="ml-3 text-sm md:text-base text-gray-700 flex items-center gap-2">
                        <span>💡</span>
                        <span>Enable hints for sponsored marks</span>
                      </label>
                    </div>

                    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="openSeaMap"
                        checked={gameConfig.openSeaMapEnabled}
                        onChange={(e) => setGameConfig(prev => ({ 
                          ...prev, 
                          openSeaMapEnabled: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="openSeaMap" className="ml-3 text-sm md:text-base text-gray-700 flex items-center gap-2">
                        <span>🗺️</span>
                        <span>Show OpenSeaMap nautical chart layers</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center mb-6">
                <button
                  onClick={handleGameStart}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg md:text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto min-w-[200px]"
                >
                  🚀 Start Game
                </button>
              </div>

              {/* Footer */}
              <div className="text-center text-xs md:text-sm text-gray-500 border-t border-gray-200 pt-4">
                <p className="leading-relaxed">
Mark data from the <a href="https://www.scra.org.uk/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600">SCRA</a>.
<br className="hidden sm:inline" />
                  Perfect for sailors learning the area or testing their local knowledge!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
