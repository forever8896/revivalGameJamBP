import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    private grid: boolean[][];
    private graphics: Phaser.GameObjects.Graphics;
    private cellSize: number = 40;
    private worldSize: number = 100; // 100x100 grid
    private isSimulationRunning: boolean = false;
    private simulationTimer: Phaser.Time.TimerEvent;
    private hoverCell: { x: number, y: number } | null = null;
    private isMouseDown: boolean = false;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key };
    private spaceKey: Phaser.Input.Keyboard.Key;
    private minimapSize: number = 200;
    private minimap: Phaser.GameObjects.Graphics;
    private cellCount: number = 0;
    private stableCount: number = 0;
    private previousGrid: boolean[][];
    private remainingCells: number = 10; // Start with 10 cells
    private stableStructures: { [key: string]: number } = {}; // Track stable structures and their age
    private orangeColor: number = 0xFFA500;
    private isGameOver: boolean = false;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Set world bounds
        this.matter.world.setBounds(0, 0, this.worldSize * this.cellSize, this.worldSize * this.cellSize);

        // Set up main camera
        this.camera = this.cameras.main;
        this.camera.setBounds(0, 0, this.worldSize * this.cellSize, this.worldSize * this.cellSize);

        // Initialize the grid
        this.grid = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));

        this.graphics = this.add.graphics();

        // Set up keyboard input
        if (this.input.keyboard) {
            this.keys = this.input.keyboard.addKeys('W,A,S,D') as { [key: string]: Phaser.Input.Keyboard.Key };
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        } else {
            console.warn('Keyboard input is not available');
            this.keys = {};
            this.spaceKey = {} as Phaser.Input.Keyboard.Key;
        }

        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointerup', this.handlePointerUp, this);

        // Create minimap
        const minimapX = this.cameras.main.width - this.minimapSize - 10;
        const minimapY = this.cameras.main.height - this.minimapSize - 10;

        this.minimap = this.add.graphics();
        this.minimap.fillStyle(0x000000);
        this.minimap.fillRect(minimapX, minimapY, this.minimapSize, this.minimapSize);
        this.minimap.setScrollFactor(0);

        // Initialize previous grid
        this.previousGrid = this.grid.map(row => [...row]);

        this.emitStatsUpdate();
        EventBus.emit('current-scene-ready', this);

        this.updateCellCount();
    }

    update ()
    {
        this.handleCameraMovement();
        this.drawGrid();
        this.drawMinimap();  // Add this line

        // Check for spacebar press
        if (this.input.keyboard && Phaser.Input.Keyboard.JustDown(this.spaceKey))
        {
            this.toggleSimulation();
        }
    }

    handleCameraMovement ()
    {
        const speed = 10;
        let dx = 0;
        let dy = 0;

        if (this.keys.A.isDown) dx -= speed;
        if (this.keys.D.isDown) dx += speed;
        if (this.keys.W.isDown) dy -= speed;
        if (this.keys.S.isDown) dy += speed;

        this.camera.scrollX += dx;
        this.camera.scrollY += dy;

        // Ensure camera stays within world bounds
        this.camera.scrollX = Phaser.Math.Clamp(this.camera.scrollX, 0, this.worldSize * this.cellSize - this.camera.width);
        this.camera.scrollY = Phaser.Math.Clamp(this.camera.scrollY, 0, this.worldSize * this.cellSize - this.camera.height);
    }

    drawGrid ()
    {
        this.graphics.clear();

        const camera = this.camera;
        const zoom = camera.zoom;
        const visibleLeft = Math.floor(camera.scrollX / (this.cellSize * zoom));
        const visibleTop = Math.floor(camera.scrollY / (this.cellSize * zoom));
        const visibleRight = Math.ceil((camera.scrollX + camera.width) / (this.cellSize * zoom));
        const visibleBottom = Math.ceil((camera.scrollY + camera.height) / (this.cellSize * zoom));

        // Draw grid lines
        this.graphics.lineStyle(1, 0x333333);
        for (let x = visibleLeft; x <= visibleRight; x++)
        {
            this.graphics.moveTo(x * this.cellSize, visibleTop * this.cellSize);
            this.graphics.lineTo(x * this.cellSize, visibleBottom * this.cellSize);
        }
        for (let y = visibleTop; y <= visibleBottom; y++)
        {
            this.graphics.moveTo(visibleLeft * this.cellSize, y * this.cellSize);
            this.graphics.lineTo(visibleRight * this.cellSize, y * this.cellSize);
        }
        this.graphics.strokePath();

        // Draw cells
        for (let y = visibleTop; y < visibleBottom; y++) {
            for (let x = visibleLeft; x < visibleRight; x++) {
                if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize && this.grid[y][x]) {
                    const cellKey = `${x},${y}`;
                    const cellAge = this.stableStructures[cellKey] || 0;
                    this.graphics.fillStyle(cellAge >= 10 ? this.orangeColor : 0x00ff00);
                    this.graphics.fillRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        // Draw hover effect
        if (this.hoverCell && !this.isSimulationRunning)
        {
            this.graphics.fillStyle(this.remainingCells > 0 ? 0x00ff00 : 0xff0000, 0.3);
            this.graphics.fillRect(
                this.hoverCell.x * this.cellSize,
                this.hoverCell.y * this.cellSize,
                this.cellSize,
                this.cellSize
            );
        }
    }

    handlePointerMove = (pointer: Phaser.Input.Pointer) =>
    {
        if (this.isSimulationRunning) return;

        const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
        const x = Math.floor(worldPoint.x / this.cellSize);
        const y = Math.floor(worldPoint.y / this.cellSize);

        if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize)
        {
            if (this.hoverCell?.x !== x || this.hoverCell?.y !== y)
            {
                this.hoverCell = { x, y };
                if (this.isMouseDown)
                {
                    this.toggleCell(x, y);
                }
                this.drawGrid();
            }
        }
        else
        {
            this.hoverCell = null;
        }
    }

    handlePointerDown = (pointer: Phaser.Input.Pointer) =>
    {
        if (this.isSimulationRunning) return;
        this.isMouseDown = true;
        if (this.hoverCell)
        {
            this.toggleCell(this.hoverCell.x, this.hoverCell.y);
        }
    }

    handlePointerUp = () =>
    {
        this.isMouseDown = false;
    }

    toggleCell(x: number, y: number) {
        if (this.isGameOver || this.isSimulationRunning) return;

        if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
            const cellKey = `${x},${y}`;
            const isStableOrangeCell = this.stableStructures[cellKey] >= 10;

            if (this.grid[y][x]) {
                // Cell is alive, check if it can be removed
                if (isStableOrangeCell) {
                    this.grid[y][x] = false;
                    delete this.stableStructures[cellKey];
                    this.remainingCells++;
                    this.cellCount--;
                }
            } else {
                // Cell is dead, check if it can be placed
                if (this.remainingCells > 0) {
                    this.grid[y][x] = true;
                    this.createCellPlacementEffect(x, y);
                    this.remainingCells--;
                    this.cellCount++;
                }
            }

            // Update the game state
            this.drawGrid();
            this.drawMinimap();
            this.emitStatsUpdate();
            this.stableCount = 0;
            this.previousGrid = this.grid.map(row => [...row]);
            this.checkGameOver();
        }
    }

    toggleSimulation = () =>
    {
        this.isSimulationRunning = !this.isSimulationRunning;

        if (this.isSimulationRunning) {
            this.simulationTimer = this.time.addEvent({
                delay: 200,
                callback: this.updateGrid,
                callbackScope: this,
                loop: true
            });
            this.stableCount = 0; // Reset stable count
        } else {
            if (this.simulationTimer) {
                this.simulationTimer.remove();
            }
            this.previousGrid = this.grid.map(row => [...row]);
            this.updateStableCount();
            this.updateCellCount();  // Update cell count when stopping simulation
            this.clampRemainingCells();  // Ensure remainingCells doesn't go below 0
        }

        EventBus.emit('simulation-toggled', this.isSimulationRunning);
        this.emitStatsUpdate();

        console.log(`Simulation ${this.isSimulationRunning ? 'started' : 'stopped'}`);
    }

    updateGrid() {
        const newGrid = this.grid.map(row => [...row]);
        for (let y = 0; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                const neighbors = this.countNeighbors(x, y);
                const cellKey = `${x},${y}`;
                if (this.grid[y][x]) {
                    // Cell is alive
                    if (neighbors < 2 || neighbors > 3) {
                        newGrid[y][x] = false; // Cell dies
                        delete this.stableStructures[cellKey];
                    } else {
                        // Cell stays alive
                        this.stableStructures[cellKey] = (this.stableStructures[cellKey] || 0) + 1;
                    }
                } else {
                    // Cell is dead
                    if (neighbors === 3) {
                        newGrid[y][x] = true; // Cell becomes alive
                        this.stableStructures[cellKey] = 0;
                    }
                }
            }
        }
        this.previousGrid = this.grid;
        this.grid = newGrid;
        this.drawGrid();
        this.drawMinimap();
        this.updateCellCount();
        this.updateStableCount();
        this.clampRemainingCells();  // Ensure remainingCells doesn't go below 0
        this.checkGameOver();
    }

    countNeighbors (x: number, y: number): number
    {
        let count = 0;
        for (let i = -1; i <= 1; i++)
        {
            for (let j = -1; j <= 1; j++)
            {
                if (i === 0 && j === 0) continue;
                const newX = x + i;
                const newY = y + j;
                if (newX >= 0 && newX < this.worldSize && newY >= 0 && newY < this.worldSize)
                {
                    count += this.grid[newY][newX] ? 1 : 0;
                }
            }
        }
        return count;
    }

    drawMinimap() {
        this.minimap.clear();

        const minimapX = this.cameras.main.width - this.minimapSize - 10;
        const minimapY = this.cameras.main.height - this.minimapSize - 10;

        // Draw background
        this.minimap.fillStyle(0x000000);
        this.minimap.fillRect(minimapX, minimapY, this.minimapSize, this.minimapSize);

        // Draw cells
        const cellSize = this.minimapSize / this.worldSize;

        for (let y = 0; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                if (this.grid[y][x]) {
                    const cellKey = `${x},${y}`;
                    const cellAge = this.stableStructures[cellKey] || 0;
                    this.minimap.fillStyle(cellAge >= 10 ? this.orangeColor : 0x00ff00);
                    this.minimap.fillRect(
                        minimapX + x * cellSize,
                        minimapY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }

        // Draw viewport rectangle
        const viewportWidth = this.camera.width / (this.cellSize * this.worldSize) * this.minimapSize;
        const viewportHeight = this.camera.height / (this.cellSize * this.worldSize) * this.minimapSize;
        const viewportX = minimapX + (this.camera.scrollX / (this.cellSize * this.worldSize) * this.minimapSize);
        const viewportY = minimapY + (this.camera.scrollY / (this.cellSize * this.worldSize) * this.minimapSize);

        this.minimap.lineStyle(2, 0xff0000);
        this.minimap.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
    }

    createCellPlacementEffect(x: number, y: number) {
        const effect = this.add.graphics();
        effect.fillStyle(0x00ff00);
        effect.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
        );

        effect.alpha = 0;

        this.tweens.add({
            targets: effect,
            alpha: 1,
            duration: 200,
            ease: 'Linear',
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    updateCellCount() {
        this.cellCount = this.grid.flat().filter(cell => cell).length;
        this.remainingCells = Math.max(0, this.remainingCells);
        this.emitStatsUpdate();
    }

    updateStableCount() {
        this.stableCount = 0;
        const visited: boolean[][] = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));

        for (let y = 0; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                if (this.grid[y][x] && this.grid[y][x] === this.previousGrid[y][x] && !visited[y][x]) {
                    this.stableCount++;
                    this.findStableStructure(x, y, visited);
                }
            }
        }
        this.emitStatsUpdate();
    }

    private findStableStructure(x: number, y: number, visited: boolean[][]): void {
        if (x < 0 || x >= this.worldSize || y < 0 || y >= this.worldSize || 
            visited[y][x] || !this.grid[y][x] || this.grid[y][x] !== this.previousGrid[y][x]) {
            return;
        }

        visited[y][x] = true;

        // Check all 8 neighboring cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                this.findStableStructure(x + dx, y + dy, visited);
            }
        }
    }

    emitStatsUpdate() {
        EventBus.emit('stats-updated', {
            cellCount: this.cellCount,
            stableCount: this.stableCount,
            remainingCells: this.remainingCells
        });
    }

    clampRemainingCells() {
        this.remainingCells = Math.max(0, this.remainingCells);
    }

    checkGameOver() {
        if (this.remainingCells === 0 && this.cellCount === 0) {
            this.isGameOver = true;
            this.isSimulationRunning = false;
            if (this.simulationTimer) {
                this.simulationTimer.remove();
            }
            EventBus.emit('game-over');
            console.log('Game Over!');
        }
    }

    resetGame() {
        this.grid = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));
        this.isSimulationRunning = false;
        this.cellCount = 0;
        this.stableCount = 0;
        this.remainingCells = 10; // Reset to initial number of cells
        this.stableStructures = {};
        this.isGameOver = false;
        this.drawGrid();
        this.drawMinimap();
        this.emitStatsUpdate();
        EventBus.emit('simulation-toggled', this.isSimulationRunning);
        EventBus.emit('game-reset'); // Add this line
    }
}