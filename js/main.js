import { globalState } from './state.js';
import { ALLIES_DB, BOSSES_DB } from './characters.js';
import { openAllySelector, closeAllySelector } from './ui.js';
import { initWorld, destroyWorld, refreshActiveAlly } from './world.js';
import { initInput } from './input.js';

const musicBattle = new Audio('./sonidos/musica_combate.mp3');
musicBattle.loop = true;

const soundAttack = new Audio('./sonidos/ataque_combate.mp3');
const soundVictory = new Audio('./sonidos/victoria_combate.mp3');
const soundDefeat = new Audio('./sonidos/derrota_combate.mp3');
const soundTextAdvance = new Audio('./sonidos/avanzar_texto.mp3');

export { musicBattle, soundAttack, soundVictory, soundDefeat, soundTextAdvance };

function resizeCanvases() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  ['world-canvas', 'battle-canvas'].forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;
  });
}

window.addEventListener('resize', resizeCanvases);
window.addEventListener('load', resizeCanvases);

function hideAllScreens() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('world-screen').style.display = 'none';
  document.getElementById('battle-screen').style.display = 'none';
}

function stopAllMusic() {
  musicBattle.pause();
  musicBattle.currentTime = 0;
}

export function switchScene(sceneName, enemyId = null) {
  globalState.currentScene = sceneName;
  hideAllScreens();
  stopAllMusic();

  switch (sceneName) {
    case 'START':
      destroyWorld();
      document.getElementById('start-screen').style.display = 'flex';
      break;

    case 'WORLD':
      document.getElementById('world-screen').style.display = 'block';
      initWorld();
      break;

    case 'BATTLE':
      destroyWorld();
      document.getElementById('battle-screen').style.display = 'block';
      initializeBattleCanvas(enemyId);
      musicBattle.currentTime = 0;
      musicBattle.play().catch(() => {});
      break;

    default:
      console.warn(`Unknown scene: ${sceneName}`);
      switchScene('START');
  }
}

function initializeBattleCanvas(enemyId) {
  const canvas = document.getElementById('battle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bgImage = new Image();
  bgImage.src = './escenarios/fondo_batallajpeg.jpeg';
  bgImage.onload = () => {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  };

  const enemy = enemyId ? BOSSES_DB[enemyId] : null;
  if (enemy) {
    const enemyImg = new Image();
    enemyImg.src = enemy.sprite;
    enemyImg.onload = () => {
      const size = Math.min(canvas.width, canvas.height) * 0.28;
      const x = canvas.width * 0.62;
      const y = canvas.height * 0.5 - size / 2;
      ctx.drawImage(enemyImg, x, y, size, size);
    };
  }

  const playerImg = new Image();
  playerImg.src = globalState.player.sprite;
  playerImg.onload = () => {
    const size = Math.min(canvas.width, canvas.height) * 0.28;
    const x = canvas.width * 0.18;
    const y = canvas.height * 0.5 - size / 2;
    ctx.drawImage(playerImg, x, y, size, size);
  };
}

document.getElementById('start-button').addEventListener('click', () => {
  switchScene('WORLD');
});

window.addEventListener('world-battle-start', (e) => {
  const enemy = e.detail ? e.detail.enemy : null;
  const enemyId = enemy && enemy.id ? enemy.id : 'anthelios';
  switchScene('BATTLE', enemyId);
});

function createDebugButton() {
  const container = document.createElement('div');
  container.id = 'debug-controls';
  container.style.cssText = `
    position: fixed;
    top: 8px;
    right: 8px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
    pointer-events: none;
  `;

  const baseStyle = `
    pointer-events: auto;
    padding: 3px 7px;
    background: rgba(10, 10, 10, 0.7);
    font-family: 'Courier New', monospace;
    font-size: 10px;
    line-height: 1.2;
    cursor: pointer;
    border-radius: 3px;
    backdrop-filter: blur(2px);
  `;

  const battleBtn = document.createElement('button');
  battleBtn.id = 'debug-battle-btn';
  battleBtn.textContent = 'Probar Jefe';
  battleBtn.style.cssText = baseStyle + `
    color: #ff5555;
    border: 1px solid #ff5555;
  `;
  battleBtn.addEventListener('click', () => switchScene('BATTLE', 'anthelios'));

  const allyBtn = document.createElement('button');
  allyBtn.id = 'debug-ally-btn';
  allyBtn.textContent = 'Selector Aliados';
  allyBtn.style.cssText = baseStyle + `
    color: #00aaff;
    border: 1px solid #00aaff;
  `;
  allyBtn.addEventListener('click', () => {
    globalState.recruitedAllies.push('aliado_1', 'aliado_2', 'aliado_3');
    globalState.unlockedAllies['aliado_1'] = { ...ALLIES_DB.aliado_1, level: 5, xp: 50, nextLevelXp: 100, maxHp: 120, attack: 20, speed: 7 };
    globalState.unlockedAllies['aliado_2'] = { ...ALLIES_DB.aliado_2, level: 3, xp: 30, nextLevelXp: 100, maxHp: 110, attack: 15, speed: 5 };
    globalState.unlockedAllies['aliado_3'] = { ...ALLIES_DB.aliado_3, level: 8, xp: 80, nextLevelXp: 100, maxHp: 90, attack: 25, speed: 4 };
    openAllySelector('Elige a tu acompañante para el bosque');
  });

  container.appendChild(battleBtn);
  container.appendChild(allyBtn);
  document.body.appendChild(container);
}

document.addEventListener('DOMContentLoaded', () => {
  resizeCanvases();
  initInput();
  createDebugButton();
  switchScene('START');
  
  document.getElementById('ally-selector-close').addEventListener('click', closeAllySelector);
  
  window.openAllySelector = openAllySelector;
  
  window.addEventListener('ally-changed', () => {
    refreshActiveAlly();
  });
});