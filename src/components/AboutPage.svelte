<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let aboutText: string = "Welcome to Cellular Domination Station! This game is inspired by Conway's Game of Life, a cellular automaton simulation. Watch as cells evolve based on simple rules, creating complex patterns and behaviors. Enjoy the mesmerizing dance of life and death on a microscopic scale!";
    
    function closeAbout() {
        dispatch('closeAbout');
    }
    </script>
    
    <div class="about-page">
        <h2>About the Game</h2>
        <p>{aboutText}</p>
        <button on:click={closeAbout}>Back to Menu</button>
    </div>
    
    <style>
    .about-page {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(10, 14, 23, 0.9);
        color: #00ff00;
        font-family: 'VT323', monospace;
        padding: 20px;
        box-sizing: border-box;
    }
    
    h2 {
        font-size: 2.5rem;
        margin-bottom: 20px;
    }
    
    p {
        font-size: 1.2rem;
        max-width: 600px;
        text-align: center;
        line-height: 1.6;
        margin-bottom: 30px;
    }
    
    button {
        font-size: 1.2rem;
        padding: 10px 20px;
        background: transparent;
        border: 2px solid #00ff00;
        color: #00ff00;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'VT323', monospace;
    }
    
    button:hover {
        background: #00ff00;
        color: #0a0e17;
    }
    </style>