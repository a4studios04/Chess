const boardEl = document.getElementById('board');
const moveSound = document.getElementById('move-sound');
const captureSound = document.getElementById('capture-sound');
const turnDisplay = document.getElementById('turn-display');

let gameMode = null;
let engine = null;
let selected = null;
let legal = [];
let board = null;

document.getElementById('pvp-btn').onclick = () => startGame('pvp');
document.getElementById('easy-btn').onclick = () => startGame('easy');
document.getElementById('pro-btn').onclick = () => startGame('pro');
document.getElementById('reset-btn').onclick = () => startGame(gameMode);

function startGame(mode) {
  gameMode = mode;
  engine = new Chess.Game();
  board = engine.exportJson();
  selected = null;
  renderBoard();
  showBoard();
}

function showBoard() {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
}

function renderBoard() {
  boardEl.innerHTML = '';
  legal = [];
  updateTurn();

  const flat = Object.entries(board)
    .map(([pos, p]) => ({pos, piece: p}))
    .sort((a,b) => a.pos[1] - b.pos[1] || a.pos[0].charCodeAt(0) - b.pos[0].charCodeAt(0));
  
  flat.forEach(({pos,piece}) => {
    const sq = document.createElement('div');
    sq.id = pos;
    sq.className = 'square';
    if ( /[a-h][1-8]/.test(pos) ) sq.onclick = () => selectSquare(pos);
    sq.textContent = piece ? piece.charAt(1).toUpperCase() : '';
    if (legal.includes(pos)) sq.classList.add('highlight');
    if (selected === pos) sq.classList.add('selected');
    boardEl.appendChild(sq);
  });
}

function selectSquare(pos) {
  const turn = engine.turn;
  const fromPiece = board[pos];

  if (!selected && fromPiece && fromPiece.charAt(0) === turn) {
    selected = pos;
    legal = engine.moves(pos).map(m => m.to);
    renderBoard();
    return;
  }

  if (selected && legal.includes(pos)) {
    const moved = engine.move({from:selected, to:pos});
    const wasCapture = moved.captured !== undefined;
    board = engine.exportJson();

    animateCapture(pos, wasCapture);
    playSound(wasCapture ? captureSound : moveSound);
    selected = null;
    legal = [];
    renderBoard();

    if (!engine.isGameOver()) {
      if (gameMode !== 'pvp' && engine.turn === 'b') {
        window.setTimeout(AIplay, 200);
      }
    } else {
      alert(engine.isCheckmate() ? `${turnDisplay.textContent} wins!` : "Game over: Draw");
    }
  } else {
    selected = null;
    legal = [];
    renderBoard();
  }
}

function animateCapture(to, didCap) {
  const sq = document.getElementById(to);
  if (didCap) sq.classList.add('captured');
}

function playSound(s) {
  s.currentTime = 0;
  s.play();
}

function updateTurn() {
  turnDisplay.textContent = (engine.turn === 'w') ? "White's turn" : "Black's turn";
}

function AIplay() {
  const depth = (gameMode === 'pro') ? 3 : 1;
  const best = engine.aiMove(depth);
  board = engine.exportJson();
  animateCapture(best.to, engine.lastMove.captured);
  playSound(engine.lastMove.captured ? captureSound : moveSound);
  renderBoard();
}
