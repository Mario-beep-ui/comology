import { globalState } from './state.js';
import { ALLIES_DB } from './characters.js';
import { isPlayerMovementPaused } from './ui.js';
import { inputState } from './input.js';

const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1200;
const GROUND_TILE = 128;

const PLAYER_DRAW_W = 56;
const PLAYER_DRAW_H = 76;
const ALLY_DRAW_W = 48;
const ALLY_DRAW_H = 64;

const PLAYER_SPEED = 3.2;
const ALLY_FOLLOW_DISTANCE = 44;
const ALLY_FOLLOW_SPEED = 2.6;

const PLAYER_SPRITE_FILES = {
  front: './personajes/Morfeo.png',
  back: './personajes/Morfeo_espaldas.png',
  side: './personajes/Morfeo_perfil.png',
  frontDiag: './personajes/Morfeo_frente_diagional.png'
};
const MORFEO_FALLBACK = './personajes/Morfeo.png';

const GROUND_FILE = './escenarios/pisoBosque.jpg';
const TREE_FILES = [1, 2, 3, 4, 5, 6].map(i => `./escenarios/arboles/arbol_${i}.png`);
const GRASS_FILES = [1, 2, 3, 4].map(i => `./escenarios/pasto/pasto_${i}.png`);

const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: 32,
  height: 48,
  sprite: null,
  sprites: null,
  fallbackSprite: null,
  moving: false,
  direction: 'down',
  facing: 'front',
  flipX: false,
  walkTime: 0,
  frame: 0,
  frameTimer: 0
};

const activeAlly = {
  x: WORLD_WIDTH / 2 - 44,
  y: WORLD_HEIGHT / 2,
  width: 32,
  height: 48,
  sprite: null,
  frame: 0,
  frameTimer: 0
};

const camera = { x: 0, y: 0 };

const particles = [];

let canvas = null;
let ctx = null;
let animationFrameId = null;
let lastTime = 0;

let groundImg = null;
const treeImgs = [];
const grassImgs = [];

let trees = [];
let grasses = [];
let treeBases = [];

const sectionConfigs = {
  bosque: {
    enemyCount: 3,
    enemyBaseHp: 30,
    enemyBaseAttack: 5,
    enemyColor: '#228822'
  }
};

const enemies = [];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadAssets() {
  groundImg = new Image();
  groundImg.src = GROUND_FILE;

  for (let i = 0; i < TREE_FILES.length; i++) {
    const img = new Image();
    img.src = TREE_FILES[i];
    treeImgs[i] = img;
  }

  for (let i = 0; i < GRASS_FILES.length; i++) {
    const img = new Image();
    img.src = GRASS_FILES[i];
    grassImgs[i] = img;
  }
}

function loadSprites() {
  player.sprites = {};
  Object.entries(PLAYER_SPRITE_FILES).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    player.sprites[key] = img;
  });

  player.fallbackSprite = new Image();
  player.fallbackSprite.src = MORFEO_FALLBACK;
  player.sprite = player.fallbackSprite;

  if (globalState.activeAlly && ALLIES_DB[globalState.activeAlly]) {
    activeAlly.sprite = new Image();
    activeAlly.sprite.src = ALLIES_DB[globalState.activeAlly].sprite;
  }
}

function getPlayerSprite() {
  const facing = player.facing || 'front';
  const directional = player.sprites && player.sprites[facing];
  if (directional && directional.complete && directional.naturalWidth > 0) {
    return directional;
  }
  const fallback = player.fallbackSprite;
  if (fallback && fallback.complete && fallback.naturalWidth > 0) {
    return fallback;
  }
  return null;
}

function addTree(x, y, rand) {
  const imgIndex = Math.floor(rand() * TREE_FILES.length);
  const height = 120 + rand() * 90;
  trees.push({ x, y, img: imgIndex, h: height });
  treeBases.push({ x: x - 18, y: y - 22, w: 36, h: 22 });
}

