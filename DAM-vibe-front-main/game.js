/**
 * GAME.js - Lógica principal del juego RPG
 */

// Estado del juego
const gameState = {
    player: null,
    map: null,
    playerStats: null,
    inCombat: false,
    currentEnemy: null,
    mapSize: { width: 10, height: 10 }, // Tamaño predeterminado del mapa
    tileTypes: {
        'grass': { color: '#8bc34a', encounterRate: 0.2 },
        'forest': { color: '#33691e', encounterRate: 0.4 },
        'mountain': { color: '#795548', encounterRate: 0.1 },
        'water': { color: '#2196f3', encounterRate: 0 }
    }
};

// Referencias a elementos del DOM
const elements = {
    // Elementos del jugador
    playerName: document.getElementById('player-name'),
    playerLevel: document.getElementById('player-level'),
    playerHealth: document.getElementById('player-health'),
    playerMaxHealth: document.getElementById('player-max-health'),
    playerExp: document.getElementById('player-exp'),
    playerNextLevel: document.getElementById('player-next-level'),
    playerStrength: document.getElementById('player-strength'),
    healthBarFill: document.getElementById('health-bar-fill'),
    expBarFill: document.getElementById('exp-bar-fill'),
    
    // Elementos de estadísticas
    battlesWon: document.getElementById('battles-won'),
    battlesLost: document.getElementById('battles-lost'),
    stepsTaken: document.getElementById('steps-taken'),
    
    // Elementos del mapa
    gameMap: document.getElementById('game-map'),
    
    // Controles de movimiento
    btnUp: document.getElementById('btn-up'),
    btnDown: document.getElementById('btn-down'),
    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    
    // Elementos de combate
    combatPanel: document.getElementById('combat-panel'),
    enemyName: document.getElementById('enemy-name'),
    enemyHealth: document.getElementById('enemy-health'),
    enemyMaxHealth: document.getElementById('enemy-max-health'),
    enemyLevel: document.getElementById('enemy-level'),
    enemyStrength: document.getElementById('enemy-strength'),
    enemyXpReward: document.getElementById('enemy-xp-reward'),
    enemyHealthBarFill: document.getElementById('enemy-health-bar-fill'),
    playerDice: document.getElementById('player-dice'),
    enemyDice: document.getElementById('enemy-dice'),
    combatLog: document.getElementById('combat-log'),
    btnAttack: document.getElementById('btn-attack'),
    btnFlee: document.getElementById('btn-flee'),
    
    // Elementos del log
    adventureLog: document.getElementById('adventure-log'),
    
    // Modal de fin de juego
    gameOverModal: document.getElementById('game-over-modal'),
    gameOverTitle: document.getElementById('game-over-title'),
    gameOverMessage: document.getElementById('game-over-message'),
    btnRestart: document.getElementById('btn-restart')
};

// Inicialización del juego
async function initGame() {
    try {
        // Cargar datos del jugador
        gameState.player = await fetchPlayerData();
        if (!gameState.player) {
            addToGameLog('Error al inicializar el juego. No se pudo cargar el jugador.');
            return;
        }

        // Asegurar posición inicial del jugador como valores numéricos
        if (gameState.player.position_x === undefined || gameState.player.position_y === undefined) {
            gameState.player.position_x = 0; // Posición inicial predeterminada
            gameState.player.position_y = 0;
        } else {
            // Convertir a número para asegurar que son valores numéricos
            gameState.player.position_x = Number(gameState.player.position_x);
            gameState.player.position_y = Number(gameState.player.position_y);
        }
        
        // Console.log para depuración
        console.log("Posición inicial del jugador:", gameState.player.position_x, gameState.player.position_y);
        
        
        // Cargar estadísticas
        gameState.playerStats = await fetchPlayerStats();
        
        // Cargar mapa
        gameState.map = await fetchGameMap();
        
        // Verificar y establecer el tamaño del mapa
        if (!gameState.mapSize || typeof gameState.mapSize.width !== 'number' || typeof gameState.mapSize.height !== 'number') {
            console.warn("Tamaño del mapa no definido correctamente, usando valores predeterminados");
            gameState.mapSize = { width: 10, height: 10 }; // Valores predeterminados
        }
        
        console.log("Tamaño del mapa:", gameState.mapSize.width, "×", gameState.mapSize.height);

        
        // Actualizar interfaz
        updatePlayerUI();
        updateStatsUI();
        renderMap();
        
        // Añadir evento de bienvenida
        addToGameLog(`¡Bienvenido, ${gameState.player.name}! Tu aventura comienza.`);
        
        // Configurar eventos de los botones
        setupEventListeners();
        
        // Configurar eventos de teclado
        setupKeyboardControls();
        
    } catch (error) {
        console.error('Error al inicializar el juego:', error);
        addToGameLog('¡Error al inicializar el juego!');
    }
}

