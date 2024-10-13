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

    let isSimulationRunning = false;
    let cellCount = 0;
    let stableCount = 0;
    let remainingCells = 10;

    onMount(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        phaserRef.game = StartGame("game-container", width, height);

        EventBus.on('current-scene-ready', (scene_instance: Scene) => {
            phaserRef.scene = scene_instance;
            if(currentActiveScene) {
                currentActiveScene(scene_instance);
            }
            showMainMenu = scene_instance.scene.key === 'MainMenu';
            showGameUI = scene_instance.scene.key === 'Game';
        });

        EventBus.on('simulation-toggled', (running: boolean) => {
            isSimulationRunning = running;
        });

        EventBus.on('stats-updated', (stats: { cellCount: number, stableCount: number, remainingCells: number }) => {
            cellCount = stats.cellCount;
            stableCount = stats.stableCount;
            remainingCells = stats.remainingCells;
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

    function handleToggleSimulation() {
        if (phaserRef.scene) {
            (phaserRef.scene as any).toggleSimulation();
        }
    }

    function handleResetGame() {
        if (phaserRef.scene) {
            (phaserRef.scene as any).resetGame();
        }
    }

    function handleReturnToMenu() {
        if (phaserRef.game) {
            phaserRef.game.scene.start('MainMenu');
            showGameUI = false;
            showMainMenu = true;
        }
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
        {cellCount}
        {stableCount}
        {remainingCells}
        on:toggleSimulation={handleToggleSimulation}
        on:resetGame={handleResetGame}
        on:returnToMenu={handleReturnToMenu}
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
