<script lang="ts">
    import { structures } from '../game/structures';
    export let activeTab: string;
</script>

<div class="tab-content custom-scrollbar">
    {#if activeTab === 'basics'}
        <h3>Basics</h3>
        <ul>
            <li>Press SPACE to start the simulation.</li>
            <li>Every 50 generations, the game stops and you can build structures.</li>
            <li>You can place structures by clicking on them in the bottom panel.</li>
            <li>Every structure you place costs you the amount of cells shown at the bottom.</li>
        </ul>
    {:else if activeTab === 'structures'}
        <h3>Structures</h3>
        <ul>
            <li>Use generated cells to build structures from the bottom panel.</li>
            <li>Different structures have different costs and behaviors.</li>
            <li>Gliders and LWSS are the most useful structures, as they fly in predictable patterns.</li>
            <li>Use the C Key to deselect a structure.</li>
        </ul>
        <h4>Available Structures:</h4>
        <div class="structures-list">
            {#each Object.entries(structures) as [name, structure]}
                <div class="structure-item">
                    <h5>{name}</h5>
                    <div class="structure-grid" style="grid-template-columns: repeat({structure[0].length}, 1fr);">
                        {#each structure.flat() as cell}
                            <div class="cell" class:alive={cell}></div>
                        {/each}
                    </div>
                    <div class="structure-description">
                        {#if name === 'Glider'}
                            <p>A small, lightweight spaceship that moves diagonally across the grid.</p>
                            <p>Use the Q and E keys to rotate it, the arrow drawn shows its direction</p>
                        {:else if name === 'LWSS'}
                            <p>Lightweight spaceship that moves horizontally or vertically across the grid.</p>
                            <p>Use the Q and E keys to rotate it, the arrow drawn shows its direction</p>
                            

                        {:else if name === 'Block'}
                            <p>A still life structure that doesn't change over generations.</p>
                        {:else if name === 'Blinker'}
                            <p>An oscillator that alternates between two states.</p>
                        {:else if name === 'Pulsar'}
                            <p>The only structure that you can place anywhere, outside of the influence area. It generates 1 cell every 15 generations, and represents your life.</p>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {:else if activeTab === 'enemies'}
        <h3>Enemies</h3>
        <ul>
            <li>Red enemy snakes are emerging, trying to destroy your base.</li>
            <li>Protect your pulsars and structures from the snakes.</li>
            <li>Use strategic placement of structures to defend against enemies.</li>
            <li>Upon contact with a cell, a snake turns into game of life cells.</li>
            <li>Destroying a snake gives you 10 cells.</li>
            <li>Use the chaotic cells as your defense.</li>
        </ul>
    {:else if activeTab === 'tips'}
        <h3>Tips</h3>
        <ul>
            <li>Balance between expanding your territory and defending against enemies.</li>
            <li>Keep an eye on your cell count and use them wisely.</li>
            <li>Try to create self-sustaining patterns that can grow and replicate.</li>
        </ul>
    {:else if activeTab === 'chaos'}
        <h3>Chaos Mode</h3>
        <ul>
            <li>When time is stopped, you can place individual cells, not just structures.</li>
            <li>You can experiment with the chaos this creates.</li>
            <li>Discover the game of life through this game, and good luck!</li>
        </ul>
    {/if}
</div>

<style>
    .tab-content {
        font-size: 1.4rem;
        line-height: 1.6;
        max-height: 60vh; /* Adjust this value as needed */
        overflow-y: auto;
        padding-right: 15px; /* Add some padding to prevent content from touching the scrollbar */
    }

    h3 {
        margin-top: 0;
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    h4 {
        font-size: 1.8rem;
        margin-top: 2rem;
        margin-bottom: 1rem;
    }

    h5 {
        font-size: 1.6rem;
        margin-bottom: 0.5rem;
        text-align: center;
    }

    ul {
        padding-left: 1.5rem;
    }

    li {
        margin-bottom: 1rem;
    }

    .structures-list {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        align-items: center;
    }

    .structure-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 300px;
    }

    .structure-grid {
        display: grid;
        gap: 1px;
        background-color: #333;
        padding: 1px;
        border-radius: 4px;
        margin: 1rem 0;
    }

    .cell {
        width: 15px;
        height: 15px;
        background-color: #111;
        border-radius: 2px;
    }

    .cell.alive {
        background-color: #00ff00;
    }

    .structure-description {
        text-align: center;
    }

    /* Custom scrollbar styles */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #00ff00 #000000;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: #000000;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #00ff00;
        border-radius: 4px;
        border: 2px solid #000000;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #00cc00;
    }
</style>