// Actualiza la interfaz del jugador con los datos actuales
function updatePlayerUI() {
    if (!gameState.player) return;
    
    elements.playerName.textContent = gameState.player.name;
    elements.playerLevel.textContent = gameState.player.level;
    elements.playerHealth.textContent = gameState.player.health;
    elements.playerMaxHealth.textContent = gameState.player.max_health;
    elements.playerExp.textContent = gameState.player.experience;
    elements.playerNextLevel.textContent = gameState.player.level * 100; // Ejemplo simple de cálculo
    elements.playerStrength.textContent = gameState.player.strength;
    
    // Actualizar barras
    const healthPercent = (gameState.player.health / gameState.player.max_health) * 100;
    elements.healthBarFill.style.width = `${healthPercent}%`;
    
    const expToNextLevel = gameState.player.level * 100;
    const expPercent = (gameState.player.experience / expToNextLevel) * 100;
    elements.expBarFill.style.width = `${expPercent}%`;
}

// Actualiza las estadísticas del jugador
function updateStatsUI() {
    if (!gameState.playerStats) return;
    
    elements.battlesWon.textContent = gameState.playerStats.battles_won;
    elements.battlesLost.textContent = gameState.playerStats.battles_lost;
    elements.stepsTaken.textContent = gameState.playerStats.steps_taken;
}

// Renderiza el mapa del juego
function renderMap() {
    if (!gameState.map) return;

    console.log("Renderizando mapa. Posición del jugador:", gameState.player.position_x, gameState.player.position_y);

    // Limpiar el mapa actual
    elements.gameMap.innerHTML = '';

    // Establecer el tamaño de la cuadrícula
    elements.gameMap.style.gridTemplateColumns = `repeat(${gameState.mapSize.width}, 1fr)`;
    elements.gameMap.style.gridTemplateRows = `repeat(${gameState.mapSize.height}, 1fr)`;

    let playerTileFound = false;

    // Crear las casillas del mapa
    gameState.map.forEach(tile => {
        // Convertir coordenadas a números para comparación consistente
        const tileX = Number(tile.x);
        const tileY = Number(tile.y);
        
        const tileElement = document.createElement('div');
        tileElement.className = `tile tile-${tile.type}`;
        tileElement.dataset.x = tileX;
        tileElement.dataset.y = tileY;

        // Marcar la posición del jugador
        if (tileX === gameState.player.position_x && tileY === gameState.player.position_y) {
            const playerMarker = document.createElement('div');
            playerMarker.className = 'player-marker';
            tileElement.appendChild(playerMarker);
            playerTileFound = true;
            console.log("Marcador del jugador añadido en:", tileX, tileY);
        }

        elements.gameMap.appendChild(tileElement);
    });

    if (!playerTileFound) {
        console.error("No se encontró ninguna casilla que coincida con la posición del jugador:", 
                    gameState.player.position_x, gameState.player.position_y);
    }
}

// Configura los event listeners para los botones
function setupEventListeners() {
    // Botones de movimiento
    elements.btnUp.addEventListener('click', () => handleMovement('up'));
    elements.btnDown.addEventListener('click', () => handleMovement('down'));
    elements.btnLeft.addEventListener('click', () => handleMovement('left'));
    elements.btnRight.addEventListener('click', () => handleMovement('right'));
    
    // Botones de combate
    elements.btnAttack.addEventListener('click', handleAttack);
    elements.btnFlee.addEventListener('click', handleFlee);
    
    // Botón de reinicio
    elements.btnRestart.addEventListener('click', handleRestart);
}

