import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent, cleanup } from "@testing-library/react";
import { GameController } from "../Game/GameController";
import type { GameConfig, RacingMark } from "../../types/game";
import { getRacingMarks } from "../../data/marks";
import { QUESTIONS_PER_GAME } from "../../constants/app";

vi.mock("../Map/OpenSeaMapContainer", () => ({
  OpenSeaMapContainer: () => null,
}));

vi.mock("../../data/marks", () => ({
  getRacingMarks: vi.fn(),
}));

const mockGetRacingMarks = getRacingMarks as ReturnType<typeof vi.fn>;

const makeMarks = (count: number): RacingMark[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `mark-${i}`,
    name: `Mark ${i}`,
    lat: 50.7 + i * 0.02,
    lon: -1.3 + i * 0.02,
    symbol: (i % 2 === 0 ? "R" : "G") as RacingMark["symbol"],
    description: `Description ${i}`,
  }));

const defaultConfig: GameConfig = {
  difficulty: "advanced",
  numberOfOptions: 4,
  timeLimit: 30,
  hintEnabled: false,
  openSeaMapEnabled: false,
  proximityMode: "full",
};

/** Render and wait for marks to load and first question to generate */
async function renderAndLoad(config = defaultConfig, markCount = 20) {
  const marks = makeMarks(markCount);
  mockGetRacingMarks.mockResolvedValue(marks);
  render(<GameController config={config} />);

  await act(async () => {
    // Resolve the getRacingMarks promise
    await Promise.resolve();
    // Let React process the state updates from the resolved promise
    await Promise.resolve();
  });

  return marks;
}

describe("GameController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    cleanup();
  });

  describe("loading", () => {
    it("shows loading state initially before marks resolve", () => {
      // Promise that never resolves to keep the loading state
      mockGetRacingMarks.mockReturnValue(new Promise(() => {}));
      render(<GameController config={defaultConfig} />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows answer buttons after marks load", async () => {
      await renderAndLoad();
      // Both mobile and desktop layouts render options, so total >= numberOfOptions
      const buttons = screen.getAllByRole("button").filter((b) => b.textContent?.includes("Mark "));
      expect(buttons.length).toBeGreaterThanOrEqual(defaultConfig.numberOfOptions);
    });
  });

  describe("error state", () => {
    it("shows error screen when getRacingMarks rejects", async () => {
      mockGetRacingMarks.mockRejectedValue(new Error("Network error"));
      render(<GameController config={defaultConfig} />);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getAllByText(/unable to load/i).length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("shows error screen when getRacingMarks returns empty array", async () => {
      mockGetRacingMarks.mockResolvedValue([]);
      render(<GameController config={defaultConfig} />);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
    });
  });

  describe("timer", () => {
    it("shows timeout result when timer expires", async () => {
      await renderAndLoad({ ...defaultConfig, timeLimit: 5 });

      // Advance past the time limit (timer polls at 250ms)
      await act(async () => {
        vi.advanceTimersByTime(5500);
      });

      // Both mobile and desktop render the result — at least one should be present
      expect(screen.getAllByText(/time's up/i).length).toBeGreaterThan(0);
    });

    it("advances to next question after timeout display period", async () => {
      await renderAndLoad({ ...defaultConfig, timeLimit: 5 });

      // Expire timer
      await act(async () => {
        vi.advanceTimersByTime(5500);
      });

      expect(screen.getAllByText(/time's up/i).length).toBeGreaterThan(0);

      // Advance past the 3s result display
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      // Time's Up should be gone — new question loaded
      expect(screen.queryAllByText(/time's up/i).length).toBe(0);
    });
  });

  describe("answer handling", () => {
    it("shows a result after clicking an answer", async () => {
      await renderAndLoad();

      const optionButtons = screen
        .getAllByRole("button")
        .filter((b) => b.textContent?.includes("Mark "));

      await act(async () => {
        fireEvent.click(optionButtons[0]);
      });

      // Both mobile and desktop render the result — check at least one element exists
      const hasResult =
        screen.queryAllByText(/correct!/i).length > 0 ||
        screen.queryAllByText(/incorrect!/i).length > 0;
      expect(hasResult).toBe(true);
    });

    it("increments question counter after answering", async () => {
      await renderAndLoad();

      // Initial counter: "1/10"
      expect(screen.getByTestId("question-progress")).toHaveTextContent("1/10");

      const optionButtons = screen
        .getAllByRole("button")
        .filter((b) => b.textContent?.includes("Mark "));

      await act(async () => {
        fireEvent.click(optionButtons[0]);
      });

      // Advance past result delay
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      // Counter should have advanced
      expect(screen.getByTestId("question-progress")).toHaveTextContent("2/10");
    });
  });

  describe("game end", () => {
    it("shows game complete screen after QUESTIONS_PER_GAME timeouts", async () => {
      await renderAndLoad({ ...defaultConfig, timeLimit: 2 });

      for (let i = 0; i < QUESTIONS_PER_GAME; i++) {
        // Let the timer expire
        await act(async () => {
          vi.advanceTimersByTime(2500);
        });
        // Let the result display and next question load
        await act(async () => {
          vi.advanceTimersByTime(3200);
        });
      }

      expect(screen.getByText(/game complete/i)).toBeInTheDocument();
    });
  });

  describe("bestStreak", () => {
    it("shows Best Streak label on game complete screen", async () => {
      await renderAndLoad({ ...defaultConfig, timeLimit: 2 });

      for (let i = 0; i < QUESTIONS_PER_GAME; i++) {
        await act(async () => {
          vi.advanceTimersByTime(2500);
        });
        await act(async () => {
          vi.advanceTimersByTime(3200);
        });
      }

      expect(screen.getByText(/game complete/i)).toBeInTheDocument();
      expect(screen.getByText(/best streak/i)).toBeInTheDocument();
    });
  });
});
