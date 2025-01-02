import "./style.css";

const WeightData = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 0, 0, 0, 0, -2, 10],
  [5, -2, 0, 0, 0, 0, -2, 5],
  [5, -2, 0, 0, 0, 0, -2, 5],
  [10, -2, 0, 0, 0, 0, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
]; // 重みづけデータ2
const dirs = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]; // 方向データ

const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;
// const FLIP_TIME = 200;
const data: number[][] = [];
let myTurn = false;
let isAnimated = false; // アニメーション中かどうか

const message = getElement("message");
const cover = getElement("cover");
const status = getElement("status");
const b = getElement("board");
const numWhiteElem = getElement("numWhite");
const numBlackElem = getElement("numBlack");

init();

function init() {
  for (let i = 0; i < 8; i++) {
    const tr = document.createElement("tr");
    data[i] = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let j = 0; j < 8; j++) {
      const td = document.createElement("td");
      td.className = "cell";
      td.id = "cell" + i + j;
      td.onclick = clicked;
      tr.appendChild(td);
    }
    b.appendChild(tr);
  }
  put(3, 3, WHITE);
  put(4, 4, WHITE);
  put(3, 4, BLACK);
  put(4, 3, BLACK);
  update();
}

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element) {
    return element;
  } else {
    throw new Error("要素が取得できません");
  }
}

function update() {
  let numWhite = 0;
  let numBlack = 0;
  // 盤面のカウント
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (data[y][x] === WHITE) numWhite++;
      if (data[y][x] === BLACK) numBlack++;
    }
  }
  numWhiteElem.textContent = String(numWhite);
  numBlackElem.textContent = String(numBlack);

  const whiteFlip = canFlip(data, WHITE);
  const blackFlip = canFlip(data, BLACK);

  // 勝敗判定
  if (numWhite + numBlack === 64 || (!blackFlip && !whiteFlip)) {
    if (numWhite > numBlack) {
      message.textContent = "白の勝ち！";
      celebrateWinner("white");
    } else if (numWhite < numBlack) {
      message.textContent = "黒の勝ち！";
      celebrateWinner("black");
    } else {
      message.textContent = "引き分け";
    }
    return;
  }

  // ターン変更
  if (!blackFlip) {
    showMessage("黒スキップ");
    myTurn = false;
  } else if (!whiteFlip) {
    showMessage("白スキップ");
    myTurn = true;
  } else {
    myTurn = !myTurn;
  }

  // コンピュータを呼び出す
  if (!myTurn) {
    setStatus("計算中...");
    setTimeout(() => {
      think();
      setStatus("");
    }, 1000);
  }
}

function showMessage(str: string) {
  message.textContent = str;
  setTimeout(() => {
    message.textContent = "";
  }, 1000);
}

function setStatus(str: string) {
  status.textContent = str;
  cover.style.display = str === "" ? "none" : "flex";
}

function clicked(e: MouseEvent) {
  if (!myTurn || isAnimated) return;
  const target = e.target as HTMLElement;
  const id = target.id;
  const i = parseInt(id.charAt(4));
  const j = parseInt(id.charAt(5));

  const flipped = getFlipCells(data, i, j, BLACK);
  if (flipped.length > 0) {
    put(i, j, BLACK);
    for (let k = 0; k < flipped.length; k++) {
      put(flipped[k][0], flipped[k][1], BLACK);
    }
    update();
  } else {
    showMessage("そこには置けません");
  }
}

function put(i: number, j: number, color: number) {
  const c = document.getElementById("cell" + i + j);
  if (!c) throw new Error("cellが取得できません");
  data[i][j] = color;
  // 新たに石を置く場合
  if (c.className === "cell") {
    c.classList.add(color === BLACK ? "black" : "white");
    return;
  }
  // すでにある石を裏返す場合
  switch (color) {
    case WHITE:
      if (c.className !== "cell black") break;
      c.classList.remove("black");
      c.classList.add("flip-to-white");
      isAnimated = true;
      setTimeout(() => {
        c.classList.remove("flip-to-white");
        c.classList.add("white");
        isAnimated = false;
      }, 600);
      break;
    case BLACK:
      if (c.className !== "cell white") break;
      c.classList.remove("white");
      c.classList.add("flip-to-black");
      isAnimated = true;
      setTimeout(() => {
        isAnimated = false;
        c.classList.remove("flip-to-black");
        c.classList.add("black");
      }, 600);
      break;
    default:
      throw new Error("cellのclassNameが正しくありません");
  }
}