// Configura los controles de teclado
function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        if (gameState.inCombat) return; // No permitir movimiento durante el combate
        
        switch (event.key) {
            case 'ArrowUp':
                handleMovement('up');
                break;
            case 'ArrowDown':
                handleMovement('down');
                break;
            case 'ArrowLeft':
                handleMovement('left');
                break;
            case 'ArrowRight':
                handleMovement('right');
                break;
        }
    });
}

// Verifica si las coordenadas son válidas dentro del mapa
function isValidPosition(x, y) {
    const mapWidth = Number(gameState.mapSize.width);
    const mapHeight = Number(gameState.mapSize.height);
    
    return (
        !isNaN(x) && !isNaN(y) && !isNaN(mapWidth) && !isNaN(mapHeight) &&
        x >= 0 && x < mapWidth && y >= 0 && y < mapHeight
    );
}

// Verifica si un tile es transitable según su tipo
function isTileTransitable(x, y) {
    // Primero aseguramos que la posición está dentro del mapa
    if (!isValidPosition(x, y)) return false;
    
    // Buscar el tile en las coordenadas indicadas
    const tile = gameState.map.find(tile => {
        return Number(tile.x) === Number(x) && Number(tile.y) === Number(y);
    });
    
    // Si no se encuentra el tile, no es transitable
    if (!tile) {
        console.warn(`No se encontró un tile en la posición (${x}, ${y})`);
        return false;
    }
    
    // Verificar si el tipo de tile permite movimiento
    // En este caso, el agua no es transitable
    return tile.type !== 'water';
}

// Maneja el movimiento del jugador
async function handleMovement(direction) {
    if (gameState.inCombat) {
        addToGameLog('¡No puedes moverte durante un combate!');
        return;
    }
    
    // Asegurar que las coordenadas son números
    const position_x = Number(gameState.player.position_x);
    const position_y = Number(gameState.player.position_y);
    let newX = position_x;
    let newY = position_y;
    
    // Calcular nueva posición según la dirección
    switch (direction) {
        case 'up': newY--; break;
        case 'down': newY++; break;
        case 'left': newX--; break;
        case 'right': newX++; break;
    }
    
    if (!isValidPosition(newX, newY)) {
        console.log(`Movimiento fuera de límites - Coordenadas: (${newX},${newY})`);
        addToGameLog(`¡No puedes moverte hacia ${getDirectionText(direction)}!`);
        return; // Detener aquí y no enviar la petición al servidor
    }
    if (!isTileTransitable(newX, newY)) {
        console.log(`Movimiento a tile no transitable (agua) - Coordenadas: (${newX},${newY})`);
        addToGameLog(`¡No puedes moverte hacia ${getDirectionText(direction)}! El agua bloquea tu camino.`);
        return;
    }
    
    try {
        // Solo enviar petición al API si estamos dentro de los límites
        const result = await movePlayer(direction);
        if (!result) {
            console.error("Error al mover el jugador: no se recibió respuesta del servidor");
            return;
        }
        
        // Actualizar la posición del jugador
        gameState.player.position_x = Number(result.player.position_x);
        gameState.player.position_y = Number(result.player.position_y);
        
        // Actualizar estadísticas
        gameState.playerStats.steps_taken++;
        updateStatsUI();
        
        // Renderizar el mapa actualizado
        renderMap();
        
        // Añadir al log
        addToGameLog(`Te has movido hacia ${getDirectionText(direction)}.`);
        
        // Verificar si hay un encuentro
        if (result.encounter) {
            handleEncounter(result.encounter);
        }
    } catch (error) {
        console.error("Error al mover el jugador:", error);
        addToGameLog("¡Ha ocurrido un error al intentar moverte!");
    }
}

// Obtiene el texto para la dirección
function getDirectionText(direction) {
    switch (direction) {
        case 'up': return 'arriba';
        case 'down': return 'abajo';
        case 'left': return 'la izquierda';
        case 'right': return 'la derecha';
        default: return direction;
    }
}

