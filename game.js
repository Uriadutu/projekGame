const canvas = document.getElementById("gameCanvas");
canvas.width = 800; // Lebih besar
canvas.height = 600; // Lebih besar
const ctx = canvas.getContext("2d");

const scale = 40; // Ukuran karakter lebih besar
const gravity = 0.5;
const speed = 2;
let score = 0;
let isGameOver = false;
let isPaused = false;

const scoreElement = document.getElementById("score");
const finalScoreElement = document.getElementById("finalScore");
const gameOverElement = document.getElementById("gameOver");
const pausePopup = document.getElementById("pausePopup");
const retryButton = document.getElementById("retryButton");
const keluarButton = document.getElementById("keluarButton");
const exitButton = document.getElementById("exitButton");
const resumeButton = document.getElementById("resumeButton");


// Memuat gambar-gambar
const charImage = new Image();
charImage.src = "./aset/game2/char.png";
const platImage = new Image();
platImage.src = "./aset/game2/plat.png";
const duriImage = new Image();
duriImage.src = "./aset/game2/duri.png";
const scoreImage = new Image();
scoreImage.src = "./aset/game2/score.png";

const character = {
  x: canvas.width / 2 - scale / 2,
  y: canvas.height - scale,
  width: scale,
  height: scale,
  xSpeed: 0,
  ySpeed: 0,
  isOnPlatform: false,
};

const platforms = [];
const spikes = [];
const scores = [];

function setup() {
  document.addEventListener("keydown", moveCharacter);
  document.addEventListener("keyup", stopCharacter);
  retryButton.addEventListener("click", resetGame);
  keluarButton.addEventListener("click", exitGame);
  exitButton.addEventListener("click", exitGame);
  window.addEventListener("keydown", togglePause);
  generatePlatforms();
  placeCharacterOnPlatform();
  displayHighScore();
  requestAnimationFrame(gameLoop);
  resumeButton.addEventListener("click", () => {
  isPaused = !isPaused;
  if (isPaused) {
    pausePopup.style.display = "block";
  } else {
    pausePopup.style.display = "none";
    if (!isGameOver) {
      requestAnimationFrame(gameLoop);
    }
  }
});
}

function exitGame() {
  window.location.href = "index.html";
}


function gameLoop() {
  if (!isGameOver && !isPaused) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
    displayHighScore();
  }
}

function update() {
  // Efek gravitasi
  character.ySpeed += gravity;
  character.y += character.ySpeed;
  character.x += character.xSpeed;

  // Mencegah karakter keluar dari canvas
  if (
    character.x < 0 ||
    character.x + character.width > canvas.width ||
    character.y < 0
  ) {
    gameOver();
  }

  // Gerakan platform
  for (let plat of platforms) {
    plat.y -= speed;
    if (plat.y + plat.height < 0) {
      platforms.splice(platforms.indexOf(plat), 1);
      generateSinglePlatform(); // Membuat platform baru setelah yang lama hilang
    }
  }

  // Gerakan duri
  for (let spike of spikes) {
    spike.y -= speed;
    if (spike.y + spike.height < 0) {
      spikes.splice(spikes.indexOf(spike), 1);
    }
  }

  // Gerakan skor
  for (let scoreItem of scores) {
    scoreItem.y -= speed;
    if (scoreItem.y + scoreItem.height < 0) {
      scores.splice(scores.indexOf(scoreItem), 1);
    }
  }

  // Memeriksa tabrakan
  checkCollisions();

  updateHighScore();
}


function updateHighScore() {
  const highScore = localStorage.getItem("highScore") || 0;
  if (score > highScore) {
    localStorage.setItem("highScore", score);
    displayHighScore(); // Perbarui tampilan high score
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    charImage,
    character.x,
    character.y,
    character.width,
    character.height
  );

  for (let plat of platforms) {
    ctx.drawImage(platImage, plat.x, plat.y, plat.width, plat.height);
  }

  for (let spike of spikes) {
    ctx.drawImage(duriImage, spike.x, spike.y, spike.width, spike.height);
  }

  for (let scoreItem of scores) {
    ctx.drawImage(
      scoreImage,
      scoreItem.x,
      scoreItem.y,
      scoreItem.width,
      scoreItem.height
    );
  }
}

function moveCharacter(event) {
  switch (event.key) {
    case "ArrowLeft":
      character.xSpeed = -7; // Menambah kecepatan ke kiri
      break;
    case "ArrowRight":
      character.xSpeed = 7; // Menambah kecepatan ke kanan
      break;
  }
}

function stopCharacter(event) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    character.xSpeed = 0;
  }
}

function generatePlatforms() {
  const numPlatforms = Math.floor(Math.random() * 5) + 5;
  const platformWidth = 80;
  const verticalSpacing = 120;

  for (let i = 0; i < numPlatforms; i++) {
    generateSinglePlatform(i * verticalSpacing);
  }
}

