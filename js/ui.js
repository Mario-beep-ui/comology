import { globalState } from './state.js';
import { ALLIES_DB } from './characters.js';

let playerMovementPaused = false;
let previousMovementState = null;

export function openAllySelector(contextMessage = "Elige a tu acompañante") {
  const modal = document.getElementById('ally-swap-modal');
  if (!modal) {
    console.error('Modal #ally-swap-modal no encontrado en el DOM');
    return;
  }

  pausePlayerMovement();
  
  const container = document.getElementById('ally-selector-container');
  const messageEl = document.getElementById('ally-selector-message');
  
  if (messageEl) {
    messageEl.textContent = contextMessage;
  }

  if (globalState.recruitedAllies.length === 0) {
    container.innerHTML = `
      <div class="ally-selector-empty">
        <p>Aún no tienes aliados reclutados en tu grupo.</p>
      </div>
    `;
  } else {
    container.innerHTML = globalState.recruitedAllies.map(allyId => {
      const allyData = ALLIES_DB[allyId];
      const unlockedData = globalState.unlockedAllies[allyId];
      
      if (!allyData || !unlockedData) return '';
      
      const isActive = globalState.activeAlly === allyId;
      const level = unlockedData.level || 1;
      const xp = unlockedData.xp || 0;
      const nextLevelXp = unlockedData.nextLevelXp || 100;
      const xpPercent = (xp / nextLevelXp) * 100;
      const maxHp = unlockedData.maxHp || allyData.maxHp;
      const attack = unlockedData.attack || allyData.attack;
      
      return `
        <div class="ally-card ${isActive ? 'active' : ''}" data-ally-id="${allyId}">
          <div class="ally-card-header">
            <span class="ally-name">${allyData.name}</span>
            ${isActive ? '<span class="ally-active-badge">ACTIVO</span>' : ''}
          </div>
          <div class="ally-stats">
            <div class="ally-stat">
              <span class="stat-label">Lv.</span>
              <span class="stat-value">${level} / 30</span>
            </div>
            <div class="ally-stat">
              <span class="stat-label">PS</span>
              <span class="stat-value">${maxHp}</span>
            </div>
            <div class="ally-stat">
              <span class="stat-label">ATK</span>
              <span class="stat-value">${attack}</span>
            </div>
          </div>
          <div class="ally-xp-bar">
            <div class="ally-xp-fill" style="width: ${xpPercent}%"></div>
          </div>
          <div class="ally-xp-text">XP: ${xp} / ${nextLevelXp}</div>
          <button class="ally-select-btn" ${isActive ? 'disabled' : ''}>
            ${isActive ? 'Continuar con este aliado' : 'Seleccionar'}
          </button>
        </div>
      `;
    }).join('');
  }

  modal.style.display = 'flex';
  
  container.querySelectorAll('.ally-select-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.ally-card');
      const allyId = card.dataset.allyId;
      if (setActiveAllyFromUI(allyId)) {
        closeAllySelector();
      }
    });
  });
}

export function closeAllySelector() {
  const modal = document.getElementById('ally-swap-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  resumePlayerMovement();
}

function setActiveAllyFromUI(allyId) {
  if (!globalState.recruitedAllies.includes(allyId)) {
    return false;
  }
  globalState.activeAlly = allyId;
  console.log(`Aliado activo cambiado a: ${allyId}`);
  window.dispatchEvent(new CustomEvent('ally-changed'));
  return true;
}

function pausePlayerMovement() {
  if (typeof window.playerMovementEnabled !== 'undefined') {
    previousMovementState = window.playerMovementEnabled;
    window.playerMovementEnabled = false;
  }
  playerMovementPaused = true;
}

function resumePlayerMovement() {
  if (previousMovementState !== null) {
    window.playerMovementEnabled = previousMovementState;
    previousMovementState = null;
  }
  playerMovementPaused = false;
}

export function isPlayerMovementPaused() {
  return playerMovementPaused;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('ally-swap-modal');
    if (modal && modal.style.display === 'flex') {
      closeAllySelector();
    }
  }
});