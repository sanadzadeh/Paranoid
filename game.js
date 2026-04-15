const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hud = {
  score: document.getElementById("score"),
  lives: document.getElementById("lives"),
  level: document.getElementById("level"),
  state: document.getElementById("state")
};

const overlay = {
  root: document.getElementById("overlay"),
  title: document.getElementById("overlayTitle"),
  text: document.getElementById("overlayText"),
  button: document.getElementById("overlayButton")
};

const config = {
  width: canvas.width,
  height: canvas.height,
  maxLives: 3,
  paddleWidth: 130,
  paddleHeight: 16,
  paddleSpeed: 560,
  ballRadius: 9,
  brick: {
    width: 78,
    height: 24,
    gap: 7,
    topOffset: 75,
    leftOffset: 60
  }
};

const state = {
  score: 0,
  lives: config.maxLives,
  level: 1,
  gameState: "start", // start | running | paused | won | lost
  ballLaunched: false,
  keyLeft: false,
  keyRight: false,
  paddle: {
    x: config.width / 2 - config.paddleWidth / 2,
    y: config.height - 46,
    width: config.paddleWidth,
    height: config.paddleHeight,
    speed: config.paddleSpeed
  },
  ball: {
    x: config.width / 2,
    y: config.height - 58,
    vx: 250,
    vy: -250,
    radius: config.ballRadius,
    speedScale: 1
  },
  bricks: [],
  particles: [],
  particleTimer: 0,
  lifeLock: false
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateHud() {
  hud.score.textContent = state.score;
  hud.lives.textContent = state.lives;
  hud.level.textContent = state.level;

  const labelMap = {
    start: "Ready",
    running: state.ballLaunched ? "Playing" : "Aim",
    paused: "Paused",
    won: "Victory",
    lost: "Game Over"
  };

  hud.state.textContent = labelMap[state.gameState] || "Ready";
}

function setOverlay(title, text, buttonLabel) {
  overlay.title.textContent = title;
  overlay.text.innerHTML = text;
  overlay.button.textContent = buttonLabel;
  overlay.root.classList.add("show");
}

function hideOverlay() {
  overlay.root.classList.remove("show");
}

function levelSettings(level) {
  const rows = Math.min(4 + level, 9);
  const cols = 10;
  const health = Math.min(1 + Math.floor((level - 1) / 2), 3);
  const speedBoost = 1 + (level - 1) * 0.12;
  return { rows, cols, health, speedBoost };
}

function createBricks() {
  const { rows, cols, health } = levelSettings(state.level);
  state.bricks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = config.brick.leftOffset + col * (config.brick.width + config.brick.gap);
      const y = config.brick.topOffset + row * (config.brick.height + config.brick.gap);
      state.bricks.push({
        x,
        y,
        w: config.brick.width,
        h: config.brick.height,
        hp: health + (row % 2 === 0 ? 0 : 1),
        maxHp: health + (row % 2 === 0 ? 0 : 1),
        alive: true
      });
    }
  }
}

function resetBallAndPaddle() {
  state.paddle.x = config.width / 2 - state.paddle.width / 2;
  state.ball.x = state.paddle.x + state.paddle.width / 2;
  state.ball.y = state.paddle.y - state.ball.radius - 2;

  const spread = (Math.random() * 0.9 + 0.55) * (Math.random() > 0.5 ? 1 : -1);
  const { speedBoost } = levelSettings(state.level);
  state.ball.vx = 230 * spread * speedBoost;
  state.ball.vy = -260 * speedBoost;
  state.ball.speedScale = speedBoost;
  state.ballLaunched = false;
}

function resetGame() {
  state.score = 0;
  state.lives = config.maxLives;
  state.level = 1;
  state.gameState = "running";
  state.lifeLock = false;
  createBricks();
  resetBallAndPaddle();
  hideOverlay();
  updateHud();
}

function pauseToggle() {
  if (state.gameState === "running") {
    state.gameState = "paused";
  } else if (state.gameState === "paused") {
    state.gameState = "running";
  }
  updateHud();
}

function handleWallCollisions() {
  if (state.ball.x - state.ball.radius <= 0) {
    state.ball.x = state.ball.radius;
    state.ball.vx = Math.abs(state.ball.vx);
  }

  if (state.ball.x + state.ball.radius >= config.width) {
    state.ball.x = config.width - state.ball.radius;
    state.ball.vx = -Math.abs(state.ball.vx);
  }

  if (state.ball.y - state.ball.radius <= 0) {
    state.ball.y = state.ball.radius;
    state.ball.vy = Math.abs(state.ball.vy);
  }

  if (state.ball.y - state.ball.radius > config.height && !state.lifeLock) {
    state.lifeLock = true;
    state.lives -= 1;
    updateHud();

    if (state.lives <= 0) {
      state.gameState = "lost";
      setOverlay(
        "GAME OVER",
        `Final score: <strong>${state.score}</strong><br />Press SPACE to restart.`,
        "Restart"
      );
    } else {
      resetBallAndPaddle();
      state.lifeLock = false;
    }
  }
}

