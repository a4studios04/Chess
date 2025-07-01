let engine, boardState, currentMode, selected = null, legalMoves = [];

function startGame(mode) {
  currentMode = mode;
  engine = new Chess.Game();
  boardState = engine.exportJson();
  selected = null;
  legalMoves = [];

  document.getElementById('mode-popup').classList.add('hidden');
  document.getElementById('game-area').classList.remove('hidden');

  renderBoard();
  updateTurnDisplay();
}

function restartGame() {
  document.getElementById('game-area').classList.add('hidden');
  document.getElementById('mode-popup').classList.remove('hidden');
}

function renderBoard() {
  const boardEl = document.getElementById('chessboard');
  boardEl.innerHTML = '';

  const squares = Object.entries(boardState)
    .map(([pos, piece]) => ({pos, piece}))
    .sort((a, b) => {
      return (b.pos[1] - a.pos[1]) || (a.pos.charCodeAt(0) - b.pos.charCodeAt(0));
    });

  squares.forEach(({pos, piece}) => {
    const sq = document.createElement('div');
    sq.classList.add('square');
    sq.classList.add((pos.charCodeAt(0) + parseInt(pos[1])) % 2 === 0 ? 'light' : 'dark');
    sq.id = pos;

    if (legalMoves.includes(pos)) sq.classList.add('highlight');
    if (selected === pos) sq.classList.add('selected');

    if (piece) {
      sq.textContent = getUnicodePiece(piece);
      sq.classList.add('piece');
    }

    sq.addEventListener('click', () => handleClick(pos));
    boardEl.appendChild(sq);
  });
}

function handleClick(pos) {
  const turn = engine.turn;
  const piece = boardState[pos];

  if (!selected && piece && piece[0] === turn) {
    selected = pos;
    legalMoves = engine.moves(pos).map(m => m.to);
    renderBoard();
    return;
  }

  if (selected && legalMoves.includes(pos)) {
    const move = engine.move({from: selected, to: pos});
    boardState = engine.exportJson();

    animateMove(pos);
    selected = null;
    legalMoves = [];
    renderBoard();
    updateTurnDisplay();

    if (engine.isGameOver()) {
      setTimeout(() => {
        alert(engine.isCheckmate() ? "Checkmate!" : "Draw!");
      }, 100);
      return;
    }

    if (currentMode !== 'pvp' && engine.turn === 'b') {
      setTimeout(aiMove, 300);
    }
  } else {
    selected = null;
    legalMoves = [];
    renderBoard();
  }
}

function aiMove() {
  const depth = currentMode === 'pro' ? 3 : 1;
  const aiMove = engine.aiMove(depth);
  boardState = engine.exportJson();
  animateMove(aiMove.to);
  renderBoard();
  updateTurnDisplay();
}

function animateMove(to) {
  const targetSq = document.getElementById(to);
  if (targetSq) targetSq.classList.add('moved');
}

function updateTurnDisplay() {
  document.getElementById('turn-display').textContent =
    (engine.turn === 'w') ? "White's Turn" : "Black's Turn";
}

function getUnicodePiece(piece) {
  const symbols = {
    'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
    'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚'
  };
  return symbols[piece] || '';
}
