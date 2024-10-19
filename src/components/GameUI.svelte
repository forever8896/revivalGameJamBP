<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
    import { EventBus } from '../game/EventBus';
    import { structures } from '../game/structures';
    import Minimap from './Minimap.svelte';
    import { getContext } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let generationCount: number = 0;
    export let remainingCells: number;
    export let pulsarCount: number = 0;
    let showInstructions = false;
    let isGameOver = false;
    let selectedStructure: string | null = null;
    let showRotationInstructions = false;
    let isMusicPlaying = false;
    let gameSpeed: number = 50;
    const speedLabels: { [key: number]: string } = {
        50: "Fast",
        100: "Regular",
        200: "Chillout"
    };
    let currentRoundGeneration: number = 0;
    let generationsPerRound: number = 50;
    let isRoundActive: boolean = false;
    let isRoundTransitioning: boolean = false;

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
            console.log("Game reset event received"); // Add this line for debugging
            isGameOver = false;
            selectedStructure = null;
            showRotationInstructions = false;
            isRoundActive = false;
            isRoundTransitioning = false;
            currentRoundGeneration = 0;
        });

        EventBus.on('music-state-changed', (state: boolean) => {
            isMusicPlaying = state;
        });

        EventBus.on('update-game-speed', (speed: number) => {
            gameSpeed = speed;
        });

        EventBus.on('round-status-changed', (status: boolean) => {
            if (status) {
                // Round is starting
                isRoundTransitioning = true;
                setTimeout(() => {
                    currentRoundGeneration = 0;
                    isRoundActive = true;
                    isRoundTransitioning = false;
                }, 50); // Small delay to ensure the progress bar resets visually
            } else {
                // Round is ending
                isRoundActive = false;
            }
        });

        EventBus.on('stats-updated', (stats: any) => {
            if (!isRoundTransitioning) {
                generationCount = stats.generationCount;
                remainingCells = stats.remainingCells;
                pulsarCount = stats.pulsarCount;
                currentRoundGeneration = stats.currentRoundGeneration;
                generationsPerRound = stats.generationsPerRound;
            }
        });

    });
    
    function startRound() {
        EventBus.emit('toggleSimulation');
    }
    
    function resetGame() {
        console.log("Reset game button clicked"); // Add this line for debugging
        EventBus.emit('resetGame');
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

    // Add this function to handle structure deselection
    function handleStructureDeselected() {
        selectedStructure = null;
    }

    function updateGameSpeed() {
        EventBus.emit('update-game-speed', gameSpeed);
    }

    function getSpeedLabel(speed: number): string {
        return speedLabels[speed] || speed.toString();
    }

    $: roundProgress = isRoundTransitioning ? 0 : (currentRoundGeneration / generationsPerRound) * 100;
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
        {:else if isRoundActive || isRoundTransitioning}
            <div class="round-progress">
                <h3>Round Progress</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {roundProgress}%"></div>
                </div>
                <div class="progress-text">
                    {isRoundTransitioning ? 0 : currentRoundGeneration} / {generationsPerRound} Generations
                </div>
            </div>
        {:else}
            <button class="control-button" on:click={startRound}>
                Start Round
            </button>
        {/if}
        <button class="control-button" on:click={resetGame}>🔄 Reset Game</button>
        <button class="control-button" on:click={returnToMenu}>🏠 Return to Menu</button>
        <button class="control-button" on:click={toggleInstructions}>
            ℹ️ Show Instructions
        </button>
        <button class="control-button" on:click={toggleMusic}>
            {isMusicPlaying ? '🔇 Stop Music' : '🎵 Play Music'}
        </button>
    </div>
    <div class="speed-control">
        <label for="speed-slider">Game Speed: {getSpeedLabel(gameSpeed)}</label>
        <input 
            type="range" 
            id="speed-slider" 
            min="50" 
            max="200" 
            step="50" 
            bind:value={gameSpeed} 
            on:change={updateGameSpeed}
        >
    </div>
    {#if showInstructions}
        <div class="instructions-overlay">
            <div class="instructions-window">
                <button class="close-button" on:click={toggleInstructions}>×</button>
                <h2>Game Rules</h2>
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
        </div>
    {/if}
    {#if showRotationInstructions}
        <div class="rotation-instructions">
            <p>Press Q to rotate left</p>
            <p>Press E to rotate right</p>
            <p>Press C to deselect structure</p>
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

.instructions-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.instructions-window {
    background-color: #000;
    border: 2px solid #00ff00;
    border-radius: 10px;
    padding: 20px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    position: relative;
    color: #00ff00;
    font-family: 'VT323', monospace;
}

.instructions-window h2 {
    text-align: center;
    margin-bottom: 20px;
}

.instructions-window ul {
    padding-left: 20px;
}

.instructions-window li {
    margin-bottom: 10px;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #00ff00;
    font-size: 24px;
    cursor: pointer;
}

.close-button:hover {
    color: #ff0000;
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

/* Add this style for selected structures */
.selected {
    background-color: #4CAF50;
    color: white;
}

.speed-control {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.speed-control label {
    margin-bottom: 10px;
}

.speed-control input[type="range"] {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(0, 255, 0, 0.2);
    outline: none;
    opacity: 0.7;
    transition: opacity .2s;
}

.speed-control input[type="range"]:hover {
    opacity: 1;
}

.round-progress {
    margin-top: 20px;
    background: rgba(0, 255, 0, 0.1);
    padding: 10px;
    border-radius: 5px;
}

.round-progress h3 {
    margin: 0 0 10px 0;
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background-color: rgba(0, 255, 0, 0.2);
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: #00ff00;
    transition: width 0.3s ease-in-out;
}

.progress-text {
    text-align: center;
    margin-top: 5px;
    font-size: 0.9em;
}

</style>




