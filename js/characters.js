export const ALLIES_DB = {
  aliado_1: {
    id: 'aliado_1',
    name: 'Lumina',
    description: 'Una guerrera de luz que destaca en niveles tempranos.',
    growthType: 'early',
    maxHp: 80,
    attack: 15,
    speed: 5,
    sprite: './personajes/Morfeo.png',
    abilities: [
      { id: 'luz_curativa', name: 'Luz Curativa', type: 'heal', power: 25, cooldown: 3, description: 'Restaura 25 HP al aliado con menos vida.' },
      { id: 'destello', name: 'Destello Cegador', type: 'attack', power: 18, cooldown: 2, description: 'Ataca al enemigo y reduce su precisión.' }
    ]
  },
  aliado_2: {
    id: 'aliado_2',
    name: 'Vesper',
    description: 'Un espadachín equilibrado que crece de forma constante.',
    growthType: 'balanced',
    maxHp: 100,
    attack: 12,
    speed: 4,
    sprite: './personajes/Morfeo.png',
    abilities: [
      { id: 'corte_rapido', name: 'Corte Rápido', type: 'attack', power: 20, cooldown: 2, description: 'Ataque rápido con probabilidad de golpe crítico.' },
      { id: 'postura_defensiva', name: 'Postura Defensiva', type: 'buff', power: 0, cooldown: 3, description: 'Reduce el daño recibido un 50% por 2 turnos.' }
    ]
  },
  aliado_3: {
    id: 'aliado_3',
    name: 'Astralis',
    description: 'Un mago estelar que se vuelve devastador en niveles altos.',
    growthType: 'late',
    maxHp: 70,
    attack: 10,
    speed: 3,
    sprite: './personajes/Morfeo.png',
    abilities: [
      { id: 'meteorito', name: 'Lluvia de Meteoritos', type: 'attack', power: 30, cooldown: 4, description: 'Golpea a todos los enemigos con daño masivo.' },
      { id: 'gravedad', name: 'Campo Gravitatorio', type: 'debuff', power: 0, cooldown: 3, description: 'Reduce la velocidad de todos los enemigos a la mitad.' }
    ]
  }
};

export const BOSSES_DB = {
  anthelios: {
    id: 'anthelios',
    name: 'Anthelios',
    maxHp: 250,
    attack: 15,
    sprite: './personajes/Anthelios.png',
    xpReward: 120,
    abilities: [
      { id: 'llama_solar', name: 'Llama Solar', type: 'attack', power: 25, cooldown: 2 },
      { id: 'explosion_estelar', name: 'Explosión Estelar', type: 'attack', power: 40, cooldown: 4 }
    ]
  }
};