function ballHitsRect(ball, rect) {
  const closestX = clamp(ball.x, rect.x, rect.x + rect.w);
  const closestY = clamp(ball.y, rect.y, rect.y + rect.h);
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function handlePaddleCollision() {
  const paddleRect = {
    x: state.paddle.x,
    y: state.paddle.y,
    w: state.paddle.width,
    h: state.paddle.height
  };

  if (!ballHitsRect(state.ball, paddleRect) || state.ball.vy <= 0) {
    return;
  }

  const impact = (state.ball.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
  const maxHorizontal = 440 * state.ball.speedScale;

  state.ball.vx = clamp(impact * maxHorizontal, -maxHorizontal, maxHorizontal);
  state.ball.vy = -Math.abs(state.ball.vy);
  state.ball.y = state.paddle.y - state.ball.radius - 1;
}

function spawnHitParticles(x, y, color) {
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 140;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.42 + Math.random() * 0.35,
      age: 0,
      size: 1.5 + Math.random() * 2,
      color
    });
  }
}

function handleBrickCollisions() {
  for (const brick of state.bricks) {
    if (!brick.alive || !ballHitsRect(state.ball, brick)) {
      continue;
    }

    const overlapLeft = state.ball.x + state.ball.radius - brick.x;
    const overlapRight = brick.x + brick.w - (state.ball.x - state.ball.radius);
    const overlapTop = state.ball.y + state.ball.radius - brick.y;
    const overlapBottom = brick.y + brick.h - (state.ball.y - state.ball.radius);
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft) {
      state.ball.vx = -Math.abs(state.ball.vx);
    } else if (minOverlap === overlapRight) {
      state.ball.vx = Math.abs(state.ball.vx);
    } else if (minOverlap === overlapTop) {
      state.ball.vy = -Math.abs(state.ball.vy);
    } else {
      state.ball.vy = Math.abs(state.ball.vy);
    }

    brick.hp -= 1;
    if (brick.hp <= 0) {
      brick.alive = false;
      state.score += 100 * state.level;
      spawnHitParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, "#88f8ff");
    } else {
      state.score += 30 * state.level;
      spawnHitParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, "#ffcc77");
    }

    updateHud();
    break;
  }

  const aliveCount = state.bricks.filter((brick) => brick.alive).length;
  if (aliveCount === 0 && state.gameState === "running") {
    if (state.level >= 5) {
      state.gameState = "won";
      setOverlay(
        "YOU WIN",
        `You cleared all levels with <strong>${state.score}</strong> points.<br />Press SPACE to play again.`,
        "Play Again"
      );
      updateHud();
      return;
    }

    state.level += 1;
    createBricks();
    resetBallAndPaddle();
    updateHud();
  }
}

function updateParticles(dt) {
  state.particleTimer += dt;
  if (state.particleTimer > 0.08) {
    state.particleTimer = 0;
    state.particles.push({
      x: Math.random() * config.width,
      y: config.height + 8,
      vx: 0,
      vy: -14 - Math.random() * 28,
      life: 2.2,
      age: 0,
      size: 1 + Math.random() * 1.6,
      color: "rgba(130, 220, 255, 0.45)"
    });
  }

  state.particles = state.particles.filter((particle) => {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    return particle.age < particle.life;
  });
}

function update(dt) {
  if (state.gameState !== "running") {
    updateParticles(dt);
    return;
  }

  const direction = Number(state.keyRight) - Number(state.keyLeft);
  state.paddle.x += direction * state.paddle.speed * dt;
  state.paddle.x = clamp(state.paddle.x, 0, config.width - state.paddle.width);

  if (!state.ballLaunched) {
    state.ball.x = state.paddle.x + state.paddle.width / 2;
    state.ball.y = state.paddle.y - state.ball.radius - 2;
  } else {
    state.ball.x += state.ball.vx * dt;
    state.ball.y += state.ball.vy * dt;

    handleWallCollisions();
    if (state.gameState === "running") {
      handlePaddleCollision();
      handleBrickCollisions();
    }
  }

  updateParticles(dt);
}

