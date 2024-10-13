<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
    import { EventBus } from '../game/EventBus';
    
    const dispatch = createEventDispatcher();
    
    export let isSimulationRunning: boolean = false;
    export let cellCount: number = 0;
    export let stableCount: number = 0;
    export let remainingCells: number = 10;
    let showInstructions = false;
    let isGameOver = false;

    onMount(() => {
        EventBus.on('game-over', () => {
            isGameOver = true;
        });

        // Add this listener to reset the game over state
        EventBus.on('game-reset', () => {
            isGameOver = false;
        });
    });
    
    function toggleSimulation() {
        dispatch('toggleSimulation');
    }
    
    function resetGame() {
        dispatch('resetGame');
        isGameOver = false; // Reset the game over state here as well
    }
    
    function returnToMenu() {
        dispatch('returnToMenu');
    }
    
    function toggleInstructions() {
        showInstructions = !showInstructions;
    }
</script>

<div class="game-ui">
    <div class="stats">
        <div class="stat-item">
            <span class="stat-label">Cells:</span>
            <span class="stat-value">{cellCount}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Stable Structures:</span>
            <span class="stat-value">{stableCount}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Remaining Cells:</span>
            <span class="stat-value">{remainingCells}</span>
        </div>
    </div>
    <div class="controls">
        {#if isGameOver}
            <div class="game-over">Game Over!</div>
            <button class="control-button" on:click={resetGame}>🔄 New Game</button>
        {:else}
            <button class="control-button" on:click={toggleSimulation}>
                {isSimulationRunning ? '⏹️ Stop' : '▶️ Start'} Simulation
            </button>
            <button class="control-button" on:click={resetGame}>🔄 Reset Game</button>
        {/if}
        <button class="control-button" on:click={returnToMenu}>🏠 Return to Menu</button>
        <button class="control-button" on:click={toggleInstructions}>
            ℹ️ {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
    </div>
    {#if showInstructions}
        <div class="instructions">
            <h3>Game Rules:</h3>
            <ul>
                <li>Green cells are newly placed or unstable cells.</li>
                <li>Orange cells are stable structures (stable for 10+ generations).</li>
                <li>You can only remove orange cells to gain more placeable cells.</li>
                <li>Create stable structures to increase your available cells!</li>
            </ul>
        </div>
    {/if}
</div>

<style>
.game-ui {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 20px;
    border-radius: 10px;
    font-family: 'VT323', monospace;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    min-width: 250px;
}

.stats {
    margin-bottom: 20px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.stat-label {
    font-size: 1.2rem;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: bold;
}

.controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.control-button {
    background: rgba(0, 255, 0, 0.2);
    border: 2px solid #00ff00;
    color: #00ff00;
    padding: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.1rem;
    font-family: 'VT323', monospace;
    text-align: left;
    border-radius: 5px;
}

.control-button:hover {
    background: rgba(0, 255, 0, 0.4);
    transform: translateY(-2px);
}

.control-button:active {
    transform: translateY(0);
}

.instructions {
    margin-top: 20px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 5px;
}

.instructions h3 {
    margin-top: 0;
    margin-bottom: 10px;
}

.instructions ul {
    padding-left: 20px;
    margin: 0;
}

.instructions li {
    margin-bottom: 5px;
}

.game-over {
    font-size: 1.5rem;
    color: #ff0000;
    text-align: center;
    margin-bottom: 10px;
}
</style>
