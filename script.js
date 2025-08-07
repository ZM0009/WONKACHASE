const GRID_SIZE = 10;
let playerId = null;
let turn = null;
let gameRef = db.ref("game");

function init() {
  gameRef.once("value", snapshot => {
    const data = snapshot.val() || {};

    if (!data.p1) {
      playerId = "p1";
      gameRef.update({ p1: { x: 0, y: 0 } });
    } else if (!data.p2) {
      playerId = "p2";
      gameRef.update({ p2: { x: 9, y: 9 } });
    } else if (!data.p3) {
      playerId = "p3";
      gameRef.update({ p3: { x: 5, y: 5 }, turn: "p1" });
    } else {
      document.getElementById("status").innerText = "Game is full!";
      return;
    }

    document.getElementById("status").innerText = `You are ${playerId}`;
    listenForUpdates();
  });
}

function listenForUpdates() {
  gameRef.on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;

    turn = data.turn;
    renderGrid(data);
    checkWin(data);
  });
}

function renderGrid(data) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (data.p1 && data.p1.x === x && data.p1.y === y) {
        cell.classList.add("p1");
      }
      if (data.p2 && data.p2.x === x && data.p2.y === y) {
        cell.classList.add("p2");
      }
      if (data.p3 && data.p3.x === x && data.p3.y === y) {
        cell.classList.add("p3");
      }

      grid.appendChild(cell);
    }
  }
}

function move(dir) {
  if (playerId !== turn) return alert("Not your turn!");

  gameRef.once("value", snapshot => {
    const data = snapshot.val();
    let pos = data[playerId];
    if (!pos) return;

    let x = pos.x;
    let y = pos.y;

    if (dir === "up" && y > 0) y--;
    if (dir === "down" && y < GRID_SIZE - 1) y++;
    if (dir === "left" && x > 0) x--;
    if (dir === "right" && x < GRID_SIZE - 1) x++;

    gameRef.update({
      [playerId]: { x, y },
      turn: nextTurn(playerId)
    });
  });
}

function nextTurn(current) {
  return current === "p1" ? "p2" : current === "p2" ? "p3" : "p1";
}

function checkWin(data) {
  const p3 = data.p3;
  const p1 = data.p1;
  const p2 = data.p2;

  if (!p3 || !p1 || !p2) return;

  if ((p3.x === p1.x && p3.y === p1.y) || (p3.x === p2.x && p3.y === p2.y)) {
    alert("Outer players win!");
    gameRef.set(null);
  }
}

init();