function generateWorld() {
  const rand = mulberry32(20261123);
  trees = [];
  grasses = [];
  treeBases = [];

  const cx = WORLD_WIDTH / 2;
  const cy = WORLD_HEIGHT / 2;

  const clusters = [];
  for (let i = 0; i < 18; i++) {
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      x = 140 + rand() * (WORLD_WIDTH - 280);
      y = 140 + rand() * (WORLD_HEIGHT - 280);
      tries++;
    } while (Math.hypot(x - cx, y - cy) < 280 && tries < 30);
    clusters.push({ x, y });
  }

  let attempts = 0;
  while (trees.length < 64 && attempts < 6000) {
    attempts++;

    let px;
    let py;
    if (rand() < 0.62) {
      const cl = clusters[Math.floor(rand() * clusters.length)];
      px = cl.x + (rand() - 0.5) * 300;
      py = cl.y + (rand() - 0.5) * 240;
    } else {
      px = 100 + rand() * (WORLD_WIDTH - 200);
      py = 100 + rand() * (WORLD_HEIGHT - 200);
    }

    if (px < 80 || px > WORLD_WIDTH - 80 || py < 80 || py > WORLD_HEIGHT - 80) continue;
    if (Math.hypot(px - cx, py - cy) < 200) continue;

    let tooClose = false;
    for (const t of trees) {
      if (Math.hypot(t.x - px, t.y - py) < 72) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    addTree(px, py, rand);
  }

  for (let i = 0; i < 180; i++) {
    const gx = 40 + rand() * (WORLD_WIDTH - 80);
    const gy = 40 + rand() * (WORLD_HEIGHT - 80);
    const imgIndex = Math.floor(rand() * GRASS_FILES.length);
    const scale = 0.8 + rand() * 1.1;
    grasses.push({ x: gx, y: gy, img: imgIndex, scale });
  }
}

function generateEnemies() {
  enemies.length = 0;
  const config = sectionConfigs[globalState.currentSection] || sectionConfigs.bosque;
  const levelMult = 1 + (globalState.currentLevel - 1) * 0.3;

  for (let i = 0; i < config.enemyCount; i++) {
    const margin = 120;
    enemies.push({
      x: margin + Math.random() * (WORLD_WIDTH - margin * 2),
      y: margin + Math.random() * (WORLD_HEIGHT - margin * 2),
      width: 32,
      height: 32,
      hp: Math.floor(config.enemyBaseHp * levelMult),
      maxHp: Math.floor(config.enemyBaseHp * levelMult),
      attack: Math.floor(config.enemyBaseAttack * levelMult),
      color: config.enemyColor,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolRadius: 30 + Math.random() * 40,
      patrolCenterX: 0,
      patrolCenterY: 0,
      patrolSpeed: 0.5 + Math.random() * 0.5
    });
  }

  enemies.forEach(e => {
    e.patrolCenterX = e.x;
    e.patrolCenterY = e.y;
  });
}

function updateEnemies(dt) {
  enemies.forEach(enemy => {
    enemy.patrolAngle += enemy.patrolSpeed * dt;
    enemy.x = enemy.patrolCenterX + Math.cos(enemy.patrolAngle) * enemy.patrolRadius;
    enemy.y = enemy.patrolCenterY + Math.sin(enemy.patrolAngle) * enemy.patrolRadius;
  });
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkCollisions() {
  const playerRect = { x: player.x, y: player.y, w: player.width, h: player.height };

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const enemyRect = { x: enemy.x, y: enemy.y, w: enemy.width, h: enemy.height };
    if (rectsIntersect(playerRect, enemyRect)) {
      startBattle(enemy, i);
    }
  }
}

function startBattle(enemy, enemyIndex) {
  console.log('Combate iniciado con enemigo:', enemy);
  enemies.splice(enemyIndex, 1);
  window.dispatchEvent(new CustomEvent('world-battle-start', { detail: { enemy, enemyIndex } }));
}

function collides(x, y, w, h) {
  for (const b of treeBases) {
    if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) {
      return true;
    }
  }
  return false;
}