// Maneja un encuentro con enemigo
async function handleEncounter(encounter) {
    gameState.inCombat = true;
    gameState.currentEnemy = encounter.enemy;
    
    // Iniciar combate con la API
    const combatData = await startCombat();
    if (!combatData) {
        gameState.inCombat = false;
        return;
    }
    
    // Mostrar panel de combate
    showCombatPanel();
    
    // Actualizar UI de enemigo
    updateEnemyUI();

    // Asegurar que los botones de combate estén habilitados
    setActionButtonsEnabled(true);
    
    // Añadir al log de aventura
    addToGameLog(`¡Has encontrado un ${gameState.currentEnemy.name}!`);
    
    // Añadir al log de combate
    addToCombatLog(`¡Un ${gameState.currentEnemy.name} nivel ${gameState.currentEnemy.level} apareció!`);
}

// Muestra el panel de combate
function showCombatPanel() {
    elements.combatPanel.classList.remove('hidden');
    setActionButtonsEnabled(true);
}

// Oculta el panel de combate
function hideCombatPanel() {
    elements.combatPanel.classList.add('hidden');
    elements.combatLog.innerHTML = '';
    setActionButtonsEnabled(true);
}

// Actualiza la UI del enemigo
function updateEnemyUI() {
    const enemy = gameState.currentEnemy;
    
    elements.enemyName.textContent = enemy.name;
    elements.enemyHealth.textContent = enemy.health;
    elements.enemyMaxHealth.textContent = enemy.health; // Asumimos que comienza con salud completa
    elements.enemyLevel.textContent = enemy.level;
    elements.enemyStrength.textContent = enemy.strength;
    elements.enemyXpReward.textContent = enemy.experience_reward;
    
    // Actualizar barra de salud
    elements.enemyHealthBarFill.style.width = '100%';
}

// Maneja el ataque del jugador
async function handleAttack() {
    if (!gameState.inCombat) return;
    
    // Desactivar botones durante el ataque
    setActionButtonsEnabled(false);
    
    // Tirar dados
    const playerRoll = rollDice(1, 20);
    const enemyRoll = rollDice(1, 20);
    
    // Mostrar resultados de los dados
    elements.playerDice.textContent = playerRoll;
    elements.enemyDice.textContent = enemyRoll;
    
    // Enviar ataque a la API
    const attackResult = await attackEnemy();
    if (!attackResult) {
        setActionButtonsEnabled(true);
        return;
    }
    
    // Actualizar la salud del jugador y enemigo
    gameState.player.health = attackResult.player.health;
    gameState.currentEnemy.health = attackResult.enemy.health;
    
    // Actualizar UI
    updatePlayerUI();
    
    // Actualizar salud del enemigo
    elements.enemyHealth.textContent = gameState.currentEnemy.health;
    const enemyHealthPercent = (gameState.currentEnemy.health / gameState.currentEnemy.health) * 100;
    elements.enemyHealthBarFill.style.width = `${enemyHealthPercent}%`;
    
    // Añadir mensaje al log de combate
    if (playerRoll > enemyRoll) {
        addToCombatLog(`¡Golpeaste al ${gameState.currentEnemy.name} causando ${attackResult.damage.player_to_enemy} de daño!`);
    } else {
        addToCombatLog(`El ${gameState.currentEnemy.name} te golpeó causando ${attackResult.damage.enemy_to_player} de daño.`);
    }
    
    // Verificar si el combate ha terminado
    if (gameState.player.health <= 0) {
        // Jugador derrotado
        await handleCombatEnd('lose');
    } else if (gameState.currentEnemy.health <= 0) {
        // Enemigo derrotado
        await handleCombatEnd('win');
    } else {
        // Combate continúa
        setActionButtonsEnabled(true);
    }
}

// Maneja la acción de huir
async function handleFlee() {
    if (!gameState.inCombat) return;
    
    // Desactivar botones durante la acción
    setActionButtonsEnabled(false);
    
    // Tirar dado para huir (éxito si es > 10)
    const fleeRoll = rollDice(1, 20);
    elements.playerDice.textContent = fleeRoll;
    elements.enemyDice.textContent = '-';
    
    // Enviar acción de huir a la API
    const fleeResult = await fleeCombat();
    if (!fleeResult) {
        setActionButtonsEnabled(true);
        return;
    }
    
    if (fleeResult.success) {
        addToCombatLog(`¡Has logrado huir del combate!`);
        // await handleCombatEnd('flee');
        gameState.inCombat = false;
             // Esperar un momento antes de ocultar el panel
             setTimeout(() => {
                hideCombatPanel();
                updatePlayerUI();
                updateStatsUI();
            }, 2000);
            return;
    } else {
        addToCombatLog(`¡No lograste huir! El ${gameState.currentEnemy.name} te golpea.`);
        
        // El enemigo ataca automáticamente
        gameState.player.health = fleeResult.player.health;
        updatePlayerUI();
        
        addToCombatLog(`Recibes ${fleeResult.damage} de daño.`);
        
        // Verificar si el jugador muere
        if (gameState.player.health <= 0) {
            await handleCombatEnd('lose');
        } else {
            setActionButtonsEnabled(true);
        }
    }
}

