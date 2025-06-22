import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay } from '../Game/ScoreDisplay'
import type { GameState } from '../../types/game'

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  mode: 'guess',
  score: 0,
  streak: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  ...overrides
})

describe('ScoreDisplay', () => {
  it('should render score correctly', () => {
    const gameState = createMockGameState({ score: 150 })
    render(<ScoreDisplay gameState={gameState} timeRemaining={30} />)
    
    expect(screen.getByTestId('score-value')).toHaveTextContent('150')
    expect(screen.getByTestId('score-label')).toBeInTheDocument()
  })

  it('should render basic game information', () => {
    const gameState = createMockGameState({ score: 100 })
    render(<ScoreDisplay gameState={gameState} timeRemaining={45} />)
    
    expect(screen.getByTestId('score-value')).toHaveTextContent('100')
    expect(screen.getByTestId('streak-label')).toBeInTheDocument()
    expect(screen.getByTestId('accuracy-label')).toBeInTheDocument()
  })

  it('should display time remaining', () => {
    const gameState = createMockGameState()
    render(<ScoreDisplay gameState={gameState} timeRemaining={75} />)
    
    expect(screen.getByTestId('time-value')).toHaveTextContent('1:15')
  })

  it('should show accuracy percentage', () => {
    const gameState = createMockGameState({ 
      totalQuestions: 10, 
      correctAnswers: 8 
    })
    render(<ScoreDisplay gameState={gameState} timeRemaining={30} />)
    
    expect(screen.getByTestId('accuracy-value')).toHaveTextContent('80%')
  })

  it('should display mode correctly', () => {
    const guessGameState = createMockGameState({ mode: 'guess' })
    render(<ScoreDisplay gameState={guessGameState} timeRemaining={30} />)
    
    expect(screen.getByTestId('mode-value')).toHaveTextContent('🔍 Guess')
  })

  it('should show question progress', () => {
    const gameState = createMockGameState({ totalQuestions: 5 })
    render(<ScoreDisplay gameState={gameState} timeRemaining={30} />)
    
    expect(screen.getByTestId('question-progress')).toHaveTextContent('6/10')
  })

  it('should render without errors with various props', () => {
    const gameState = createMockGameState({ score: 9999, streak: 15 })
    
    expect(() => {
      render(<ScoreDisplay gameState={gameState} timeRemaining={10} />)
    }).not.toThrow()
    
    expect(screen.getByTestId('score-value')).toHaveTextContent('9999')
  })

  it('should show all required sections', () => {
    const gameState = createMockGameState()
    render(<ScoreDisplay gameState={gameState} timeRemaining={30} />)
    
    // Test that all main sections are present using test IDs
    expect(screen.getByTestId('score-label')).toBeInTheDocument()
    expect(screen.getByTestId('question-label')).toBeInTheDocument()
    expect(screen.getByTestId('accuracy-label')).toBeInTheDocument()
    expect(screen.getByTestId('streak-label')).toBeInTheDocument()
    expect(screen.getByTestId('time-label')).toBeInTheDocument()
    // Mode section is not present in the UI, so no assertion for it
  })
})
