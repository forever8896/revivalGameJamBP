<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
    import { EventBus } from '../game/EventBus';
    import { structures } from '../game/structures';
    import Minimap from './Minimap.svelte';
    import { getContext } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let isSimulationRunning: boolean = false;
    export let generationCount: number = 0;
    export let remainingCells: number;
    export let pulsarCount: number = 0;
    let showInstructions = false;
    let isGameOver = false;
    let selectedStructure: string | null = null;
    let showRotationInstructions = false;
    let isMusicPlaying = false;
    
    onMount(() => {
        EventBus.on('game-over', () => {
            isGameOver = true;
        });


        EventBus.on('structure-deselected', () => {
            selectedStructure = null;
            showRotationInstructions = false;
        });

        // Add this listener to reset the game over state
        EventBus.on('game-reset', () => {
            isGameOver = false;
        });

        EventBus.on('music-state-changed', (state: boolean) => {
            isMusicPlaying = state;
        });

       

    });
    
    function toggleSimulation() {
        EventBus.emit('toggleSimulation');
    }
    
    function resetGame() {
        EventBus.emit('resetGame');
        isGameOver = false;
    }
    
    function returnToMenu() {
        EventBus.emit('returnToMenu');
    }
    
    function toggleInstructions() {
        showInstructions = !showInstructions;
    }
    
    function selectStructure(structureName: string) {
        if (selectedStructure === structureName) {
            selectedStructure = null;
            EventBus.emit('structure-selected', null);
            showRotationInstructions = false;
        } else {
            selectedStructure = structureName;
            EventBus.emit('structure-selected', structureName);
            showRotationInstructions = true;
        }
    }

    function getStructureCost(structure: boolean[][]): number {
        return structure.flat().filter(cell => cell).length;
    }

    $: canPlaceStructure = (structure: boolean[][]) => {
        const cost = getStructureCost(structure);
        return remainingCells >= cost;
    };

    function toggleMusic() {
        EventBus.emit('toggle-music');
    }
</script>

<div class="game-ui">
    <div class="stats">
        <div class="stat-item important">
            <span class="stat-label">Generations: 🕒</span>
            <span class="stat-value">{generationCount}</span>
        </div>
        <div class="stat-item important">
            <span class="stat-label">Cells: 💰</span>
            <span class="stat-value">{remainingCells}</span>
        </div>
        <div class="stat-item important">
            <span class="stat-label">Pulsars: ❤️</span>
            <span class="stat-value">{pulsarCount}</span>
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
        <button class="control-button" on:click={toggleMusic}>
            {isMusicPlaying ? '🔇 Stop Music' : '🎵 Play Music'}
        </button>
    </div>
    {#if showInstructions}
        <div class="instructions">
            <h3>Game Rules:</h3>
            <ul>
                <li>Press SPACE to toggle simulation on and off.</li>
                <li>The game starts with 3 pulsars, as your base.</li>
                <li>Every pulsar generates 1 cell every 15 generations.</li>
                <li>You start with 100 cells.</li>
                <li>Use generated cells to build structures from the bottom panel.</li>
                <li>Red enemy snakes are emerging, trying to destroy your base.</li>
                <li>Good luck</li>
            </ul>
        </div>
    {/if}
    {#if showRotationInstructions}
        <div class="rotation-instructions">
            <p>Press Q to rotate left</p>
            <p>Press E to rotate right</p>
        </div>
    {/if}
</div>

<div class="structure-panel">
    <div class="structure-buttons">
        {#each Object.entries(structures) as [name, structure]}
            {@const canPlace = canPlaceStructure(structure)}
            <div class="structure-item">
                <button
                    class="structure-button"
                    class:selected={selectedStructure === name}
                    class:can-place={canPlace}
                    class:cannot-place={!canPlace}
                    on:click={() => selectStructure(name)}
                    disabled={!canPlace}
                >
                    {name}
                </button>
                <div class="structure-cost">Cost: {getStructureCost(structure)}</div>
            </div>
        {/each}
    </div>
    {#if selectedStructure}
        <div class="selected-structure">
            Selected: {selectedStructure}
        </div>
    {/if}
</div>

<Minimap size={200}/>

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
    max-width: 400px; /* Adjust as needed */
}

.stats {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    border-radius: 5px;
    background: rgba(0, 255, 0, 0.1);
}

.stat-item.important {
    background: rgba(0, 255, 0, 0.2);
    border: 2px solid #00ff00;
    font-size: 1.3rem;
}

.stat-label {
    font-size: 1.2rem;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: bold;
}

.stat-item.important .stat-label,
.stat-item.important .stat-value {
    font-size: 1.4rem;
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

.rotation-instructions {
    margin-top: 10px;
    font-size: 0.9rem;
    text-align: center;
}

.structure-panel {
    position: absolute;
    bottom: 10px; 
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    padding: 10px; 
    border-radius: 10px; 
    font-family: 'VT323', monospace;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.7); 
    width: 90%; 
    max-width: 600px; 
    border: 1px solid #00ff00; 
    font-size: 1.2rem; 
}

.structure-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px; 
    justify-content: center;
    padding-bottom: 10px;
    font-size: 1.5rem; 
}

.structure-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0 0 auto;
    background: rgba(0, 255, 0, 0.1);
    padding: 5px;
    border-radius: 5px;
    transition: all 0.3s ease;
}

.structure-item:hover {
    background: rgba(0, 255, 0, 0.2);
    transform: translateY(-5px);
}

.structure-button {
    background: rgba(255, 0, 0, 0.3); /* Default to red (cannot place) */
    border: 1px solid #ff0000; 
    color: #ff0000;
    padding: 3px 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.8rem; 
    font-family: 'VT323', monospace;
    border-radius: 3px;
    width: 80px;
    height: 30px;
}

.structure-button.can-place {
    background: rgba(0, 255, 0, 0.3);
    border-color: #00ff00;
    color: #00ff00;
}

.structure-button:hover:not(:disabled), .structure-button.selected {
    background: rgba(0, 255, 0, 0.4);
    transform: translateY(-2px);
}

.structure-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.structure-cost {
    margin-top: 5px;
    font-size: 0.8rem;
}

.selected-structure {
    margin-top: 10px;
    text-align: center;
    font-weight: bold;
}

</style>
