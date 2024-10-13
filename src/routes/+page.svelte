<script lang="ts">
    import type { Scene } from "phaser";
    import type { MainMenu } from "../game/scenes/MainMenu";
    import PhaserGame, { type TPhaserRef } from "../game/PhaserGame.svelte";

    let phaserRef: TPhaserRef = { game: null, scene: null};
    const spritePosition = { x: 0, y: 0 };

    const currentScene = (scene: Scene) => {
        // You can use this to handle scene changes if needed
    }
</script>

<div id="app">
    <PhaserGame bind:phaserRef={phaserRef} currentActiveScene={currentScene} />
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
    
    #app {
        width: 100%;
        height: 100vh;
        overflow: hidden;
        background-color: #000000;
    }
</style>
