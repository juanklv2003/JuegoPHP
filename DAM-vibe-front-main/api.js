/**
 * API.js - Funciones para comunicarse con la API PHP/MySQL
 */

// Configura la URL base de la API - cambia esto según tu configuración
const API_BASE_URL = 'http://localhost/DAM-vibe-php-main';

/**
 * Función para manejar errores de la API
 */
function handleApiError(error) {
    console.error('Error en la API:', error);
    addToGameLog('¡Error al comunicarse con el servidor!');
    return null;
}

/**
 * Obtiene los datos del jugador
 */
async function fetchPlayerData() {
    try {
        const response = await fetch(`${API_BASE_URL}/player`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener datos del jugador');
        return await response.json();
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Obtiene las estadísticas del jugador
 */
async function fetchPlayerStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/player/stats`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener estadísticas');
        return await response.json();
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Obtiene el mapa del juego
 */
async function fetchGameMap() {
    try {
        const response = await fetch(`${API_BASE_URL}/map`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener el mapa');
        return await response.json();
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Mueve al jugador en el mapa
 * @param {string} direction - 'up', 'down', 'left', 'right'
 */
async function movePlayer(direction) {
    try {
        const response = await fetch(`${API_BASE_URL}/player/move`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ direction })
        });
        
        if (!response.ok) throw new Error('Error al mover al jugador');
        return await response.json();
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Inicia un combate basado en la posición actual
 */
async function startCombat() {
    try {
        const response = await fetch(`${API_BASE_URL}/combat/start`, {
            method: 'POST',
            credentials: 'include',
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || 'Error al iniciar combate';
            addToGameLog(`Error: ${errorMessage}`);
            console.error('Error al iniciar combate:', errorData);
            return null;
        }
        
        const data = await response.json();
        
        // Guardar el ID de combate en el estado del juego
        if (data.combat_id) {
            gameState.currentCombatId = data.combat_id;
            console.log('Combat ID guardado:', gameState.currentCombatId);
        }
        
        return data;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Realiza un ataque en combate
 */
async function attackEnemy() {
    try {
        const response = await fetch(`${API_BASE_URL}/combat/attack`, {
            method: 'POST',
            credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Error al atacar');
        return await response.json();
    } catch (error) {
        return handleApiError(error);
    }
}


/**
 * Intenta huir del combate
 */
async function fleeCombat() {
    try {
        const response = await fetch(`${API_BASE_URL}/combat/flee`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        // Intentar obtener la respuesta como JSON
        const data = await response.json().catch(e => ({ 
            error: true, 
            message: "No se pudo procesar la respuesta del servidor" 
        }));
        
        // Si la respuesta no fue exitosa, mostrar el mensaje de error
        if (!response.ok) {
            const errorMessage = data.message || data.error || `Error ${response.status} al intentar huir`;
            addToCombatLog(`Error: ${errorMessage}`);
            addToGameLog(`Error: ${errorMessage}`);
            console.error('Error al huir:', response.status, data);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error en fleeCombat:', error);
        addToGameLog('Error de conexión al intentar huir.');
        return null;
    }
}

/**
 * Finaliza el combate y procesa resultados
 * @param {string} result - 'win', 'lose', 'flee'
 */
async function endCombat(result) {
    try {
        const response = await fetch(`${API_BASE_URL}/combat/end`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ result })
        });
        
        if (!response.ok) throw new Error('Error al finalizar combate');
        return await response.json();
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Reinicia el juego
 */
async function restartGame() {
    try {
        const response = await fetch(`${API_BASE_URL}/game/restart`, {
            method: 'POST',
            credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Error al reiniciar el juego');
        return await response.json();
    } catch (error) {
        return handleApiError(error);
    }
}