function drawBricks() {
  const shimmerTime = performance.now() * 0.0035;
  for (const brick of state.bricks) {
    if (!brick.alive) continue;

    const ratio = brick.hp / brick.maxHp;
    const shimmer = (Math.sin(shimmerTime + brick.x * 0.018 + brick.y * 0.025) + 1) / 2;
    const glow = 14 + ratio * 14 + shimmer * 2;
    const brickGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
    brickGradient.addColorStop(0, `hsla(190, 100%, ${70 + shimmer * 7}%, 0.99)`);
    brickGradient.addColorStop(0.52, `hsla(206, 92%, ${56 + ratio * 8}%, 0.98)`);
    brickGradient.addColorStop(1, `hsla(224, 84%, ${38 + ratio * 6}%, 0.99)`);

    ctx.shadowBlur = glow;
    ctx.shadowColor = `hsla(198, 100%, ${66 + shimmer * 6}%, ${0.6 + ratio * 0.22})`;
    ctx.fillStyle = brickGradient;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 6);
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;

    const sheenGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
    sheenGradient.addColorStop(0, `rgba(241, 253, 255, ${0.4 + shimmer * 0.2})`);
    sheenGradient.addColorStop(0.42, "rgba(220, 247, 255, 0.08)");
    sheenGradient.addColorStop(1, "rgba(220, 247, 255, 0)");
    ctx.fillStyle = sheenGradient;
    ctx.beginPath();
    ctx.roundRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h * 0.6, 5);
    ctx.fill();
    ctx.closePath();

    const edgeGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brick.w, brick.y + brick.h);
    edgeGradient.addColorStop(0, "rgba(227, 251, 255, 0.95)");
    edgeGradient.addColorStop(0.6, "rgba(173, 233, 255, 0.5)");
    edgeGradient.addColorStop(1, "rgba(122, 199, 255, 0.78)");
    ctx.strokeStyle = edgeGradient;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(brick.x + 0.5, brick.y + 0.5, brick.w - 1, brick.h - 1, 6);
    ctx.stroke();
    ctx.closePath();

    if (brick.hp > 1) {
      ctx.fillStyle = "rgba(4, 12, 33, 0.78)";
      ctx.font = "bold 12px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(String(brick.hp), brick.x + brick.w / 2, brick.y + brick.h / 2 + 4);
    }
  }
}

function drawPaddle() {
  const gradient = ctx.createLinearGradient(
    state.paddle.x,
    state.paddle.y,
    state.paddle.x,
    state.paddle.y + state.paddle.height
  );
  gradient.addColorStop(0, "#9ef7ff");
  gradient.addColorStop(1, "#2977ff");

  ctx.fillStyle = gradient;
  ctx.shadowBlur = 14;
  ctx.shadowColor = "rgba(90, 212, 255, 0.72)";
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
  ctx.shadowBlur = 0;
}

function drawBall() {
  const radial = ctx.createRadialGradient(
    state.ball.x - 2,
    state.ball.y - 2,
    2,
    state.ball.x,
    state.ball.y,
    state.ball.radius
  );
  radial.addColorStop(0, "#ffffff");
  radial.addColorStop(0.55, "#84f7ff");
  radial.addColorStop(1, "#4d5dff");

  ctx.beginPath();
  ctx.fillStyle = radial;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(121, 202, 255, 0.8)";
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = 1 - particle.age / particle.life;
    ctx.globalAlpha = Math.max(alpha, 0);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
  ctx.globalAlpha = 1;
}

function drawCenterMessage() {
  if (state.gameState !== "paused") {
    return;
  }

  ctx.fillStyle = "rgba(9, 15, 35, 0.55)";
  ctx.fillRect(0, 0, config.width, config.height);
  ctx.fillStyle = "#e8f6ff";
  ctx.textAlign = "center";
  ctx.font = "bold 42px Trebuchet MS";
  ctx.fillText("PAUSED", config.width / 2, config.height / 2);
  ctx.font = "18px Trebuchet MS";
  ctx.fillText("Press P to continue", config.width / 2, config.height / 2 + 34);
}

function draw() {
  ctx.clearRect(0, 0, config.width, config.height);

  drawBricks();
  drawPaddle();
  drawBall();
  drawParticles();
  drawCenterMessage();
}

function startOrRestart() {
  if (state.gameState === "start" || state.gameState === "lost" || state.gameState === "won") {
    resetGame();
    return;
  }

  if (state.gameState === "running" && !state.ballLaunched) {
    state.ballLaunched = true;
    updateHud();
  }
}

function onKeyDown(event) {
  if (event.code === "ArrowLeft") {
    state.keyLeft = true;
  }

  if (event.code === "ArrowRight") {
    state.keyRight = true;
  }

  if (event.code === "Space") {
    event.preventDefault();
    startOrRestart();
  }

  if (event.code === "KeyP") {
    pauseToggle();
  }
}

function onKeyUp(event) {
  if (event.code === "ArrowLeft") state.keyLeft = false;
  if (event.code === "ArrowRight") state.keyRight = false;
}

function setupEvents() {
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  overlay.button.addEventListener("click", () => {
    startOrRestart();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.gameState === "running") {
      state.gameState = "paused";
      updateHud();
    }
  });
}

function init() {
  createBricks();
  resetBallAndPaddle();
  updateHud();
  setOverlay(
    "PARANOID",
    "Break every brick across 5 levels.<br />Use Left and Right Arrow keys. Press SPACE to launch.",
    "Start"
  );
  setupEvents();
}

let previous = performance.now();
function loop(now) {
  const dt = Math.min((now - previous) / 1000, 0.033);
  previous = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

init();
requestAnimationFrame(loop);
