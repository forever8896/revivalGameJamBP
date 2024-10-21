<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    function closeCredits() {
        dispatch('closeCredits');
    }
</script>

<div class="credits-page">
    <div class="credits-content">
        <h2>Credits</h2>
        <div class="credits-text">
            <p>Phew, this will be a long list!</p>
            <p>I want to thank John Conway for inventing the Game of Life.</p>
            <p>I need to thank Dylan Beattie for making me aware of the Game of Life, through his amazing talk <a target="_blank" href="https://youtu.be/6avJHaC3C2U">"The art of code"</a></p>
            <p>I have to thank the LifeWiki for the amazing information about the Game of Life. You can find it <a target="_blank" href="https://conwaylife.com/wiki/">here</a>.</p>
            <p>I want to thank the <a target="_blank" href="https://societyofplay.net/">Society of Play</a> community for organizing this game jam, and for the community they create that has helped me to get this game made.</p>
            <p>Big thanks to ZapSplat for the amazing music. You can find the amazing music in the game <a target="_blank" href="https://www.zapsplat.com/music/game-music-action-urban-groove-electro-breakbeat-with-a-funky-electronic-bass-and-record-scratching/">here</a>.</p>
            <p>Thanks for the existence of jsfxr that has allowed me to generate amazing 8bit sounds. You can find it <a target="_blank" href="https://sfxr.me/">here</a>.</p>
            <p>And most of all, I thank myself for the commitment to finish this game.</p>
            <img src="/assets/meme.webp" alt="Me" />
        </div>

        <div class="credits-footer">
            <p>Made with ♡ by <a target="_blank" href="https://brianpistar.dev">Brian Pistar</a></p>
            <p>Music by <a target="_blank" href="https://www.zapsplat.com">ZapSplat</a></p>
            <p>Made with <a target="_blank" href="https://phaser.io/">Phaser</a> and <a target="_blank" href="https://svelte.dev/">Svelte</a></p>
            <p>font used is <a target="_blank" href="https://fonts.google.com/specimen/VT323">VT323</a></p>
        </div>
        <button on:click={closeCredits}>Back to Menu</button>
    </div>
</div>

<style>
    .credits-page {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'VT323', monospace;
        color: #00ff00;
    }

    .credits-content {
        max-width: 800px;
        width: 90%;
        height: 90%;
        padding: 20px;
        background-color: rgba(10, 14, 23, 0.9);
        border: 2px solid #00ff00;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        text-align: center;
    }

    h2 {
        font-size: 3rem;
        margin-bottom: 20px;
    }

    .credits-text {
        flex-grow: 1;
        overflow-y: auto;
        width: 100%;
        padding: 0 10px;
    }

    p {
        font-size: 1.2rem;
        line-height: 1.5;
        margin-bottom: 15px;
    }

    a {
        color: #9900ff; /* This is a purple color */
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }

    button {
        font-size: 1.4rem;
        padding: 10px 20px;
        background: transparent;
        border: 2px solid #00ff00;
        color: #00ff00;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'VT323', monospace;
        margin-top: 20px;
    }

    button:hover {
        background: #00ff00;
        color: #0a0e17;
    }

    .credits-footer {
        font-size: 1rem;
        border-top: 2px solid #9900ff;
        width: 100%;
    }

    .credits-footer p {
        margin-bottom: 5px;
    }


    img {
        width: 30%;
        height: auto;
        margin-top: 20px;
    }

   

  

    /* Scrollbar styles */
    .credits-text::-webkit-scrollbar {
        width: 8px;
    }

    .credits-text::-webkit-scrollbar-track {
        background: rgba(0, 255, 0, 0.1);
    }

    .credits-text::-webkit-scrollbar-thumb {
        background-color: #00ff00;
        border-radius: 4px;
    }
</style>
