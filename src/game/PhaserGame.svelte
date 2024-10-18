<script context="module" lang="ts">

    import type { Game, Scene } from "phaser";

    export type TPhaserRef = {
        game: Game | null,
        scene: Scene | null
    };

</script>

<script lang="ts">

    import { onMount } from "svelte";
    import StartGame from "./main";
    import { EventBus } from './EventBus';
    import MainMenuUI from '../components/MainMenuUI.svelte';
    import AboutPage from '../components/AboutPage.svelte';
    import GameUI from '../components/GameUI.svelte';

    export let phaserRef: TPhaserRef = {
        game: null,
        scene: null
    };

    export let currentActiveScene: (scene: Scene) => void | undefined;

    let showMainMenu = true;
    let showAboutPage = false;
    let showGameUI = false;

    // Add these variables to hold the state
    let isSimulationRunning = false;
    let generationCount = 0;
    let remainingCells = 0;
    let pulsarCount = 0;

    onMount(() => {
        phaserRef.game = StartGame("game-container");
        const width = window.innerWidth;
        const height = window.innerHeight;

        EventBus.on('current-scene-ready', (scene_instance: Scene) => {
            phaserRef.scene = scene_instance;
            if(currentActiveScene) {
                currentActiveScene(scene_instance);
            }
            showMainMenu = scene_instance.scene.key === 'MainMenu';
            showGameUI = scene_instance.scene.key === 'Game';
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
    });

    function handleStartGame() {
        EventBus.emit('startGame');
        showMainMenu = false;
        showGameUI = true;
    }

    function handleShowAbout() {
        showAboutPage = true;
        showMainMenu = false;
    }

    function handleCloseAbout() {
        showAboutPage = false;
        showMainMenu = true;
    }
</script>

<div id="game-container"></div>
{#if showMainMenu}
    <MainMenuUI on:startGame={handleStartGame} on:showAbout={handleShowAbout} />
{/if}
{#if showAboutPage}
    <AboutPage on:closeAbout={handleCloseAbout} />
{/if}
{#if showGameUI}
    <GameUI 
        {isSimulationRunning}
        {generationCount}
        {remainingCells}
        {pulsarCount}
    />
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
