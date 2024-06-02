const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scale = 20;
const rows = canvas.height / scale;
const columns = canvas.width / scale;

let snake;
let fruit;
let lastTime = 0;
const speed = 10; // Kecepatan pergerakan ular
let score = 0;
let highscore = localStorage.getItem("highscore") || 0;
let isGameOver = false;
let isPaused = false;

const scoreElement = document.getElementById("score");
const highscoreElement = document.getElementById("highscore");
const finalScoreElement = document.getElementById("finalScore");
highscoreElement.textContent = highscore;

// Muat gambar
const headImage = new Image();
headImage.src = "./aset/kepala.png";
const bodyImage = new Image();
bodyImage.src = "./aset/badan.png";
const tailImage = new Image();
tailImage.src = "./aset/ekor.png";
const fruitImage = new Image();
fruitImage.src = "./aset/makan.png";

(function setup() {
  snake = new Snake();
  fruit = new Fruit();
  fruit.pickLocation();

  function gameLoop(time) {
    if (!isPaused && time - lastTime >= 1000 / speed) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!isGameOver) {
        fruit.draw();
        snake.update();
        snake.draw();

        if (snake.eat(fruit)) {
          fruit.pickLocation();
          score++;
          scoreElement.textContent = score;
          if (score > highscore) {
            highscore = score;
            highscoreElement.textContent = highscore;
            localStorage.setItem("highscore", highscore);
          }
        }

        snake.checkCollision();
      }
      lastTime = time;
    }
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
})();

function Snake() {
  this.x = scale * 2; // Inisialisasi posisi kepala ular
  this.y = 0;
  this.xSpeed = scale * 1; // Kecepatan gerak ular
  this.ySpeed = 0;
  this.total = 3; // Panjang awal ular (kepala + 1 badan + ekor)
  this.tail = [
    { x: this.x - scale, y: this.y }, // Ekor
    { x: this.x - scale * 2, y: this.y }, // Badan
  ];

  this.draw = function () {
    // Gambar ekor
    if (this.tail.length > 1) {
      const tail = this.tail[0];
      const next = this.tail[1];
      ctx.save();
      ctx.translate(tail.x + scale / 2, tail.y + scale / 2);
      ctx.rotate(this.getRotationAngle(tail, next));
      ctx.drawImage(tailImage, -scale / 2, -scale / 2, scale, scale);
      ctx.restore();
    }

    // Gambar badan
    for (let i = 1; i < this.tail.length; i++) {
      const part = this.tail[i];
      const prev = this.tail[i - 1];
      ctx.save();
      ctx.translate(part.x + scale / 2, part.y + scale / 2);
      ctx.rotate(this.getRotationAngle(prev, part));
      ctx.drawImage(bodyImage, -scale / 2, -scale / 2, scale, scale);
      ctx.restore();
    }

    // Gambar kepala dengan rotasi
    ctx.save();
    ctx.translate(this.x + scale / 2, this.y + scale / 2);
    if (this.xSpeed === scale) ctx.rotate((90 * Math.PI) / 180);
    else if (this.xSpeed === -scale) ctx.rotate((-90 * Math.PI) / 180);
    else if (this.ySpeed === -scale) ctx.rotate(0);
    else if (this.ySpeed === scale) ctx.rotate((180 * Math.PI) / 180);
    ctx.drawImage(headImage, -scale / 2, -scale / 2, scale, scale);
    ctx.restore();
  };

  this.getRotationAngle = function (prev, current) {
    if (current.x > prev.x) return (90 * Math.PI) / 180;
    if (current.x < prev.x) return (-90 * Math.PI) / 180;
    if (current.y > prev.y) return (180 * Math.PI) / 180;
    if (current.y < prev.y) return 0;
    return 0;
  };

  this.update = function () {
    if (isGameOver) return;

    // Tambahkan posisi kepala ular ke ekor
    this.tail.push({ x: this.x, y: this.y });

    // Pindahkan kepala ular ke posisi baru
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    // Hapus bagian terakhir ekor kecuali saat makan buah
    while (this.tail.length > this.total) {
      this.tail.shift();
    }

    if (this.x >= canvas.width) {
      this.x = 0;
    }

    if (this.y >= canvas.height) {
      this.y = 0;
    }

    if (this.x < 0) {
      this.x = canvas.width - scale;
    }

    if (this.y < 0) {
      this.y = canvas.height - scale;
    }
  };

  this.changeDirection = function (direction) {
    if (isGameOver) return;

    switch (direction) {
      case "Up":
        if (this.ySpeed === 0) {
          this.xSpeed = 0;
          this.ySpeed = -scale;
        }
        break;
      case "Down":
        if (this.ySpeed === 0) {
          this.xSpeed = 0;
          this.ySpeed = scale;
        }
        break;
      case "Left":
        if (this.xSpeed === 0) {
          this.xSpeed = -scale;
          this.ySpeed = 0;
        }
        break;
      case "Right":
        if (this.xSpeed === 0) {
          this.xSpeed = scale;
          this.ySpeed = 0;
        }
        break;
    }
  };

  this.eat = function (fruit) {
    if (this.x === fruit.x && this.y === fruit.y) {
      this.total++;
      return true;
    }
    return false;
  };

  this.checkCollision = function () {
    for (let i = 0; i < this.tail.length; i++) {
      if (this.x === this.tail[i].x && this.y === this.tail[i].y) {
        gameOver();
      }
    }
  };

  this.isOnBody = function (x, y) {
    if (this.x === x && this.y === y) return true;
    for (let i = 0; i < this.tail.length; i++) {
      if (this.tail[i].x === x && this.tail[i].y === y) return true;
    }
    return false;
  };
}