function updatePlayer(dt) {
  if (isPlayerMovementPaused()) return;

  let dx = 0;
  let dy = 0;

  if (inputState.up) dy = -1;
  if (inputState.down) dy = 1;
  if (inputState.left) dx = -1;
  if (inputState.right) dx = 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    const nx = dx / len;
    const ny = dy / len;

    const moveX = nx * PLAYER_SPEED;
    const moveY = ny * PLAYER_SPEED;

    const prevX = player.x;
    const prevY = player.y;

    player.x = clamp(player.x + moveX, 0, WORLD_WIDTH - player.width);
    if (collides(player.x, player.y, player.width, player.height)) {
      player.x = prevX;
    }

    player.y = clamp(player.y + moveY, 0, WORLD_HEIGHT - player.height);
    if (collides(player.x, player.y, player.width, player.height)) {
      player.y = prevY;
    }

    player.moving = true;
    player.walkTime += dt;
    player.flipX = nx < 0;

    if (ny > 0 && nx !== 0) {
      player.facing = 'frontDiag';
    } else if (ny > 0) {
      player.facing = 'front';
    } else if (ny < 0) {
      player.facing = 'back';
    } else {
      player.facing = 'side';
    }

    if (Math.abs(ny) >= Math.abs(nx)) {
      player.direction = ny > 0 ? 'down' : 'up';
    } else {
      player.direction = nx > 0 ? 'right' : 'left';
    }

    player.frameTimer += dt;
    if (player.frameTimer > 0.15) {
      player.frame = (player.frame + 1) % 4;
      player.frameTimer = 0;
    }
  } else {
    player.moving = false;
    player.frame = 0;
  }
}

function updateAlly(dt) {
  if (!globalState.activeAlly) return;

  const targetX = player.x - Math.cos(getDirectionAngle(player.direction)) * ALLY_FOLLOW_DISTANCE;
  const targetY = player.y - Math.sin(getDirectionAngle(player.direction)) * ALLY_FOLLOW_DISTANCE;

  const dx = targetX - activeAlly.x;
  const dy = targetY - activeAlly.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 5) {
    const moveX = (dx / dist) * ALLY_FOLLOW_SPEED;
    const moveY = (dy / dist) * ALLY_FOLLOW_SPEED;
    activeAlly.x = clamp(activeAlly.x + moveX, 0, WORLD_WIDTH - activeAlly.width);
    activeAlly.y = clamp(activeAlly.y + moveY, 0, WORLD_HEIGHT - activeAlly.height);
    activeAlly.frameTimer += dt;
    if (activeAlly.frameTimer > 0.2) {
      activeAlly.frame = (activeAlly.frame + 1) % 4;
      activeAlly.frameTimer = 0;
    }
  }
}

function getDirectionAngle(dir) {
  switch (dir) {
    case 'up': return -Math.PI / 2;
    case 'down': return Math.PI / 2;
    case 'left': return Math.PI;
    case 'right': return 0;
    default: return Math.PI / 2;
  }
}

function updateCamera() {
  const viewW = canvas.width;
  const viewH = canvas.height;

  let cx = player.x + player.width / 2 - viewW / 2;
  let cy = player.y + player.height / 2 - viewH / 2;

  const maxX = WORLD_WIDTH - viewW;
  const maxY = WORLD_HEIGHT - viewH;

  if (maxX < 0) {
    cx = maxX / 2;
  } else {
    cx = clamp(cx, 0, maxX);
  }

  if (maxY < 0) {
    cy = maxY / 2;
  } else {
    cy = clamp(cy, 0, maxY);
  }

  camera.x = cx;
  camera.y = cy;
}

function inView(x, y, w, h, margin = 64) {
  return (
    x + w > camera.x - margin &&
    x < camera.x + canvas.width + margin &&
    y + h > camera.y - margin &&
    y < camera.y + canvas.height + margin
  );
}

