<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
  
    
    function closeAbout() {
        dispatch('closeAbout');
    }
    </script>
    
    <div class="about-page">
        <h2>About the Game</h2>
        <p>Cellular Domination Station is a game inspired by Conway's Game of Life, a cellular automaton simulation.</p>
        <p>Ever since I first heard about the Game of Life, I've been fascinated by the complexity that can arise from simple rules.</p>
        <p>There is this fascinating <a target="_blank" href="https://youtu.be/xP5-iIeKXE8">video</a> showing the game of life inside of the game of life, creating a perfect loop of existence.</p>
        <p>There is something spiritual about the concept of rules, and how even the smallest amount of order can create infinite complexity.</p>
        <p>I hope you enjoy playing this game, and that it allows you to discover a bit of the beauty of the Game of Life.</p>
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
        background-color: black;
        color: #00ff00;
        font-family: 'VT323', monospace;
        padding: 20px;
        box-sizing: border-box;
    }
    
    h2 {
        font-size: 2.5rem;
        margin-bottom: 10px;
    }
    
    p {
        font-size: 1.2rem;
        max-width: 600px;
        text-align: center;
        line-height: 1.6;
        margin-bottom: 10px;
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


    a {
        color: #9900ff;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
    </style>