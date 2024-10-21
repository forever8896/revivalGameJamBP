<script lang="ts">
    import { createEventDispatcher } from 'svelte';
 
    
    const dispatch = createEventDispatcher();
    
    export let title: string = 'Cellular Domination Station';
    export let buttonText: string = 'Start Game';
    export let aboutText: string = '𓆩♡𓆪About the soul of the game𓆩♡𓆪';
    export let creditsText: string = '𓆩♡𓆪Credits𓆩♡𓆪';
    function startGame() {
        dispatch('startGame');
    }

    function showAbout() {
        dispatch('showAbout');
    }
    function showCredits() {
        dispatch('showCredits');
    }
    </script>
    
    <div class="main-menu">
        <h1>{title}</h1>
        <button on:click={startGame}>{buttonText}</button>
        <button on:click={showAbout} class="about-button">{aboutText}</button>
        <button on:click={showCredits} class="credits-button">{creditsText}</button>
    </div>
    
    <style>
    .main-menu {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #00ff00;
        font-family: 'VT323', monospace;
    }
    
    h1 {
        font-size: 3rem;
        text-align: center;
        animation: float 2s ease-in-out infinite;
    }
    
    button {
        font-size: 1.5rem;
        padding: 10px 20px;
        background: transparent;
        border: 2px solid #00ff00;
        color: #00ff00;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'VT323', monospace;
        animation: float 2s ease-in-out infinite;


    }
    
    button:hover {
        background: #00ff00;
        color: #0a0e17;
    }




    .about-button {
        margin-top: 80px;
        animation: none;
    }


    .credits-button {
        margin-top: 80px;
        animation: wiggle 2s ease-in-out infinite;
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    @keyframes wiggle {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(10deg); }
    }
    </style>