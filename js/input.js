export const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  attack: false,
  jump: false,
  interact: false
};

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || /Android|iPhone|iPad/i.test(navigator.userAgent);
}

const keyMap = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'attack', KeyJ: 'attack',
  KeyK: 'jump', ShiftLeft: 'jump',
  KeyE: 'interact', Enter: 'interact'
};

const buttonActions = {
  'btn-up': 'up',
  'btn-down': 'down',
  'btn-left': 'left',
  'btn-right': 'right',
  'btn-attack': 'attack',
  'btn-jump': 'jump',
  'btn-interact': 'interact'
};

function setInput(action, value) {
  if (action in inputState) {
    inputState[action] = value;
  }
}

function handleKeyDown(e) {
  const action = keyMap[e.code];
  if (action) {
    e.preventDefault();
    setInput(action, true);
  }
}

function handleKeyUp(e) {
  const action = keyMap[e.code];
  if (action) {
    e.preventDefault();
    setInput(action, false);
  }
}

function createTouchHandler(buttonId, value) {
  return (e) => {
    e.preventDefault();
    const action = buttonActions[buttonId];
    if (action) {
      setInput(action, value);
    }
  };
}

function initTouchControls() {
  const controls = document.getElementById('mobile-controls');
  const toggleBtn = document.getElementById('toggle-touch-btn');
  
  if (!controls) return;
  
  Object.entries(buttonActions).forEach(([btnId, action]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('touchstart', createTouchHandler(btnId, true), { passive: false });
      btn.addEventListener('touchend', createTouchHandler(btnId, false), { passive: false });
      btn.addEventListener('touchcancel', createTouchHandler(btnId, false), { passive: false });
      btn.addEventListener('mousedown', createTouchHandler(btnId, true));
      btn.addEventListener('mouseup', createTouchHandler(btnId, false));
      btn.addEventListener('mouseleave', createTouchHandler(btnId, false));
    }
  });
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      controls.classList.toggle('hidden');
      toggleBtn.textContent = controls.classList.contains('hidden') ? 'Mostrar Controles' : 'Ocultar Controles';
    });
  }
  
  if (isTouchDevice()) {
    controls.classList.remove('hidden');
  } else {
    controls.classList.add('hidden');
  }
}

export function initInput() {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  initTouchControls();
}

export function destroyInput() {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
}