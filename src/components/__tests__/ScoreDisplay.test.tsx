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
    
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText(/score/i)).toBeInTheDocument()
  })

  it('should render basic game information', () => {
    const gameState = createMockGameState({ score: 100 })
    render(<ScoreDisplay gameState={gameState} timeRemaining={45} />)
    
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText(/streak/i)).toBeInTheDocument()
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument()
  })

  it('should display time remaining', () => {
    const gameState = createMockGameState()
    render(<ScoreDisplay gameState={gameState} timeRemaining={75} />)
    
    expect(screen.getByText('1:15')).toBeInTheDocument()
  })

  it('should show accuracy percentage', () => {
    const gameState = createMockGameState({ 
      totalQuestions: 10, 
      correctAnswers: 8 
    })
    render(<ScoreDisplay gameState={gameState} timeRemaining={30} />)
    
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('should display mode correctly', () => {
    const guessGameState = createMockGameState({ mode: 'guess' })
    render(<ScoreDisplay gameState={guessGameState} timeRemaining={30} />)
    
    expect(screen.getByText('🔍 Guess')).toBeInTheDocument()
  })

  it('should show question progress', () => {
    const gameState = createMockGameState({ totalQuestions: 5 })
    render(<ScoreDisplay gameState={gameState} timeRemaining={30} />)
    
    expect(screen.getByText('6/10')).toBeInTheDocument() // totalQuestions + 1
  })

  it('should render without errors with various props', () => {
    const gameState = createMockGameState({ score: 9999, streak: 15 })
    
    expect(() => {
      render(<ScoreDisplay gameState={gameState} timeRemaining={10} />)
    }).not.toThrow()
    
    expect(screen.getByText('9999')).toBeInTheDocument()
  })

  it('should show all required sections', () => {
    const gameState = createMockGameState()
    render(<ScoreDisplay gameState={gameState} timeRemaining={30} />)
    
    // Test that all main sections are present
    expect(screen.getByText(/score/i)).toBeInTheDocument()
    expect(screen.getByText(/question/i)).toBeInTheDocument()
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument()
    expect(screen.getByText(/streak/i)).toBeInTheDocument()
    expect(screen.getByText(/time/i)).toBeInTheDocument()
    expect(screen.getByText(/mode/i)).toBeInTheDocument()
  })
})
