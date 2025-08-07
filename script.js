const GRID_SIZE = 10;
let playerId = null;
let turn = null;
let gameRef = db.ref("game");
let turnCount = 0;

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
      gameRef.update({ p3: { x: 5, y: 5 } });
    } else {
      document.getElementById("status").innerText = "Game is full!";
      return;
    }

    let messages = {
      p1: "Welcome to Cat and Mouse, you are a cat and you must catch the mouse within 20 turns or you will be terminated.",
      p2: "Welcome to Cat and Mouse, you are the mouse. You must survive 20 turns without being caught by the cats. If you are caught, you are terminated.",
      p3: "Welcome to Cat and Mouse, you are a cat and you must catch the mouse within 20 turns or you will be terminated."
    };
    document.getElementById("status").innerText = messages[playerId];

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

    // Show start button if 3 players joined and game not started
    if (data.p1 && data.p2 && data.p3 && !data.started && playerId === "p1") {
      document.getElementById("startBtn").style.display = "inline-block";
    } else {
      document.getElementById("startBtn").style.display = "none";
    }

    // Disable controls if game hasn't started
    document.querySelectorAll("#controls button").forEach(btn => {
      btn.disabled = !data.started;
    });

    // Update turn counter
    const turnsRemaining = 20 - (data.gameTurn || 0);
    document.getElementById("turnCounter").innerText = `Turn: ${data.gameTurn || 0} / 20`;

    // Track gameTurn
    if (data.turn && data.started) {
      const moveCounter = data.moveCounter || 0;
      const newCounter = moveCounter + 1;
      if (playerId === data.turn) {
        gameRef.update({ moveCounter: newCounter });
        if (newCounter % 3 === 0) {
          const gameTurn = Math.floor(newCounter / 3);
          gameRef.update({ gameTurn });
        }
      }
    }
  });
}

function renderGrid(data) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell"); cell.textContent = "";

      if (data.p1 && data.p1.x === x && data.p1.y === y) {
        cell.textContent = "🐱";
      }
      if (data.p2 && data.p2.x === x && data.p2.y === y) {
        cell.textContent = "🐭";
      }
      if (data.p3 && data.p3.x === x && data.p3.y === y) {
        cell.textContent = "🐱";
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
    alert("The cats caught the mouse. Cats win!");
    gameRef.set(null);
    setTimeout(() => location.reload(), 1000);
  }

  if ((data.gameTurn || 0) >= 20) {
    alert("The mouse survived 20 turns. Mouse wins!");
    gameRef.set(null);
    setTimeout(() => location.reload(), 1000);
  }
}

function startGame() {
  gameRef.update({ started: true, turn: "p1" });
}

function resetGame() {
  if (confirm("Are you sure you want to reset the game?")) {
    gameRef.set(null);
    location.reload();
  }
}

init();
