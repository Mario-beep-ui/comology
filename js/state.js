export const globalState = {
  currentScene: 'START',
  currentSection: 'bosque',
  currentZone: 'Bosque (Afueras de Tyni City)',
  currentLevel: 1,
  inventory: [],
  player: {
    id: 'morfeo',
    name: 'Morfeo',
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    maxHp: 100,
    hp: 100,
    attack: 12,
    speed: 4,
    sprite: './personajes/Morfeo.png'
  },
  activeAlly: null,
  finalBossParty: [],
  recruitedAllies: [],
  unlockedAllies: {}
};

const GROWTH_CURVES = {
  early: { hp: 1.15, attack: 1.12, speed: 1.05 },
  balanced: { hp: 1.1, attack: 1.1, speed: 1.1 },
  late: { hp: 1.05, attack: 1.08, speed: 1.15 }
};

function getGrowthMultiplier(growthType, level) {
  const curve = GROWTH_CURVES[growthType] || GROWTH_CURVES.balanced;
  return {
    hp: Math.pow(curve.hp, level - 1),
    attack: Math.pow(curve.attack, level - 1),
    speed: Math.pow(curve.speed, level - 1)
  };
}

export function addExperience(characterId, amount) {
  let character;
  
  if (characterId === 'morfeo') {
    character = globalState.player;
  } else if (globalState.unlockedAllies[characterId]) {
    character = globalState.unlockedAllies[characterId];
  } else {
    console.warn(`Character ${characterId} not found`);
    return;
  }

  character.xp += amount;
  
  while (character.xp >= character.nextLevelXp) {
    character.xp -= character.nextLevelXp;
    character.level++;
    character.nextLevelXp = Math.floor(character.nextLevelXp * 1.5);
    
    const growthType = character.growthType || 'balanced';
    const mult = getGrowthMultiplier(growthType, character.level);
    
    const baseHp = character.baseMaxHp || character.maxHp;
    const baseAttack = character.baseAttack || character.attack;
    const baseSpeed = character.baseSpeed || character.speed;
    
    character.maxHp = Math.floor(baseHp * mult.hp);
    character.attack = Math.floor(baseAttack * mult.attack);
    character.speed = Math.floor(baseSpeed * mult.speed);
    
    if (character.hp > character.maxHp) character.hp = character.maxHp;
    
    console.log(`${character.name} subió a nivel ${character.level}! HP: ${character.maxHp}, ATK: ${character.attack}, SPD: ${character.speed}`);
  }
}

export function initializeAlly(allyId, allyData) {
  if (!globalState.unlockedAllies[allyId]) {
    globalState.unlockedAllies[allyId] = {
      ...allyData,
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      hp: allyData.maxHp,
      baseMaxHp: allyData.maxHp,
      baseAttack: allyData.attack,
      baseSpeed: allyData.speed
    };
  }
}

export function setActiveAlly(allyId) {
  if (!globalState.recruitedAllies.includes(allyId)) {
    console.warn(`Aliado ${allyId} no está reclutado`);
    return false;
  }
  globalState.activeAlly = allyId;
  console.log(`Aliado activo: ${allyId}`);
  return true;
}

export function recruitAlly(allyId) {
  if (!globalState.recruitedAllies.includes(allyId)) {
    globalState.recruitedAllies.push(allyId);
    initializeAlly(allyId, globalState.unlockedAllies[allyId] || {});
    console.log(`Aliado reclutado: ${allyId}`);
  }
}

export function addToFinalBossParty(allyId) {
  if (globalState.finalBossParty.length >= 4) {
    console.warn('El grupo para el jefe final ya está completo (máx. 4)');
    return false;
  }
  if (!globalState.recruitedAllies.includes(allyId)) {
    console.warn(`Aliado ${allyId} no está reclutado`);
    return false;
  }
  if (globalState.finalBossParty.includes(allyId)) {
    console.warn(`Aliado ${allyId} ya está en el grupo final`);
    return false;
  }
  globalState.finalBossParty.push(allyId);
  return true;
}