function generateSinglePlatform(yOffset = 0) {
  const platformWidth = 80;
  const plat = {
    x: Math.random() * (canvas.width - platformWidth),
    y: canvas.height + yOffset,
    width: platformWidth,
    height: 25,
  };
  platforms.push(plat);

  // Secara acak membuat item skor pada beberapa platform
  if (Math.random() < 0.5) {
    const scoreItem = {
      x: plat.x + Math.random() * (plat.width - 20),
      y: plat.y - 30,
      width: 20,
      height: 20,
    };
    scores.push(scoreItem);
  }

  // Membuat duri baru dengan probabilitas yang lebih rendah
  if (Math.random() < 0.3) {
    // Probabilitas kemunculan duri
    generateSingleSpike(plat.y);
  }
}

function generateSingleSpike(yPos) {
  const platformWidth = 80;
  let spikePlat;
  let overlap;

  do {
    overlap = false;
    spikePlat = {
      x: Math.random() * (canvas.width - platformWidth),
      y: yPos,
      width: platformWidth,
      height: 40,
      isSpike: true,
    };

    for (let platCheck of platforms) {
      if (
        spikePlat.x < platCheck.x + platCheck.width &&
        spikePlat.x + spikePlat.width > platCheck.x &&
        spikePlat.y < platCheck.y + platCheck.height &&
        spikePlat.y + spikePlat.height > platCheck.y
      ) {
        overlap = true;
        break;
      }
    }
  } while (overlap);

  // Menjaga jarak horizontal minimum antara duri dan platform
  if (
    Math.abs(spikePlat.x - platforms[platforms.length - 1].x) > platformWidth
  ) {
    spikes.push(spikePlat);
  }
}

function placeCharacterOnPlatform() {
  const initialPlatform = platforms[0];
  character.x =
    initialPlatform.x + initialPlatform.width / 2 - character.width / 2;
  character.y = initialPlatform.y - character.height;
  character.xSpeed = 0;
  character.ySpeed = 0;
}

function checkCollisions() {
  character.isOnPlatform = false;

  for (let plat of platforms) {
    if (
      character.x < plat.x + plat.width &&
      character.x + character.width > plat.x &&
      character.y + character.height > plat.y &&
      character.y + character.height < plat.y + plat.height + character.ySpeed
    ) {
      character.ySpeed = 0;
      character.y = plat.y - character.height;
      character.isOnPlatform = true;
      if (!plat.isTouched) {
        plat.isTouched = true; // tandai platform telah disentuh
        score += 1; // tambahkan 1 ke skor
        scoreElement.textContent = score; // perbarui tampilan skor
      }
    } else {
      plat.isTouched = false; // platform tidak disentuh
    }
  }

  for (let spike of spikes) {
    if (
      character.x < spike.x + spike.width &&
      character.x + character.width > spike.x &&
      character.y < spike.y + spike.height &&
      character.y + character.height > spike.y
    ) {
      gameOver();
    }
  }

  for (let scoreItem of scores) {
    if (
      character.x < scoreItem.x + scoreItem.width &&
      character.x + character.width > scoreItem.x &&
      character.y < scoreItem.y + scoreItem.height &&
      character.y + character.height > scoreItem.y
    ) {
      score += 10;
      scoreElement.textContent = score;
      scores.splice(scores.indexOf(scoreItem), 1);
    }
  }

  if (character.y + character.height > canvas.height) {
    gameOver();
  }
}

function displayHighScore() {
  const highScore = localStorage.getItem("highScore") || 0;
  document.getElementById("highScore").textContent = highScore;
}

function gameOver() {
  isGameOver = true;
  finalScoreElement.textContent = score;
  const highScore = localStorage.getItem("highScore") || 0;
  if (score > highScore) {
    localStorage.setItem("highScore", score);
    displayHighScore(); // Update tampilan high score
  }
  gameOverElement.style.display = "block";
}

function resetGame() {
  isGameOver = false;
  score = 0;
  scoreElement.textContent = score;
  platforms.length = 0;
  spikes.length = 0;
  scores.length = 0;
  gameOverElement.style.display = "none";
  generatePlatforms();
  displayHighScore();
  placeCharacterOnPlatform();
  requestAnimationFrame(gameLoop);
}

function togglePause(event) {
  if (event.code === "Space") {
    isPaused = !isPaused;
    if (isPaused) {
      pausePopup.style.display = "block";
    } else {
      pausePopup.style.display = "none";
      if (!isGameOver) {
        requestAnimationFrame(gameLoop);
      }
    }
  }
}

setup();

continueButton.addEventListener("click", () => {
  togglePause();
});




exitButton.addEventListener("click", () => {
  window.location.href = "index.html";
});

keluarButton.addEventListener("click", () => {
  window.location.href = "index.html";
});
