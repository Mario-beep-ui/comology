function handleResize() {
    const gameContainer = document.getElementById('game-container');
    const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
    gameContainer.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', handleResize);
window.addEventListener('load', handleResize);

// 🧠 Estado del juego
const gameState = {
    playerHealth: 100,
    enemyHealth: 100,
    inBattle: false,
    currentDialogue: 0,
    spareCounter: 0
};

// 💬 Diálogos
const dialogues = [
    "Te encuentras en un oscuro bosque...",
    "Una figura oscura emerge de las sombras!",
    "¿Qué vas a hacer?"
];

// 🔊 Sonidos
const musicBattle = new Audio('./sonidos/musica_combate.mp3');
musicBattle.loop = true;

const soundAttack = new Audio('./sonidos/ataque_combate.mp3');
const soundVictory = new Audio('./sonidos/victoria_combate.mp3');
const soundDefeat = new Audio('./sonidos/derrota_combate.mp3');
const soundTextAdvance = new Audio('./sonidos/avanzar_texto.mp3');

// 👊 Ataques del enemigo
const enemyAttacks = [
    { name: "Golpe Sombrío", damage: 12, animation: 'enemyAttack' },
    { name: "Oleada Oscura", damage: 18, animation: 'enemyAttack' }
];

// 🎞️ Animaciones
function animateCharacter(element, animation) {
    element.style.animation = `${animation} 0.5s`;
    setTimeout(() => element.style.animation = '', 500);
}

// 📝 Texto animado tipo Pokémon
function typeText(element, text, index = 0, callback = null) {
    if (index === 0) {
        soundTextAdvance.currentTime = 0;
        soundTextAdvance.play();
    }
    if (index < text.length) {
        element.textContent += text.charAt(index);
        setTimeout(() => typeText(element, text, index + 1, callback), 30);
    } else if (callback) {
        callback();
    }
}

// 🟢 Pantalla de inicio
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    resetGame(); // Inicia el juego desde el primer diálogo
});


function updateDialogue(text, callback) {
    const el = document.getElementById('dialogue-text');
    el.textContent = '';
    typeText(el, text, 0, callback);
}

// 📦 Opciones
function showOptions(options) {
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'battle-option';
        button.textContent = option.text;
        button.addEventListener('click', option.action);
        container.appendChild(button);
    });
}

// ⚔️ Inicia la batalla
function startBattle() {
    gameState.inBattle = true;
    document.getElementById('battle-screen').style.display = 'block';
    musicBattle.currentTime = 0;
    musicBattle.play();
    showBattleOptions();
    updateHealthBars();
}

// 🔘 Opciones durante la batalla
function showBattleOptions() {
    showOptions([
        {
            text: 'Atacar',
            action: () => {
                const damage = Math.floor(Math.random() * 15) + 8;
                const playerSprite = document.getElementById('player-sprite');
                const enemySprite = document.getElementById('enemy-sprite');
                
                animateCharacter(playerSprite, 'playerAttack');
                soundAttack.currentTime = 0;
                soundAttack.play();

                setTimeout(() => {
                    gameState.enemyHealth = Math.max(0, gameState.enemyHealth - damage);
                    updateDialogue(`Infliges ${damage} de daño!`);
                    updateHealthBars();
                    animateCharacter(enemySprite, 'hurt');

                    if (gameState.enemyHealth <= 0) {
                        endBattle(true);
                    } else {
                        setTimeout(enemyTurn, 1000);
                    }
                }, 300);
            }
        },
        {
            text: 'Perdonar',
            action: () => {
                gameState.spareCounter++;
                updateDialogue('Intentas comprender al enemigo...');
                setTimeout(() => {
                    if (gameState.spareCounter >= 3) {
                        endBattle(true);
                    } else {
                        enemyTurn();
                    }
                }, 1500);
            }
        }
    ]);
}

// 💥 Turno del enemigo
function enemyTurn() {
    const attack = enemyAttacks[Math.floor(Math.random() * enemyAttacks.length)];
    const playerSprite = document.getElementById('player-sprite');
    const enemySprite = document.getElementById('enemy-sprite');
    
    animateCharacter(enemySprite, attack.animation);

    setTimeout(() => {
        gameState.playerHealth = Math.max(0, gameState.playerHealth - attack.damage);
        updateDialogue(`${attack.name}! (-${attack.damage} HP)`);
        updateHealthBars();
        animateCharacter(playerSprite, 'hurt');
        soundAttack.currentTime = 0;
        soundAttack.play();

        if (gameState.playerHealth <= 0) {
            endBattle(false);
        } else {
            showBattleOptions();
        }
    }, 300);
}

// ❤️ Barras de vida
function updateHealthBars() {
    document.getElementById('player-health').style.width = `${gameState.playerHealth}%`;
    document.getElementById('enemy-health').style.width = `${gameState.enemyHealth}%`;
}

// 🏁 Fin del combate
function endBattle(victory) {
    gameState.inBattle = false;
    document.getElementById('battle-screen').style.display = 'none';
    musicBattle.pause();

    const overlay = document.getElementById('flash-overlay');

    if (victory) {
        overlay.classList.add('flash-white');
        soundVictory.play();
        setTimeout(() => {
            overlay.classList.remove('flash-white');
            document.getElementById('victory-modal').style.display = 'flex';
        }, 400);
    } else {
        overlay.classList.add('flash-red');
        soundDefeat.play();
        setTimeout(() => {
            overlay.classList.remove('flash-red');
            document.getElementById('game-over-modal').style.display = 'flex';
        }, 400);
    }
}

// 🔄 Reiniciar
function resetGame() {
    gameState.playerHealth = 100;
    gameState.enemyHealth = 100;
    gameState.inBattle = false;
    gameState.currentDialogue = 0;
    gameState.spareCounter = 0;

    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('victory-modal').style.display = 'none';

    updateHealthBars();
    updateDialogue(dialogues[0]);
    showOptions([{ text: 'Comenzar', action: advanceStory }]);
}

// 📜 Avanzar historia
function advanceStory() {
    gameState.currentDialogue++;
    if (gameState.currentDialogue < dialogues.length) {
        updateDialogue(dialogues[gameState.currentDialogue]);
        showOptions([{ text: 'Siguiente', action: advanceStory }]);
    } else {
        startBattle();
    }
}

// 🧷 Botones de modal
document.getElementById('restart-button').addEventListener('click', resetGame);
document.getElementById('victory-button').addEventListener('click', resetGame);

// 🔁 Inicialización
handleResize();
updateDialogue(dialogues[0]);
showOptions([{ text: 'Comenzar', action: advanceStory }]);

document.addEventListener('DOMContentLoaded', () => {
    handleResize();
    updateDialogue(dialogues[0]);
    showOptions([{ text: 'Comenzar', action: advanceStory }]);
});
