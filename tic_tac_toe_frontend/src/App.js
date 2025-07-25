import React, { useState, useEffect } from "react";
import "./App.css";

// --- UI Color variables from requirements ---
const COLORS = {
  primary: "#1976d2",
  secondary: "#ffffff",
  accent: "#ff4081"
};

// --- UTILITIES AND LOGIC ---
// PUBLIC_INTERFACE
function calculateWinner(squares) {
  /** Returns "X", "O", or null */
  // Lines for Tic Tac Toe win
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6] // diagonals
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function getAvailableMoves(squares) {
  /** Returns indices of empty squares */
  return squares
    .map((val, idx) => (val ? null : idx))
    .filter(idx => idx !== null);
}

// PUBLIC_INTERFACE
function aiMove(squares, aiMark) {
  /** Simple AI: Try to win, then block, else random. Plays for aiMark ("O" or "X") */
  const opponent = aiMark === "X" ? "O" : "X";
  const moves = getAvailableMoves(squares);

  // 1. Win if possible
  for (let idx of moves) {
    const copy = squares.slice();
    copy[idx] = aiMark;
    if (calculateWinner(copy) === aiMark) return idx;
  }
  // 2. Block opponent win
  for (let idx of moves) {
    const copy = squares.slice();
    copy[idx] = opponent;
    if (calculateWinner(copy) === opponent) return idx;
  }
  // 3. Take center if open
  if (moves.includes(4)) return 4;
  // 4. Pick a corner
  const corners = moves.filter(idx => [0, 2, 6, 8].includes(idx));
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  // 5. Random
  if (moves.length) return moves[Math.floor(Math.random() * moves.length)];
  // fallback
  return null;
}

// --- COMPONENTS ---
// PUBLIC_INTERFACE
function Square({ value, onClick, isWinning, disabled }) {
  return (
    <button
      className={`square${isWinning ? " win" : ""}`}
      style={{
        color: value === "X" ? COLORS.primary : COLORS.accent,
        background: COLORS.secondary,
        borderColor: isWinning ? COLORS.accent : "var(--border-color)",
        cursor: disabled ? "not-allowed" : "pointer"
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label={value ? `Square ${value}` : "Empty Square"}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function Board({ squares, onSquareClick, winningLine, disabled }) {
  return (
    <div className="board">
      {squares.map((v, i) => (
        <Square
          key={i}
          value={v}
          onClick={() => onSquareClick(i)}
          isWinning={winningLine && winningLine.includes(i)}
          disabled={!!v || disabled}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function StatusPanel({ turn, winner, isDraw, aiMode, onModeChange }) {
  let statusText;
  if (winner) {
    statusText = `Winner: ${winner}`;
  } else if (isDraw) {
    statusText = "It's a draw!";
  } else {
    statusText = aiMode
      ? `Your Turn: ${turn === "X" ? "You (X)" : "AI (O)"}`
      : `Current Turn: ${turn}`;
  }
  return (
    <div className="status-panel">
      <div className="status">{statusText}</div>
      <div className="mode-select">
        <label>
          <input
            type="checkbox"
            checked={aiMode}
            onChange={e => onModeChange(e.target.checked)}
            aria-label="Play against Computer AI"
          />
          {" Play against Computer"}
        </label>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function RestartButton({ onRestart, disabled }) {
  return (
    <button
      className="btn-restart"
      onClick={onRestart}
      disabled={disabled}
      aria-label="Restart Game"
    >
      Restart Game
    </button>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Board: array of 9 squares (X/O/null)
  const [history, setHistory] = useState([
    Array(9).fill(null)
  ]);
  const [step, setStep] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);
  const [aiMode, setAiMode] = useState(false); // false = 2-player; true = X vs AI as "O"
  const [theme] = useState("light"); // Fixed light theme per requirements

  const squares = history[step];
  const winner = calculateWinner(squares);
  const isDraw = !winner && getAvailableMoves(squares).length === 0;
  const turn = xIsNext ? "X" : "O";
  // For accessibility and highlighting
  let winningLine = null;
  if (winner) {
    // Find the winning line
    const lines = [
      [0, 1, 2],[3, 4, 5],[6, 7, 8],
      [0, 3, 6],[1, 4, 7],[2, 5, 8],
      [0, 4, 8],[2, 4, 6]
    ];
    winningLine = lines.find(
      ([a, b, c]) =>
        squares[a] && squares[a] === squares[b] && squares[a] === squares[c]
    );
  }

  // PUBLIC_INTERFACE
  function handleSquareClick(idx) {
    if (winner || squares[idx]) return;
    const nextSquares = squares.slice();
    nextSquares[idx] = turn;
    const newHistory = history.slice(0, step + 1).concat([nextSquares]);
    setHistory(newHistory);
    setStep(newHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  // Allow user to restart game
  // PUBLIC_INTERFACE
  function handleRestart() {
    setHistory([Array(9).fill(null)]);
    setStep(0);
    setXIsNext(true);
  }

  // Handle toggling AI mode
  // PUBLIC_INTERFACE
  function handleModeChange(mode) {
    // Reset on mode switch to ensure fair starting
    setAiMode(mode);
    setHistory([Array(9).fill(null)]);
    setStep(0);
    setXIsNext(true);
  }

  // AI Move logic (AI always plays "O", user always starts as "X")
  useEffect(() => {
    if (
      aiMode &&
      !winner &&
      !isDraw &&
      !xIsNext // AI plays as "O" after user's "X"
    ) {
      const move = aiMove(squares, "O");
      if (move !== null) {
        setTimeout(() => {
          handleSquareClick(move);
        }, 400); // Small delay for realism
      }
    }
    // eslint-disable-next-line
  }, [aiMode, squares, xIsNext, winner, isDraw]);

  // Apply fixed light theme to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  return (
    <div className="App">
      <header className="ttt-header">
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <div className="ttt-brand-line" />
      </header>
      <main className="ttt-main">
        <StatusPanel
          turn={turn}
          winner={winner}
          isDraw={isDraw}
          aiMode={aiMode}
          onModeChange={handleModeChange}
        />
        <Board
          squares={squares}
          onSquareClick={i => handleSquareClick(i)}
          winningLine={winningLine}
          disabled={!!winner || isDraw}
        />
        <RestartButton onRestart={handleRestart} disabled={step === 0 && !winner && !isDraw} />
      </main>
      <footer className="ttt-footer">
        <span>
          &copy; {new Date().getFullYear()} KAVIA Tic Tac Toe |{" "}
          <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">
            Built with React
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
