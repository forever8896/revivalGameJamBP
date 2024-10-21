<script context="module" lang="ts">

    import type { Game, Scene } from "phaser";

    export type TPhaserRef = {
        game: Game | null,
        scene: Scene | null
    };

</script>

<script lang="ts">

    import { onMount, onDestroy } from 'svelte';
    import StartGame from "./main";
    import { EventBus } from './EventBus';
    import MainMenuUI from '../components/MainMenuUI.svelte';
    import AboutPage from '../components/AboutPage.svelte';
    import GameUI from '../components/GameUI.svelte';
    import CreditsPage from "../components/CreditsPage.svelte";

    export let phaserRef: TPhaserRef = {
        game: null,
        scene: null
    };

    export let currentActiveScene: (scene: Scene) => void | undefined;

    let showAboutPage = false;
    let showCreditsPage = false;

    // Add these variables to hold the state
    let isSimulationRunning = false;
    let generationCount = 0;
    let remainingCells = 0;
    let pulsarCount = 0;

    let activeScene: string = 'MainMenu';

    $: console.log("Active scene changed to:", activeScene);



    onMount(() => {
        phaserRef.game = StartGame("game-container");

        EventBus.on('current-scene-ready', (scene_instance: Scene) => {
            console.log(`Current scene ready: ${scene_instance.scene.key}`);
            phaserRef.scene = scene_instance;
            if(currentActiveScene) {
                currentActiveScene(scene_instance);
            }
            activeScene = scene_instance.scene.key;
            console.log("Active scene updated to:", activeScene);
        });

        // Add listeners to update the state
        EventBus.on('simulation-toggled', (running: boolean) => {
            isSimulationRunning = running;
        });

        EventBus.on('stats-updated', (stats: { 
            generationCount: number; 
            remainingCells: number; 
            pulsarCount: number;
        }) => {
            generationCount = stats.generationCount;
            remainingCells = stats.remainingCells;
            pulsarCount = stats.pulsarCount;
        });

        EventBus.on('returnToMenu', handleCloseGame);
       

        // Cleanup on destroy
        onDestroy(() => {
            EventBus.off('current-scene-ready', () => {});
            EventBus.off('returnToMenu', handleCloseGame);
            // ... any other cleanup ...
        });
    });

    function handleStartGame() {
        EventBus.emit('startGame');
        activeScene = 'Game';  // Update activeScene when starting the game
    }

    function handleShowAbout() {
        showAboutPage = true;
    }

    function handleShowCredits() {
        showCreditsPage = true;
    }

    function handleCloseAbout() {
        showAboutPage = false;
    }

    function handleCloseGame() {
        EventBus.emit("returnToMenu");
        activeScene = "MainMenu";
    }


    function handleCloseCredits() {
        showCreditsPage = false;
    }


</script>

<div id="game-container"></div>
{#if activeScene === 'MainMenu'}
    <MainMenuUI on:startGame={handleStartGame} on:showAbout={handleShowAbout} on:showCredits={handleShowCredits} />
{:else if activeScene === 'Game'}
    <GameUI on:closeGame={handleCloseGame}
        {generationCount}
        {remainingCells}
        {pulsarCount}
    />
{/if}
{#if showAboutPage}
    <AboutPage on:closeAbout={handleCloseAbout} />
{/if}
{#if showCreditsPage}
    <CreditsPage on:closeCredits={handleCloseCredits} />
{/if}
<style>
    #game-container {
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