function Fruit() {
  this.x;
  this.y;

  this.pickLocation = function () {
    let newX, newY;
    do {
      newX = Math.floor(Math.random() * rows) * scale;
      newY = Math.floor(Math.random() * columns) * scale;
    } while (snake.isOnBody(newX, newY)); // Pastikan makanan tidak muncul di dalam tubuh ular
    this.x = newX;
    this.y = newY;
  };

  this.draw = function () {
    ctx.drawImage(fruitImage, this.x, this.y, scale, scale);
  };
}

function gameOver() {
  isGameOver = true;
  finalScoreElement.textContent = score;
  gameOverElement.style.display = "block";
}

function continueGame() {
  isGameOver = false;
  snake = new Snake();
  fruit.pickLocation();
  gameOverElement.style.display = "none";
  score = 0;
  scoreElement.textContent = score;
}

function togglePause() {
  isPaused = !isPaused;
  pauseMenuElement.style.display = isPaused ? "block" : "none";
}

function exitGame() {
  pauseMenuElement.style.display = "none";
  window.location.href = "index.html";
}

function restartGame() {
  isGameOver = false;
  isPaused = false;
  snake = new Snake();
  fruit.pickLocation();
  score = 0;
  scoreElement.textContent = score;
  pauseMenuElement.style.display = "none";
  gameOverElement.style.display = "none";
}

window.addEventListener("keydown", (event) => {
  const direction = event.key.replace("Arrow", "");
  snake.changeDirection(direction);
  if (event.code === "Space") {
    togglePause();
  }
});

const continueButton = document.getElementById("continueButton");
const gameOverElement = document.getElementById("gameOver");
const pauseMenuElement = document.getElementById("pauseMenu");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");
const exitButton = document.getElementById("exitButton");
const keluarButton = document.getElementById("keluarButton");

continueButton.addEventListener("click", () => {
  continueGame();
});

resumeButton.addEventListener("click", () => {
  togglePause();
});

restartButton.addEventListener("click", () => {
  restartGame();
});

exitButton.addEventListener("click", () => {
  exitGame();
});
keluarButton.addEventListener("click", () => {
  exitGame();
});
