import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    private grid: boolean[][];
    private cellSize: number = 10;
    private graphics: Phaser.GameObjects.Graphics;

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Set background color
        this.cameras.main.setBackgroundColor('#000000');

        // Initialize the Game of Life grid
        this.initializeGrid(width, height);

        // Create graphics object for drawing cells
        this.graphics = this.add.graphics();

        // Start the Game of Life simulation
        this.time.addEvent({
            delay: 200,
            callback: this.updateGrid,
            callbackScope: this,
            loop: true
        });

        // Clear any existing listeners before adding new ones
        EventBus.removeAllListeners();

        // Listen for the start game event from the Svelte component
        EventBus.on('startGame', this.changeScene, this);

        EventBus.emit('current-scene-ready', this);
    }

    initializeGrid(width: number, height: number) {
        const cols = Math.ceil(width / this.cellSize);
        const rows = Math.ceil(height / this.cellSize);
        this.grid = Array(rows).fill(null).map(() => 
            Array(cols).fill(null).map(() => Math.random() < 0.2)
        );
    }

    updateGrid() {
        const newGrid = this.grid.map(arr => [...arr]);
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const neighbors = this.countNeighbors(x, y);
                if (this.grid[y][x]) {
                    newGrid[y][x] = neighbors === 2 || neighbors === 3;
                } else {
                    newGrid[y][x] = neighbors === 3;
                }
            }
        }
        this.grid = newGrid;
        this.drawGrid();
    }

    countNeighbors(x: number, y: number): number {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newY = y + i;
                const newX = x + j;
                if (newY >= 0 && newY < this.grid.length && newX >= 0 && newX < this.grid[0].length) {
                    count += this.grid[newY][newX] ? 1 : 0;
                }
            }
        }
        return count;
    }

    drawGrid() {
        this.graphics.clear();
        this.graphics.fillStyle(0x00ff00, 0.3);
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x]) {
                    this.graphics.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }

    changeScene() {
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            this.scene.start('Game');
        });
    }
}
