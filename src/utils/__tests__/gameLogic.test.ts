import { describe, it, expect } from 'vitest'
import {
  generateGuessQuestion,
  evaluateGuess,
  getMarkHint,
  calculateStreakBonus,
  getTimeLimit,
  generateStats
} from '../gameLogic'
import type { RacingMark, GameConfig } from '../../types/game'

const mockMarks: RacingMark[] = [
  {
    id: 'mark-1',
    name: 'Cowes Royal Yacht Squadron',
    lat: 50.7595,
    lon: -1.2944,
    symbol: 'Y',
    description: 'Famous yacht club with historic Tower',
    sponsor: undefined
  },
  {
    id: 'mark-2',
    name: 'Bramble Bank',
    lat: 50.7234,
    lon: -1.3123,
    symbol: 'G',
    description: 'Shallow sandbank in central Solent',
    sponsor: undefined
  },
  {
    id: 'mark-3',
    name: 'Sponsored Racing Buoy',
    lat: 50.7800,
    lon: -1.2500,
    symbol: 'R',
    description: 'Racing Buoy near Portsmouth',
    sponsor: 'Test Sponsor'
  },
  {
    id: 'mark-4',
    name: 'Navigation Elbow',
    lat: 50.7600,
    lon: -1.2800,
    symbol: 'B',
    description: 'Navigation Elbow marker',
    sponsor: undefined
  },
  {
    id: 'mark-5',
    name: 'Port Head Mark',
    lat: 50.7400,
    lon: -1.2700,
    symbol: 'G',
    description: 'Port Head navigation marker',
    sponsor: undefined
  },
  {
    id: 'mark-6',
    name: 'Sponsored Racing Mark 2',
    lat: 50.7300,
    lon: -1.2600,
    symbol: 'R',
    description: 'Another racing Buoy',
    sponsor: 'Sponsor 2'
  }
]

const defaultConfig: GameConfig = {
  difficulty: 'advanced', // Use advanced to include all marks
  numberOfOptions: 4,
  timeLimit: 45,
  hintEnabled: true,
  openSeaMapEnabled: false
}

describe('gameLogic', () => {
  describe('generateGuessQuestion', () => {
    it('should generate a valid guess question with correct number of options', () => {
      const result = generateGuessQuestion(mockMarks, defaultConfig)
      
      expect(result.targetMark).toBeDefined()
      expect(result.options).toHaveLength(defaultConfig.numberOfOptions)
      expect(result.options).toContain(result.targetMark)
      expect(result.contextMarks).toBeDefined()
    })

    it('should throw error when not enough marks for options', () => {
      const smallMarkSet = [mockMarks[0]]
      
      expect(() => {
        generateGuessQuestion(smallMarkSet, { ...defaultConfig, numberOfOptions: 4 })
      }).toThrow('Not enough marks available for this difficulty level')
    })

    it('should include target mark in options', () => {
      const result = generateGuessQuestion(mockMarks, defaultConfig)
      
      expect(result.options.some(option => option.id === result.targetMark.id)).toBe(true)
    })
  })

  describe('evaluateGuess', () => {
    const targetMark = mockMarks[0]
    const wrongMark = mockMarks[1]

    it('should award points for correct answer', () => {
      const result = evaluateGuess(targetMark, targetMark, 10, defaultConfig)
      
      expect(result.isCorrect).toBe(true)
      expect(result.points).toBeGreaterThan(0)
      expect(result.correctMark).toBe(targetMark)
      expect(result.selectedMark).toBe(targetMark)
    })

    it('should give no points for wrong answer', () => {
      const result = evaluateGuess(targetMark, wrongMark, 10, defaultConfig)
      
      expect(result.isCorrect).toBe(false)
      expect(result.points).toBe(0)
      expect(result.timeBonus).toBe(0)
    })

    it('should apply time bonus for quick correct answers', () => {
      const quickResult = evaluateGuess(targetMark, targetMark, 5, defaultConfig)
      const slowResult = evaluateGuess(targetMark, targetMark, 40, defaultConfig)
      
      expect(quickResult.timeBonus).toBeGreaterThan(slowResult.timeBonus)
    })

    it('should apply difficulty multiplier', () => {
      const beginnerConfig = { ...defaultConfig, difficulty: 'beginner' as const }
      const advancedConfig = { ...defaultConfig, difficulty: 'advanced' as const }
      
      const beginnerResult = evaluateGuess(targetMark, targetMark, 10, beginnerConfig)
      const advancedResult = evaluateGuess(targetMark, targetMark, 10, advancedConfig)
      
      expect(advancedResult.points).toBeGreaterThan(beginnerResult.points)
    })
  })


  describe('getMarkHint', () => {
    const mark = mockMarks[0]

    it('should return different hints for different levels', () => {
      const hint1 = getMarkHint(mark, 0)
      const hint2 = getMarkHint(mark, 1)
      const hint3 = getMarkHint(mark, 2)
      
      expect(hint1).toBeDefined()
      expect(hint2).toBeDefined()
      expect(hint3).toBeDefined()
      expect(hint1).not.toBe(hint2)
      expect(hint2).not.toBe(hint3)
    })

    it('should include mark name in higher level hints', () => {
      const nameHint = getMarkHint(mark, 2)
      
      expect(nameHint).toContain(mark.name)
    })
  })

  describe('calculateStreakBonus', () => {
    it('should return 0 for streaks less than 3', () => {
      expect(calculateStreakBonus(0)).toBe(0)
      expect(calculateStreakBonus(1)).toBe(0)
      expect(calculateStreakBonus(2)).toBe(0)
    })

    it('should return increasing bonus for longer streaks', () => {
      expect(calculateStreakBonus(3)).toBeGreaterThan(0)
      expect(calculateStreakBonus(5)).toBeGreaterThan(calculateStreakBonus(3))
    })

    it('should cap bonus at maximum value', () => {
      expect(calculateStreakBonus(50)).toBe(100)
    })
  })

  describe('getTimeLimit', () => {
    it('should return appropriate time limits for each difficulty', () => {
      expect(getTimeLimit('beginner')).toBe(60)
      expect(getTimeLimit('intermediate')).toBe(45)
      expect(getTimeLimit('advanced')).toBe(30)
    })
  })

  describe('generateStats', () => {
    it('should calculate correct accuracy percentage', () => {
      const stats = generateStats(10, 8, 500, 300)
      
      expect(stats.accuracy).toBe(80)
    })

    it('should calculate average time', () => {
      const stats = generateStats(10, 8, 500, 300)
      
      expect(stats.averageTime).toBe(30)
    })

    it('should assign appropriate grades', () => {
      const excellentStats = generateStats(10, 9, 500, 300)
      const poorStats = generateStats(10, 4, 200, 300)
      
      expect(excellentStats.grade).toBe('A')
      expect(poorStats.grade).toBe('F')
    })

    it('should handle zero questions gracefully', () => {
      const stats = generateStats(0, 0, 0, 0)
      
      expect(stats.accuracy).toBe(0)
      expect(stats.averageTime).toBe(0)
      expect(stats.pointsPerMinute).toBe(0)
    })
  })
})
