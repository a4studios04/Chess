const board = document.getElementById('chessboard');
const boardState = [];
let selected = null;
let currentPlayer = 'w'; // w = white, b = black

const pieces = {
  'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔', 'wp': '♙',
  'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚', 'bp': '♟'
};

function initBoard() {
  const setup = [
    ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
    ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
    ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'],
  ];

  boardState.length = 0;
  board.innerHTML = '';

  for (let row = 0; row < 8; row++) {
    boardState.push([]);
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = setup[row][col];
      boardState[row][col] = piece;

      if (piece) square.textContent = pieces[piece];

      square.addEventListener('click', () => handleClick(row, col, square));

      board.appendChild(square);
    }
  }
  updateTurnIndicator();
}

function handleClick(row, col, square) {
  const piece = boardState[row][col];

  if (selected === null && piece && piece.startsWith(currentPlayer)) {
    clearSelection();
    square.classList.add('selected');
    selected = { row, col, piece };

    const legalMoves = getLegalMoves(piece, row, col);
    legalMoves.forEach(move => {
      const targetSquare = document.querySelector(`.square[data-row='${move.row}'][data-col='${move.col}']`);
      if (targetSquare) targetSquare.classList.add('highlight');
    });

    return;
  }

  if (selected) {
    if (selected.row === row && selected.col === col) {
      clearSelection();
      selected = null;
      return;
    }

    const legalMoves = getLegalMoves(selected.piece, selected.row, selected.col);
    const isLegal = legalMoves.some(m => m.row === row && m.col === col);

    if (isLegal) {
      boardState[row][col] = selected.piece;
      boardState[selected.row][selected.col] = '';

      updateBoard();
      clearSelection();
      selected = null;

      currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
      updateTurnIndicator();

      if (isInCheck(currentPlayer)) {
        alert(`${currentPlayer === 'w' ? 'White' : 'Black'} is in Check!`);
      }
    }
  }
}

function updateBoard() {
  [...board.children].forEach(square => {
    const row = square.dataset.row;
    const col = square.dataset.col;
    const piece = boardState[row][col];
    square.textContent = piece ? pieces[piece] : '';
  });
}

function clearSelection() {
  [...board.children].forEach(square => {
    square.classList.remove('selected');
    square.classList.remove('highlight');
  });
}

function getLegalMoves(piece, row, col) {
  const moves = [];
  const color = piece[0];
  const type = piece[1];

  const isEnemy = (r, c) => boardState[r][c] && boardState[r][c][0] !== color;
  const isEmpty = (r, c) => !boardState[r][c];

  switch (type) {
    case 'p':
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      if (isInBounds(row + dir, col) && isEmpty(row + dir, col))
        moves.push({ row: row + dir, col });

      if (row === startRow && isEmpty(row + dir, col) && isEmpty(row + 2 * dir, col))
        moves.push({ row: row + 2 * dir, col });

      [-1, 1].forEach(dc => {
        const r = row + dir;
        const c = col + dc;
        if (isInBounds(r, c) && isEnemy(r, c))
          moves.push({ row: r, col: c });
      });
      break;

    case 'r':
      addLinearMoves(moves, row, col, color, [[1,0], [-1,0], [0,1], [0,-1]]);
      break;

    case 'b':
      addLinearMoves(moves, row, col, color, [[1,1], [1,-1], [-1,1], [-1,-1]]);
      break;

    case 'q':
      addLinearMoves(moves, row, col, color, [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]);
      break;

    case 'n':
      [[-2,-1], [-2,1], [-1,-2], [-1,2], [1,-2], [1,2], [2,-1], [2,1]].forEach(([dr, dc]) => {
        const r = row + dr;
        const c = col + dc;
        if (isInBounds(r, c) && (!boardState[r][c] || isEnemy(r, c)))
          moves.push({ row: r, col: c });
      });
      break;

    case 'k':
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr;
          const c = col + dc;
          if (isInBounds(r, c) && (!boardState[r][c] || isEnemy(r, c)))
            moves.push({ row: r, col: c });
        }
      }
      break;
  }

  return moves;
}

function addLinearMoves(moves, row, col, color, directions) {
  directions.forEach(([dr, dc]) => {
    let r = row + dr;
    let c = col + dc;
    while (isInBounds(r, c)) {
      if (!boardState[r][c]) {
        moves.push({ row: r, col: c });
      } else {
        if (boardState[r][c][0] !== color)
          moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  });
}

function isInBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isInCheck(player) {
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (boardState[r][c] === player + 'k') {
        kingPos = { row: r, col: c };
      }
    }
  }
  if (!kingPos) return false;

  const opponent = player === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardState[r][c];
      if (p && p.startsWith(opponent)) {
        const moves = getLegalMoves(p, r, c);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col))
          return true;
      }
    }
  }
  return false;
}

function updateTurnIndicator() {
  document.getElementById('turn-indicator').textContent = currentPlayer === 'w' ? "White's Turn" : "Black's Turn";
}

initBoard();