function think() {
  // 範囲外の数で初期化
  let highScore = -Infinity;
  let px = -1,
    py = -1;

  const validMoves = getValidMoves(data, WHITE);
  for (const move of validMoves) {
    const newBoard = makeMove(data, move, WHITE);
    const moveValue = minimax(newBoard, 6, false, WHITE, -Infinity, Infinity);

    if (moveValue > highScore) {
      highScore = moveValue;
      px = move[0];
      py = move[1];
    }
  }

  // 白が置ける場所があった場合
  if (px >= 0 && py >= 0) {
    const flipped = getFlipCells(data, px, py, WHITE);
    if (flipped.length > 0) {
      put(px, py, WHITE);
      for (let k = 0; k < flipped.length; k++) {
        put(flipped[k][0], flipped[k][1], WHITE);
      }
    }
  } else {
    throw new Error("コンピュータにエラーが発生しました");
  }

  update();
}

function calcWeightData(board: number[][], color: number) {
  const opponent = color === BLACK ? WHITE : BLACK;
  let playerScore = 0;
  let opponentScore = 0;

  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (board[x][y] === color) {
        playerScore += WeightData[x][y];
      } else if (board[x][y] === opponent) {
        opponentScore += WeightData[x][y];
      }
    }
  }
  return playerScore - opponentScore;
}

function copyData(board: number[][]) {
  return board.map((row) => [...row]);
}

function minimax(
  board: number[][],
  depth: number,
  isAI: boolean, // AIの番かどうか
  color: number, // AIの石の色
  alpha: number,
  beta: number
) {
  if (depth === 0 || isGameOver(board)) {
    return calcWeightData(board, color);
  }
  const opponent = color === WHITE ? BLACK : WHITE;
  const validMoves = getValidMoves(board, isAI ? color : opponent);

  // 有効な手がない場合の処理を追加
  // isGameover()でハンドリング可能
  if (validMoves.length === 0) {
    console.log("有効な手がない");
    return calcWeightData(board, color);
  }

  if (isAI) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      const newBoard = makeMove(board, move, color);
      const evalScore = minimax(newBoard, depth - 1, false, color, alpha, beta);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      const newBoard = makeMove(board, move, opponent);
      const evalScore = minimax(newBoard, depth - 1, true, color, alpha, beta);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// 有効な手を取得する関数
function getValidMoves(board: number[][], color: number) {
  const validMoves = [];
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const flipped = getFlipCells(board, x, y, color);
      if (flipped.length > 0) {
        validMoves.push([x, y]);
      }
    }
  }
  return validMoves;
}

function makeMove(board: number[][], move: number[], color: number) {
  const newBoard = copyData(board);
  const flipped = getFlipCells(newBoard, move[0], move[1], color);
  if (flipped.length > 0) {
    for (let i = 0; i < flipped.length; i++) {
      const tx = flipped[i][0];
      const ty = flipped[i][1];
      newBoard[tx][ty] = color;
    }
    newBoard[move[0]][move[1]] = color;
    return newBoard;
  }
  return newBoard;
}

function isGameOver(board: number[][]) {
  let numWhite = 0;
  let numBlack = 0;
  // 盤面のカウント
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (board[y][x] === WHITE) numWhite++;
      if (board[y][x] === BLACK) numBlack++;
    }
  }
  const whiteFlip = canFlip(board, WHITE);
  const blackFlip = canFlip(board, BLACK);
  // 勝敗判定
  if (numWhite + numBlack === 64 || (!blackFlip && !whiteFlip)) {
    return true;
  }
  return false;
}

function canFlip(board: number[][], color: number) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const flipped = getFlipCells(board, x, y, color);
      if (flipped.length > 0) {
        return true;
      }
    }
  }
  return false;
}

function getFlipCells(board: number[][], i: number, j: number, color: number) {
  // colorは新たに置く石の色
  if (board[i][j] === BLACK || board[i][j] === WHITE) {
    return [];
  }
  let result: number[][] = [];
  for (let p = 0; p < dirs.length; p++) {
    const flipped = getFlipCellsOneDir(
      board,
      i,
      j,
      dirs[p][0],
      dirs[p][1],
      color
    );
    result = result.concat(flipped);
  }
  return result;
}

function getFlipCellsOneDir(
  board: number[][],
  i: number,
  j: number,
  dirX: number,
  dirY: number,
  color: number
) {
  let x = i + dirX;
  let y = j + dirY;
  const flipped = [];

  if (!isInBoard(x, y) || board[x][y] === color || board[x][y] === EMPTY) {
    return [];
  }
  flipped.push([x, y]);

  while (true) {
    x += dirX;
    y += dirY;
    if (!isInBoard(x, y) || board[x][y] === EMPTY) {
      return [];
    }
    if (board[x][y] === color) {
      return flipped;
    } else {
      flipped.push([x, y]);
    }
  }
}

function isInBoard(x: number, y: number) {
  return x >= 0 && y >= 0 && x <= 7 && y <= 7;
}

// ゲーム終了時、勝者の色の石すべてにアニメーションを適用
function celebrateWinner(winnerColor: "white" | "black") {
  setTimeout(() => {
    const winnerCells = document.querySelectorAll(`.${winnerColor}`);
    winnerCells.forEach((cell) => {
      cell.classList.add(`winner-${winnerColor}`);
    });
  }, 1000);
}
