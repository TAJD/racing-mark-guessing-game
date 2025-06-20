# Test Suite Documentation

This project uses **Vitest** as the testing framework, which is a lightweight, fast test runner designed specifically for Vite projects.

## Test Structure

### Unit Tests
- **`src/utils/__tests__/gameLogic.test.ts`** - Tests for game logic functions including:
  - Question generation for guess and place modes
  - Answer evaluation and scoring
  - Streak bonuses and statistics calculation
  - Hint generation
  - Time limits and difficulty settings

- **`src/utils/__tests__/gpxParser.test.ts`** - Tests for GPX parsing utilities including:
  - GPX XML parsing
  - Mark filtering by difficulty
  - Distance calculations using Haversine formula
  - Nearby mark detection

### Component Tests
- **`src/components/__tests__/ScoreDisplay.test.tsx`** - Tests for React components including:
  - Score rendering
  - Streak display
  - Edge cases (zero scores, high scores)

## Running Tests

### Available Commands

```bash
# Run tests in watch mode (recommended for development)
pnpm test

# Run tests once and exit
pnpm test:run

# Run tests with UI (if @vitest/ui is installed)
pnpm test:ui
```

### Test Configuration

Tests are configured in `vite.config.ts` with the following setup:
- **Environment**: jsdom (for DOM testing)
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Setup**: `src/test/setup.ts` (includes testing-library extensions)

### Setup File

The `src/test/setup.ts` file includes:
- `@testing-library/jest-dom` matchers for enhanced assertions
- Mocks for browser APIs not available in jsdom:
  - `matchMedia` - Required for responsive design tests
  - `ResizeObserver` - Required for components that observe element size changes

## Testing Best Practices

### Utility Functions
- Test pure functions with various input scenarios
- Include edge cases (empty arrays, null values, extreme numbers)
- Test error conditions and boundary values
- Verify mathematical calculations with known inputs/outputs

### React Components
- Test component rendering with different props
- Verify user interactions using `@testing-library/user-event`
- Test accessibility features and ARIA attributes
- Mock external dependencies (APIs, complex child components)

### Game Logic
- Test scoring algorithms with various difficulty levels
- Verify random generation produces valid results
- Test time-based features with controlled time values
- Ensure game state transitions work correctly

## Test Coverage

The test suite covers:
- ✅ Core game logic functions
- ✅ GPX data parsing and validation
- ✅ Distance calculations and geographical utilities
- ✅ Basic component rendering
- ✅ Scoring and evaluation algorithms

### Areas for Future Testing
- User interaction flows (clicking, dragging on map)
- Game state management and transitions
- Error handling and recovery
- Performance with large datasets
- Integration tests for complete game workflows

## Debugging Tests

### VS Code Integration
- Install the "Vitest" VS Code extension for inline test results
- Use the Test Explorer panel to run individual tests
- Set breakpoints in test files for debugging

### Command Line Debugging
```bash
# Run specific test file
pnpm test gameLogic.test.ts

# Run tests matching a pattern
pnpm test --grep "calculateDistance"

# Run tests with verbose output
pnpm test --reporter=verbose
```

## Mocking Guidelines

### External APIs
```typescript
// Mock fetch for API calls
vi.mock('fetch')
const mockFetch = vi.mocked(fetch)
```

### React Components
```typescript
// Mock heavy components like maps
vi.mock('../Map/OpenSeaMapContainer', () => ({
  OpenSeaMapContainer: vi.fn(() => <div data-testid="mock-map" />)
}))
```

### Browser APIs
Most browser API mocks are already set up in `setup.ts`, but you can add more:
```typescript
// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn()
  }
})
```

## Continuous Integration

Tests run automatically in CI/CD pipelines. The test command exits with a non-zero code if any tests fail, preventing broken code from being deployed.

For local development, tests run in watch mode and re-run automatically when files change, providing immediate feedback during development.
