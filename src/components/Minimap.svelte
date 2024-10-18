<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { EventBus } from '../game/EventBus';

    export let size: number = 200;
    let worldSize: number = 200;

    interface Cell {
        x: number;
        y: number;
        color: number;
    }

    interface ViewportRect {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    interface MinimapData {
        cells: Cell[];
        viewportRect: ViewportRect;
        worldSize: number;
    }

    let minimapCanvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;
    let minimapData: MinimapData = { 
        cells: [], 
        viewportRect: { x: 0, y: 0, width: 0, height: 0 },
        worldSize: 200 // Add this line
    };

    onMount(() => {
        ctx = minimapCanvas.getContext('2d');
        EventBus.on('minimap-updated', updateMinimap);
    });

    onDestroy(() => {
        EventBus.off('minimap-updated', updateMinimap);
    });

    function updateMinimap(data: MinimapData): void {
        minimapData = data;
        worldSize = data.worldSize;
        drawMinimap();
    }

    function drawMinimap(): void {
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);

        // Draw background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, size, size);

        // Draw cells
        const cellSize = size / minimapData.worldSize; // Use minimapData.worldSize here
        minimapData.cells.forEach((cell: Cell) => {
            ctx!.fillStyle = `#${cell.color.toString(16).padStart(6, '0')}`;
            ctx!.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
        });

        // Draw viewport rectangle
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            minimapData.viewportRect.x * size,
            minimapData.viewportRect.y * size,
            minimapData.viewportRect.width * size,
            minimapData.viewportRect.height * size
        );
    }
</script>

<canvas 
    bind:this={minimapCanvas} 
    width={size} 
    height={size}
    class="minimap"
></canvas>

<style>
    .minimap {
        position: absolute;
        bottom: 20px;
        right: 20px;
        border: 2px solid #00ff00;
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    }
</style>