function drawGround() {
  if (!(groundImg && groundImg.complete && groundImg.naturalWidth > 0)) return;

  const c0 = Math.floor(camera.x / GROUND_TILE) - 1;
  const c1 = Math.ceil((camera.x + canvas.width) / GROUND_TILE) + 1;
  const r0 = Math.floor(camera.y / GROUND_TILE) - 1;
  const r1 = Math.ceil((camera.y + canvas.height) / GROUND_TILE) + 1;

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      ctx.drawImage(groundImg, c * GROUND_TILE, r * GROUND_TILE, GROUND_TILE, GROUND_TILE);
    }
  }
}

function drawGrass(g) {
  const img = grassImgs[g.img];
  if (!(img && img.complete && img.naturalWidth > 0)) return;

  const w = img.naturalWidth * g.scale;
  const h = img.naturalHeight * g.scale;
  const dx = g.x - w / 2;
  const dy = g.y - h;

  if (!inView(dx, dy, w, h, 32)) return;
  ctx.drawImage(img, dx, dy, w, h);
}

function drawTree(t) {
  const img = treeImgs[t.img];
  const drawH = t.h;
  let drawW;

  if (img && img.complete && img.naturalWidth > 0) {
    drawW = drawH * (img.naturalWidth / img.naturalHeight);
  } else {
    drawW = drawH * 0.7;
  }

  const dx = t.x - drawW / 2;
  const dy = t.y - drawH;

  if (!inView(dx, dy, drawW, drawH, 32)) return;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, dx, dy, drawW, drawH);
  } else {
    ctx.fillStyle = '#3a2a12';
    ctx.fillRect(t.x - 6, t.y - 40, 12, 40);
  }
}

function drawEnemy(e) {
  if (!inView(e.x, e.y, e.width, e.height, 16)) return;

  ctx.fillStyle = e.color;
  ctx.fillRect(e.x, e.y, e.width, e.height);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(e.x, e.y - 8, e.width, 5);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(e.x, e.y - 8, e.width * (e.hp / e.maxHp), 5);
}

function drawSpriteImage(x, y, w, h, img, flip) {
  if (flip) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
}

function drawActor(actor, drawW, drawH, img, flip) {
  const dx = actor.x + actor.width / 2 - drawW / 2;
  const dy = actor.y + actor.height - drawH;

  if (!img) {
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(actor.x, actor.y, actor.width, actor.height);
    return { x: dx, y: dy };
  }

  drawSpriteImage(dx, dy, drawW, drawH, img, flip);
  return { x: dx, y: dy };
}