// Finaliza el combate y procesa el resultado
async function handleCombatEnd(result) {
    const endResult = await endCombat(result);
    if (!endResult) return;
    
    gameState.inCombat = false;
    
    // Actualizar datos del jugador
    if (endResult.player) {
        gameState.player = endResult.player;
    }
    
    // Actualizar estadísticas
    if (endResult.stats) {
        gameState.playerStats = endResult.stats;
    }
    
    // Procesar el resultado
    switch (result) {
        case 'win':
            addToCombatLog(`¡Has derrotado al ${gameState.currentEnemy.name}!`);
            addToCombatLog(`Ganaste ${gameState.currentEnemy.experience_reward} puntos de experiencia.`);
            addToGameLog(`¡Victoria! Derrotaste a un ${gameState.currentEnemy.name}.`);
            
            // Verificar si subió de nivel
            if (endResult.levelUp) {
                addToCombatLog(`¡Has subido al nivel ${gameState.player.level}!`);
                addToGameLog(`¡Has subido al nivel ${gameState.player.level}!`);
            }
            
            // Esperar un momento antes de ocultar el panel
            setTimeout(() => {
                hideCombatPanel();
                updatePlayerUI();
                updateStatsUI();
            }, 2000);
            break;
            
        case 'lose':
            addToCombatLog(`¡Has sido derrotado por el ${gameState.currentEnemy.name}!`);
            addToGameLog(`¡Derrota! Fuiste vencido por un ${gameState.currentEnemy.name}.`);
            
            // Mostrar modal de fin de juego
            elements.gameOverTitle.textContent = '¡Has sido derrotado!';
            elements.gameOverMessage.textContent = `Tu aventura ha terminado a manos de un ${gameState.currentEnemy.name}.`;
            elements.gameOverModal.classList.remove('hidden');
            break;
            
        case 'flee':
            addToGameLog(`Has huido del combate con el ${gameState.currentEnemy.name}.`);
            
            // Ocultar panel de combate
            setTimeout(() => {
                hideCombatPanel();
                updatePlayerUI();
                updateStatsUI();

            }, 1500);
            break;
    }
}

// Maneja el reinicio del juego
async function handleRestart() {
    // Reiniciar juego en el servidor
    const result = await restartGame();
    if (!result) return;
    
    // Actualizar datos del jugador
    gameState.player = result.player;
    gameState.playerStats = result.stats;
    
    // Ocultar modal
    elements.gameOverModal.classList.add('hidden');
    
    // Ocultar panel de combate
    hideCombatPanel();
    
    // Actualizar UI
    updatePlayerUI();
    updateStatsUI();
    renderMap();
    
    // Reiniciar estado de combate
    gameState.inCombat = false;
    gameState.currentEnemy = null;
    
    // Añadir mensaje al log
    addToGameLog('¡Juego reiniciado! Una nueva aventura comienza.');
}

// Simula una tirada de dados
function rollDice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Habilita/deshabilita los botones de acción
function setActionButtonsEnabled(enabled) {
    elements.btnAttack.disabled = !enabled;
    elements.btnFlee.disabled = !enabled;
}

// Añade un mensaje al log de aventura
function addToGameLog(message) {
    const logElement = document.createElement('p');
    logElement.textContent = message;
    elements.adventureLog.insertBefore(logElement, elements.adventureLog.firstChild);
}

// Añade un mensaje al log de combate
function addToCombatLog(message) {
    const logElement = document.createElement('p');
    logElement.textContent = message;
    elements.combatLog.appendChild(logElement);
    
    // Auto-scroll al final
    elements.combatLog.scrollTop = elements.combatLog.scrollHeight;
}

// Iniciar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initGame);