function drawPlayer(p) {
  const img = getPlayerSprite();
  const walkTime = p.walkTime || 0;
  const bounce = p.moving ? Math.abs(Math.sin(walkTime)) * 5 : 0;
  const tilt = p.moving ? Math.sin(walkTime) * 0.08 : 0;

  const targetHeight = 76;
  const sprite = img;
  const aspectRatio = (sprite && sprite.naturalWidth && sprite.naturalHeight) ? (sprite.naturalWidth / sprite.naturalHeight) : 0.7;
  const drawWidth = targetHeight * aspectRatio;
  const drawH = targetHeight;

  const cx = p.x + p.width / 2;
  const cy = p.y + p.height;

  const dx = cx - drawWidth / 2;
  const dy = cy - drawH - bounce;

  const footX = cx;
  const footY = cy;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(footX, footY, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(dx + drawWidth / 2, dy + drawH / 2);
  ctx.rotate(tilt);

  if (sprite) {
    drawSpriteImage(-drawWidth / 2, -drawH / 2, drawWidth, drawH, sprite, p.flipX);
  } else {
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-drawWidth / 2, -drawH / 2, drawWidth, drawH);
  }

  ctx.restore();

  if (p.moving) {
    particles.push({
      x: footX + (p.flipX ? -8 : 8) + (Math.random() - 0.5) * 6,
      y: footY + 2,
      vx: (Math.random() - 0.5) * 1,
      vy: -0.7 - Math.random() * 0.6,
      life: 1,
      size: 2 + Math.random() * 3
    });
    if (particles.length > 25) particles.shift();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const d = particles[i];
    d.x += d.vx;
    d.y += d.vy;
    d.life -= 0.06;
    if (d.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `rgba(150,130,100,${d.life})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, Math.max(0.1, d.size * d.life), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#00ff00';
  ctx.font = '11px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(globalState.player.name, cx, dy - 6);
}

function drawAlly(a) {
  if (!(a.sprite && a.sprite.complete && a.sprite.naturalWidth > 0)) {
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(a.x, a.y, a.width, a.height);
    return;
  }
  drawActor(a, ALLY_DRAW_W, ALLY_DRAW_H, a.sprite, false);
}

function drawHUD() {
  const boxW = 360;
  const boxH = 92;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 10, boxW, boxH);
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, boxW, boxH);

  ctx.fillStyle = '#00ffff';
  ctx.font = '12px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText(`${globalState.player.name} Lv.${globalState.player.level}`, 20, 30);
  ctx.fillText(`PS: ${globalState.player.hp}/${globalState.player.maxHp}`, 20, 48);

  const zoneName = globalState.currentZone || 'Bosque (Afueras de Tyni City)';
  ctx.fillText(`Zona: ${zoneName} | Nivel ${globalState.currentLevel}`, 20, 66);

  if (globalState.activeAlly) {
    const allyData = globalState.unlockedAllies[globalState.activeAlly];
    if (allyData) {
      ctx.fillStyle = '#00aaff';
      ctx.fillText(`${allyData.name} Lv.${allyData.level}`, 20, 84);
    }
  }
}

function render() {
  const viewW = canvas.width;
  const viewH = canvas.height;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0d1b0d';
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

  drawGround();

  for (const g of grasses) drawGrass(g);

  const renderables = [];
  for (const t of trees) renderables.push({ y: t.y, kind: 0, ref: t });
  for (const e of enemies) renderables.push({ y: e.y + e.height, kind: 1, ref: e });
  if (globalState.activeAlly && activeAlly.sprite) {
    renderables.push({ y: activeAlly.y + activeAlly.height, kind: 2, ref: activeAlly });
  }
  renderables.push({ y: player.y + player.height, kind: 3, ref: player });

  renderables.sort((a, b) => a.y - b.y);

  for (const item of renderables) {
    if (item.kind === 0) drawTree(item.ref);
    else if (item.kind === 1) drawEnemy(item.ref);
    else if (item.kind === 2) drawAlly(item.ref);
    else drawPlayer(item.ref);
  }

  ctx.restore();

  drawHUD();
}

function gameLoop(timestamp) {
  const dt = (lastTime === 0 || isNaN(lastTime)) ? 0.016 : Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  updatePlayer(dt);
  updateAlly(dt);
  updateEnemies(dt);
  checkCollisions();
  updateCamera();
  render();

  animationFrameId = requestAnimationFrame(gameLoop);
}

export function initWorld() {
  canvas = document.getElementById('world-canvas');
  if (!canvas) {
    console.error('Canvas #world-canvas no encontrado');
    return;
  }

  ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;

  const textBox = document.getElementById('text-box');
  if (textBox) textBox.style.display = 'none';

  loadAssets();
  loadSprites();
  generateWorld();
  generateEnemies();

  player.x = WORLD_WIDTH / 2;
  player.y = WORLD_HEIGHT / 2;
  activeAlly.x = player.x - 44;
  activeAlly.y = player.y;
  updateCamera();

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  lastTime = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);

  console.log('World mode initialized');
}

export function destroyWorld() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

export function refreshActiveAlly() {
  if (globalState.activeAlly && ALLIES_DB[globalState.activeAlly]) {
    activeAlly.sprite = new Image();
    activeAlly.sprite.src = ALLIES_DB[globalState.activeAlly].sprite;
  } else {
    activeAlly.sprite = null;
  }
}

window.addEventListener('ally-changed', () => {
  refreshActiveAlly();
});