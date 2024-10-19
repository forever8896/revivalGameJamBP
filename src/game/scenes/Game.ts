import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { structures } from '../structures';
import { Snake } from '../Snake'; // We'll create this class


export class Game extends Scene
{
    private grid: boolean[][];
    private graphics: Phaser.GameObjects.Graphics;
    private cellSize: number = 20;
    private worldSize: number = 200; // 100x100 grid
    private isSimulationRunning: boolean = false;
    private simulationTimer: Phaser.Time.TimerEvent | null = null;
    private hoverCell: { x: number, y: number } | null = null;
    private isMouseDown: boolean = false;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key | undefined } = {};
    private spaceKey: Phaser.Input.Keyboard.Key | null;
    private minimapSize: number = 200;
    private cellCount: number = 0;
    private stableCount: number = 0;
    private previousGrid: boolean[][];
    private remainingCells: number = 100; // Start with 10 cells
    private stableStructures: { [key: string]: number } = {}; // Track stable structures and their age
    private orangeColor: number = 0xFFA500;
    private pulsarColor: number = 0x9900FF;
    private isGameOver: boolean = false;
    private selectedStructure: string | null = null;
    private hoverStructure: boolean[][] | null = null;
    private qKey: Phaser.Input.Keyboard.Key | null = null;
    private eKey: Phaser.Input.Keyboard.Key | null = null;
    private rotationIndex: number = 0;
    private rotationAngle: number = 0;
    private pulsars: { x: number, y: number, generationCount: number }[] = [];
    private generationCount: number = 0;
    private minZoom: number = 0.5;
    private maxZoom: number = 2;
    private minimapData: {
        cells: {x: number, y: number, color: number}[],
        viewportRect: {x: number, y: number, width: number, height: number},
        worldSize: number
    };
    private clickSound: Phaser.Sound.BaseSound;
    private coinSound: Phaser.Sound.BaseSound;
    private timeStopSound: Phaser.Sound.BaseSound;
    private collisionSound: Phaser.Sound.BaseSound;
    private enemyGrid: boolean[][];
    private enemyColor: number = 0xFF0000; // Red color for enemy cells
    private backgroundMusic: Phaser.Sound.BaseSound;
    private isMusicPlaying: boolean = false;
    private enemySpawnPoints: number[] = [];
    private enemyShootInterval: number = 100; // Shoot every 100 generations
    private maxEnemySpawnPoints: number = 5; // Maximum number of spawn points
    private snakes: Snake[] = [];
    private snakeSpawnInterval: number = 10; 
    // private snakeSpawnInterval: number = 1; // 10X faster test
    private snakeColor: number = 0xFF0000; // Red color for snakes
    private worldWidth: number;
    private worldHeight: number;
    private pulsarCount: number = 0;
    private explosionSound: Phaser.Sound.BaseSound;
    private controls: Phaser.Cameras.Controls.SmoothedKeyControl;
    private targetZoom: number = 1;
    private isRightMouseDown: boolean = false;
    private cKey: Phaser.Input.Keyboard.Key | null = null;
    private isFirstGeneration: boolean = true;
    private gameSpeed: number = 50;
    private generationsPerRound: number = 50; // Number of generations per round
    private currentRoundGeneration: number = 0;
    private isRoundActive: boolean = false;



    



    private isPulsarCell(x: number, y: number): boolean {
        return this.pulsars.some(pulsar => 
            x >= pulsar.x && x < pulsar.x + 13 && 
            y >= pulsar.y && y < pulsar.y + 13
        )
    }



    private placeInitialPulsars() {
        const centerX = Math.floor(this.worldSize / 2) - 25; // Adjust as needed
        const centerY = Math.floor(this.worldSize / 2) - 6; // Adjust as needed
    
        for (let i = 0; i < 3; i++) {
            const x = centerX + i * 16; // Increase spacing to 16 cells apart
            this.placePulsar(x, centerY);
        }
    }

    private placePulsar(x: number, y: number) {
        const pulsarStructure = structures['Pulsar'];
        for (let dy = 0; dy < pulsarStructure.length; dy++) {
            for (let dx = 0; dx < pulsarStructure[0].length; dx++) {
                if (pulsarStructure[dy][dx]) {
                    const worldX = x + dx;
                    const worldY = y + dy;
                    if (worldX >= 0 && worldX < this.worldSize && worldY >= 0 && worldY < this.worldSize) {
                        this.grid[worldY][worldX] = true;
                    }
                }
            }
        }
        this.pulsars.push({ x, y, generationCount: 0 });
    }

    private isPulsarStillValid(x: number, y: number): boolean {
        const pulsarSize = 13;
        let cellCount = 0;

        for (let dy = 0; dy < pulsarSize; dy++) {
            for (let dx = 0; dx < pulsarSize; dx++) {
                if (this.grid[y + dy] && this.grid[y + dy][x + dx]) {
                    cellCount++;
                }
            }
        }

        // A pulsar oscillates between 48, 56, and 72 live cells
        return cellCount === 48 || cellCount === 56 || cellCount === 72;
    }










    



    constructor ()
    {
        super('Game');
        this.worldWidth = this.worldSize * this.cellSize;
        this.worldHeight = this.worldSize * this.cellSize;
        

        EventBus.on('toggleSimulation', this.toggleSimulation);
        EventBus.on('resetGame', this.resetGame);  // Make sure this line is present
        EventBus.on('returnToMenu', this.returnToMenu);
        EventBus.on('update-game-speed', this.updateGameSpeed);

    }

    preload()
    {
        this.load.audio('click', 'sounds/click.wav');
        this.load.audio("coin", "sounds/coin.wav");
        this.load.audio('backgroundMusic', 'sounds/music.mp3');
        this.load.audio('timeStop', 'sounds/timestop.wav');    
        this.load.audio("explosion", "sounds/explosion.wav");
        this.load.audio("collision", "sounds/enemyHit.wav");
    }

    create ()
    {
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.worldSize * this.cellSize, this.worldSize * this.cellSize);

        // Set up main camera
        this.camera = this.cameras.main;
        this.camera.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.camera.setZoom(1);
        this.camera.centerOn(this.worldWidth / 2, this.worldHeight / 2);

        const controlConfig: Phaser.Types.Cameras.Controls.SmoothedKeyControlConfig = {
            camera: this.cameras.main,
            left: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            acceleration: 0.06,
            drag: 0.0005,
            maxSpeed: 0.5
        };

        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);

        // Initialize the grid
        this.grid = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));

        this.placeInitialPulsars();

        this.graphics = this.add.graphics();

        // Set up keyboard input
        if (this.input.keyboard) {
            this.keys = this.input.keyboard.addKeys('W,A,S,D') as { [key: string]: Phaser.Input.Keyboard.Key };
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        } else {
            console.warn('Keyboard input is not available');
            this.keys = {};
            this.spaceKey = null;
            this.cKey = null;
        }

        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointerup', this.handlePointerUp, this);
        this.input.on('rightdown', this.handleRightMouseDown, this);
        this.input.on('rightup', this.handleRightMouseUp, this);

        // Initialize previous grid
        this.previousGrid = this.grid.map(row => [...row]);

        this.emitStatsUpdate();
        EventBus.emit('current-scene-ready', this);

        this.updateCellCount();

        EventBus.on('structure-selected', this.handleStructureSelected, this);

        if (this.input.keyboard) {
            this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
            this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

            // Add event listeners for Q and E keys
            if (this.qKey) {
                this.qKey.on('down', this.rotateStructureLeft, this);
            }
            if (this.eKey) {
                this.eKey.on('down', this.rotateStructureRight, this);
            }
        } else {
            console.warn('Keyboard input is not available');
            this.qKey = null;
            this.eKey = null;
        }

        // Add mouse wheel listener for zooming
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
            this.handleMouseWheel(deltaY);
        });

        this.clickSound = this.sound.add('click');
        this.coinSound = this.sound.add('coin');
        this.timeStopSound = this.sound.add('timeStop');
        this.explosionSound = this.sound.add('explosion');
        this.collisionSound = this.sound.add('collision');

        this.enemyGrid = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));

        this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
        
        EventBus.on('toggle-music', this.toggleMusic, this);

        this.initializeEnemySpawnPoints();

        // Initialize snakes
        this.snakes = [];
    }

    private initializeEnemySpawnPoints() {
        const initialSpawnPoints = 1;
        for (let i = 0; i < initialSpawnPoints; i++) {
            this.addEnemySpawnPoint();
        }
    }

    private addEnemySpawnPoint() {
        if (this.enemySpawnPoints.length < this.maxEnemySpawnPoints) {
            const newSpawnPoint = Math.floor(Math.random() * this.worldSize);
            if (!this.enemySpawnPoints.includes(newSpawnPoint)) {
                this.enemySpawnPoints.push(newSpawnPoint);
            }
        }
    }

    update (time: number, delta: number)
    {
        this.controls.update(delta);
        
        // Always perform these updates, regardless of simulation state
        // Smooth zoom
        if (this.camera.zoom !== this.targetZoom) {
            const prevZoom = this.camera.zoom;
            this.camera.zoom = Phaser.Math.Linear(this.camera.zoom, this.targetZoom, 0.1);

            // Calculate the center of the viewport in world coordinates
            const centerX = this.camera.scrollX + this.camera.width / (2 * prevZoom);
            const centerY = this.camera.scrollY + this.camera.height / (2 * prevZoom);

            // Adjust camera position to keep the center point the same
            this.camera.scrollX = centerX - this.camera.width / (2 * this.camera.zoom);
            this.camera.scrollY = centerY - this.camera.height / (2 * this.camera.zoom);

            this.clampCamera();
            this.drawGrid();
        }

        // Handle camera movement
        this.handleCameraMovement();

        // Update minimap every frame
        this.updateMinimapData();

        // Update hover cell and structure placement preview
        this.updateHoverCell();

        // Handle structure placement
        this.handleStructurePlacement();

        // Check for spacebar press to toggle simulation
        if (this.input.keyboard && this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (!this.isRoundActive) {
                this.toggleSimulation();
                this.timeStopSound.play();
            }
            // Comment out the ability to pause/resume during a round
            /*
            else if (this.isRoundActive && !this.isSimulationRunning) {
                this.isSimulationRunning = true;
                this.toggleSimulation();
                this.timeStopSound.play();
            }
            */
        }

        // Check for rotation keys
        if (this.qKey && Phaser.Input.Keyboard.JustDown(this.qKey)) {
            this.rotateStructureLeft();
        }
        if (this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.rotateStructureRight();
        }

        // Check for 'C' key press to deselect structure
        if (this.cKey && Phaser.Input.Keyboard.JustDown(this.cKey)) {
            this.deselectStructure();
        }
    }

    handleCameraMovement()
    {
        const speed = 5; // Adjust this value to get the desired camera speed
        let dx = 0;
        let dy = 0;

        if (this.keys.A?.isDown) dx -= speed;
        if (this.keys.D?.isDown) dx += speed;
        if (this.keys.W?.isDown) dy -= speed;
        if (this.keys.S?.isDown) dy += speed;

        if (dx !== 0 || dy !== 0) {
            this.camera.scrollX += dx;
            this.camera.scrollY += dy;

            // Ensure camera stays within world bounds
            this.clampCamera();

            // Redraw the grid if the camera has moved
            this.drawGrid();
            
            // Update minimap data when camera moves
            this.updateMinimapData();
        }
    }

    drawGrid() {
        this.graphics.clear();

        const camera = this.cameras.main;
        const zoom = camera.zoom;

        // Retrieve the exact visible area of the camera
        const view = camera.worldView;

        // Define a buffer to ensure partial cells are rendered
        const buffer = 2; // Increased buffer for better coverage

        // Calculate start and end positions with buffer
        const startX = Math.max(0, Math.floor(view.x / this.cellSize) - buffer);
        const startY = Math.max(0, Math.floor(view.y / this.cellSize) - buffer);
        const endX = Math.min(this.worldSize, Math.ceil((view.x + view.width) / this.cellSize) + buffer);
        const endY = Math.min(this.worldSize, Math.ceil((view.y + view.height) / this.cellSize) + buffer);

        // Optional: Fill the background to prevent any black areas
        // Uncomment the following lines if you prefer a background color
        /*
        this.graphics.fillStyle(0xFFFFFF, 1); // Set to your desired background color
        this.graphics.fillRect(view.x, view.y, view.width, view.height);
        */

        // Draw influence area
        const influenceArea = this.getPulsarInfluenceArea();
        this.graphics.fillStyle(0x0000ff, 0.1);
        this.drawAreaCells(startX, startY, endX - startX, endY - startY, (x, y) => 
            influenceArea[y][x]
        );

        // Draw pulsar borders
        this.graphics.fillStyle(0xFF0000, 0.3);
        for (const pulsar of this.pulsars) {
            const borderSize = 17; // 13 (pulsar size) + 4 (2 cells on each side)
            const borderX = (pulsar.x - 2) * this.cellSize;
            const borderY = (pulsar.y - 2) * this.cellSize;
            if (this.isInViewport(pulsar.x - 2, pulsar.y - 2, startX, startY, endX - startX, endY - startY) ||
                this.isInViewport(pulsar.x + 14, pulsar.y + 14, startX, startY, endX - startX, endY - startY)) {
                this.graphics.fillRect(borderX, borderY, borderSize * this.cellSize, borderSize * this.cellSize);
            }
        }

        // Draw grid lines
        const lineThickness = Math.max(0.5, 1 / zoom);
        this.graphics.lineStyle(lineThickness, 0x333333);

        for (let x = startX; x <= endX; x++) {
            const worldX = x * this.cellSize;
            this.graphics.moveTo(worldX, view.y);
            this.graphics.lineTo(worldX, view.y + view.height);
        }
        for (let y = startY; y <= endY; y++) {
            const worldY = y * this.cellSize;
            this.graphics.moveTo(view.x, worldY);
            this.graphics.lineTo(view.x + view.width, worldY);
        }
        this.graphics.strokePath();

        // Draw cells
        this.drawAreaCells(startX, startY, endX - startX, endY - startY, (x, y) => {
            if (this.grid[y][x]) {
                if (this.isPulsarCell(x, y)) {
                    this.graphics.fillStyle(this.pulsarColor);
                } else {
                    const cellKey = `${x},${y}`;
                    const cellAge = this.stableStructures[cellKey] || 0;
                    this.graphics.fillStyle(cellAge >= 10 ? this.orangeColor : 0x00ff00);
                }
                return true;
            } else if (this.enemyGrid[y][x]) {
                this.graphics.fillStyle(this.enemyColor);
                return true;
            }
            return false;
        });

        // Draw hover effect
        if (this.hoverCell) {
            if (this.selectedStructure && this.hoverStructure) {
                const canPlace = this.canPlaceStructure(this.hoverCell.x, this.hoverCell.y, this.hoverStructure);
                this.graphics.fillStyle(canPlace ? 0x00ff00 : 0xff0000, 0.3);

                // Draw the structure hover
                for (let dy = 0; dy < this.hoverStructure.length; dy++) {
                    for (let dx = 0; dx < this.hoverStructure[dy].length; dx++) {
                        if (this.hoverStructure[dy][dx]) {
                            this.graphics.fillRect(
                                (this.hoverCell.x + dx) * this.cellSize,
                                (this.hoverCell.y + dy) * this.cellSize,
                                this.cellSize,
                                this.cellSize
                            );
                        }
                    }
                }

                // If the structure is a Pulsar, draw the red area
                if (this.selectedStructure === 'Pulsar') {
                    this.graphics.fillStyle(0xFF0000, 0.3); // Red color with 30% opacity
                    const pulsarSize = 13;
                    const borderSize = pulsarSize + 4; // 2 cells on each side

                    this.graphics.fillRect(
                        (this.hoverCell.x - 2) * this.cellSize,
                        (this.hoverCell.y - 2) * this.cellSize,
                        borderSize * this.cellSize,
                        borderSize * this.cellSize
                    );

                    // Clear the actual pulsar area
                    this.graphics.fillStyle(canPlace ? 0x00ff00 : 0xff0000, 0.3);
                    this.graphics.fillRect(
                        this.hoverCell.x * this.cellSize,
                        this.hoverCell.y * this.cellSize,
                        pulsarSize * this.cellSize,
                        pulsarSize * this.cellSize
                    );
                }

                // Draw arrow for Glider and LWSS
                if (this.selectedStructure === 'Glider' || this.selectedStructure === 'LWSS') {
                    this.drawStructureArrow(this.hoverCell.x, this.hoverCell.y, this.hoverStructure, this.selectedStructure);
                }
            } else {
                // Single cell hover effect when no structure is selected
                const influenceArea = this.getPulsarInfluenceArea();
                if (influenceArea[this.hoverCell.y][this.hoverCell.x]) {
                    const canPlace = this.remainingCells > 0 && !this.grid[this.hoverCell.y][this.hoverCell.x];
                    this.graphics.fillStyle(canPlace ? 0x00ff00 : 0xff0000, 0.3);
                    this.graphics.fillRect(
                        this.hoverCell.x * this.cellSize,
                        this.hoverCell.y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        // Draw snakes
        this.graphics.fillStyle(this.snakeColor);
        for (const snake of this.snakes) {
            for (const segment of snake.body) {
                if (this.isInViewport(segment.x, segment.y, startX, startY, endX - startX, endY - startY)) {
                    this.graphics.fillRect(
                        segment.x * this.cellSize,
                        segment.y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }

    private drawAreaCells(startX: number, startY: number, width: number, height: number, cellCheck: (x: number, y: number) => boolean) {
        for (let y = startY; y < startY + height; y++) {
            for (let x = startX; x < startX + width; x++) {
                if (cellCheck(x, y)) {
                    this.graphics.fillRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }

    private isInViewport(x: number, y: number, startX: number, startY: number, width: number, height: number): boolean {
        return x >= startX && x < startX + width && y >= startY && y < startY + height;
    }


    private returnToMenu = () => {
        // Stop the current scene and start the menu scene
        this.scene.stop('Game');
        this.scene.start('Menu'); // Assuming you have a Menu scene
    }

    handlePointerMove = (pointer: Phaser.Input.Pointer) => {
        const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);
        const x = Math.floor(worldPoint.x / this.cellSize);
        const y = Math.floor(worldPoint.y / this.cellSize);
    
        if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
            if (this.hoverCell?.x !== x || this.hoverCell?.y !== y) {
                this.hoverCell = { x, y };
                if (this.selectedStructure) {
                    this.updateHoverStructure();
                } else {
                    this.hoverStructure = null;
                }
                if (this.isMouseDown) {
                    this.toggleCell(x, y);
                }
                this.drawGrid();
            }
        } else {
            this.hoverCell = null;
            this.hoverStructure = null;
        }
    }

    handlePointerDown = (pointer: Phaser.Input.Pointer) =>
    {
        if (pointer.rightButtonDown()) {
            this.handleRightMouseDown(pointer);
        } else {
            this.isMouseDown = true;
            if (this.hoverCell) {
                this.toggleCell(this.hoverCell.x, this.hoverCell.y);
            }
        }
    }

    handlePointerUp = (pointer: Phaser.Input.Pointer) =>
    {
        if (pointer.rightButtonReleased()) {
            this.handleRightMouseUp();
        } else {
            this.isMouseDown = false;
        }
    }

    private handleRightMouseDown = (pointer: Phaser.Input.Pointer) => {
        this.isRightMouseDown = true;
        this.deselectStructure();
    }

    private handleRightMouseUp = () => {
        this.isRightMouseDown = false;
    }

    private deselectStructure = () => {
        if (this.selectedStructure) {
            this.selectedStructure = null;
            this.hoverStructure = null;
            this.rotationIndex = 0; // Reset rotation index
            EventBus.emit('structure-deselected');
            this.drawGrid(); // Redraw the grid to remove the hover effect
            this.clickSound.play(); // Optional: Play a sound when deselecting
        }
    }

    toggleCell(x: number, y: number) {
        if (this.isGameOver || this.isSimulationRunning) return;

        if (this.selectedStructure) {
            this.placeStructure(x, y, this.selectedStructure);
        } else {
            if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
                const cellKey = `${x},${y}`;
                const isStableOrangeCell = this.stableStructures[cellKey] >= 10;
                const influenceArea = this.getPulsarInfluenceArea();

                if (this.grid[y][x]) {
                    // Cell is alive, check if it can be removed
                    if (isStableOrangeCell) {
                        this.grid[y][x] = false;
                        delete this.stableStructures[cellKey];
                        this.remainingCells++;
                        this.cellCount--;
                        this.clickSound.play(); // Play sound when removing a cell
                    }
                } else {
                    // Cell is dead, check if it can be placed
                    if (this.remainingCells > 0 && influenceArea[y][x]) {
                        this.grid[y][x] = true;
                        this.createCellPlacementEffect(x, y);
                        this.remainingCells--;
                        this.cellCount++;
                        this.clickSound.play(); // Play sound when placing a cell
                    }
                }

                // Update the game state
                this.drawGrid();
                this.updateMinimapData();
                this.emitStatsUpdate();
                this.stableCount = 0;
                this.previousGrid = this.grid.map(row => [...row]);
                this.checkGameOver();
            }
        }
    }

    toggleSimulation = () => {
        // Toggle the simulation running state
        this.isSimulationRunning = !this.isSimulationRunning;

        if (this.isSimulationRunning) {
            if (!this.isRoundActive) {
                // Only allow starting a new round if one isn't active
                this.startNewRound();
            }

            // Start the simulation timer
            this.simulationTimer = this.time.addEvent({
                delay: this.gameSpeed,
                callback: this.updateGrid,
                callbackScope: this,
                loop: true
            });
        } else {
            // Stop the simulation timer
            if (this.simulationTimer) {
                this.simulationTimer.remove();
                this.simulationTimer = null; // Clear the timer reference
            }
        }

        this.drawGrid();
        this.updateMinimapData();

        EventBus.emit('simulation-toggled', this.isSimulationRunning);
        EventBus.emit('round-status-changed', this.isRoundActive);
        this.emitStatsUpdate();

        console.log(`Simulation ${this.isSimulationRunning ? 'started' : 'stopped'}`);
    }

    startNewRound() {
        this.isRoundActive = true;
        this.isSimulationRunning = true;
        this.currentRoundGeneration = 0;
        EventBus.emit('round-status-changed', true);
        this.emitStatsUpdate();
    }

    updateGrid() {
        if (this.isFirstGeneration) {
            this.startBackgroundMusic();
            this.isFirstGeneration = false;
        }

        // Initialize new grids
        const newGrid: boolean[][] = Array(this.worldSize);
        const newEnemyGrid: boolean[][] = Array(this.worldSize);

        for (let y = 0; y < this.worldSize; y++) {
            newGrid[y] = Array(this.worldSize);
            newEnemyGrid[y] = Array(this.worldSize);
            for (let x = 0; x < this.worldSize; x++) {
                newGrid[y][x] = this.grid[y][x];
                newEnemyGrid[y][x] = this.enemyGrid[y][x];
            }
        }

        // Update player cells
        for (let y = 0; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                const neighbors = this.countNeighbors(x, y);
                const enemyNeighbors = this.countEnemyNeighbors(x, y);
                const totalNeighbors = neighbors + enemyNeighbors;

                if (this.grid[y][x]) {
                    // Player cell logic
                    if (totalNeighbors < 2 || totalNeighbors > 3) {
                        newGrid[y][x] = false;
                    }
                } else if (!this.enemyGrid[y][x]) {
                    // Empty cell logic
                    if (totalNeighbors === 3) {
                        if (enemyNeighbors > neighbors) {
                            newEnemyGrid[y][x] = true;
                        } else {
                            newGrid[y][x] = true;
                        }
                    }
                }
            }
        }

        // Update enemy cells
        for (let y = 0; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                const neighbors = this.countEnemyNeighbors(x, y);
                const playerNeighbors = this.countNeighbors(x, y);
                const totalNeighbors = neighbors + playerNeighbors;

                if (this.enemyGrid[y][x]) {
                    // Enemy cells survive with 2 or 3 neighbors (total)
                    if (totalNeighbors >= 2 && totalNeighbors <= 3) {
                        newEnemyGrid[y][x] = true;
                    } else {
                        newEnemyGrid[y][x] = false;
                    }
                } else if (!this.grid[y][x]) {
                    // Empty cell becomes enemy if it has exactly 3 enemy neighbors
                    if (neighbors === 3) {
                        newEnemyGrid[y][x] = true;
                    }
                }
            }
        }

        this.grid = newGrid;
        this.enemyGrid = newEnemyGrid;
        this.keepEnemiesAway();

        // Spawn new enemies
        if (this.generationCount % this.enemyShootInterval === 0) {
            this.shootEnemyShips();
        }

        // Add new spawn point every 1000 generations
        if (this.generationCount % 1000 === 0) {
            this.addEnemySpawnPoint();
        }

        this.generationCount++;
        this.currentRoundGeneration++;

        // Emit stats update after each generation
        this.emitStatsUpdate();

        // Update pulsars
        for (let i = this.pulsars.length - 1; i >= 0; i--) {
            const pulsar = this.pulsars[i];
            if (!this.isPulsarStillValid(pulsar.x, pulsar.y)) {
                this.pulsars.splice(i, 1);
                this.explosionSound.play(); // Play explosion sound when pulsar dies
                this.pulsarCount--;
            } else {
                pulsar.generationCount++;
                if (pulsar.generationCount % 15 === 0) {
                    this.remainingCells++;
                }
            }
        }

        this.pulsarCount = this.pulsars.length;
        console.log(`Remaining pulsars: ${this.pulsarCount}`);

        this.previousGrid = this.grid;
        this.drawGrid();
        this.updateMinimapData();
        this.updateCellCount();
        this.updateStableCount();
        this.clampRemainingCells();
        this.checkGameOver();

        // Update and draw snakes
        this.updateSnakes();

        // Spawn new snake if needed
        if (this.generationCount % this.snakeSpawnInterval === 0) {
            this.spawnSnake();
        }

        if (this.currentRoundGeneration >= this.generationsPerRound) {
            this.endRound();
        }
    }

    endRound() {
        this.isRoundActive = false;
        this.isSimulationRunning = false;
        if (this.simulationTimer) {
            this.simulationTimer.remove();
        }
        EventBus.emit('round-ended');
        this.timeStopSound.play();

        // Ensure final stats are emitted
        this.emitStatsUpdate();
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
            generationCount: this.generationCount,
            remainingCells: this.remainingCells,
            pulsarCount: this.pulsarCount,
            currentRoundGeneration: this.currentRoundGeneration,
            generationsPerRound: this.generationsPerRound
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
            EventBus.emit('game-over', 'defeat');
            console.log('Game Over! Player defeated.');
        } else if (this.pulsars.length === 0) {
            this.isGameOver = true;
            this.isSimulationRunning = false;
            if (this.simulationTimer) {
                this.simulationTimer.remove();
            }
            EventBus.emit('game-over', 'defeat');
            console.log('Game Over! All pulsars destroyed.');
        }
    }

    resetGame = () => {  // Use arrow function to preserve 'this' context
        if (this.simulationTimer) {
            this.simulationTimer.remove();
        }
        this.grid = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));
        this.enemyGrid = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));
        this.isSimulationRunning = false;
        this.cellCount = 0;
        this.stableCount = 0;
        this.remainingCells = 100; // Reset to initial number of cells
        this.stableStructures = {};
        this.isGameOver = false;
        this.pulsars = [];
        this.pulsarCount = 0;
        this.generationCount = 0;
        this.snakes = [];
        this.rotationIndex = 0;
        this.selectedStructure = null;

        this.camera.setZoom(1);
        this.camera.centerOn(this.worldWidth / 2, this.worldHeight / 2);

        this.graphics.clear();

        this.initializeEnemySpawnPoints();
        this.placeInitialPulsars();
        this.drawGrid();
        this.updateMinimapData();
        this.emitStatsUpdate();

        EventBus.emit('simulation-toggled', this.isSimulationRunning);
        EventBus.emit('game-reset');
        EventBus.emit('structure-deselected');
        this.isFirstGeneration = true;

        // Stop the music
        if (this.backgroundMusic && this.isMusicPlaying) {
            this.backgroundMusic.stop();
            this.isMusicPlaying = false;
            EventBus.emit('music-state-changed', this.isMusicPlaying);
        }
        this.currentRoundGeneration = 0;
        this.isRoundActive = false;
        EventBus.emit('round-status-changed', this.isRoundActive);
    }

    placeStructure(x: number, y: number, structureName: string) {
        if (!this.selectedStructure) return;
        
        const structure = this.hoverStructure;
        if (!structure) return;

        const canPlace = structureName === 'Pulsar' || this.canPlaceStructure(x, y, structure);
        if (!canPlace) return;

        const structureCost = this.countCellsInStructure(structure);
        let placedCells = 0;

        for (let dy = 0; dy < structure.length; dy++) {
            for (let dx = 0; dx < structure[dy].length; dx++) {
                const worldX = x + dx;
                const worldY = y + dy;
                if (structure[dy][dx] && !this.grid[worldY][worldX]) {
                    this.grid[worldY][worldX] = true;
                    this.createCellPlacementEffect(worldX, worldY);
                    placedCells++;
                }
            }
        }

        if (placedCells > 0) {
            this.remainingCells -= placedCells;
            this.cellCount += placedCells;

            if (structureName === 'Pulsar') {
                this.pulsars.push({ x, y, generationCount: 0 });
            }

            this.clickSound.play(); // Play sound when placing a structure

            // Deselect the structure after placing it
            this.selectedStructure = null;
            this.hoverStructure = null;
            this.rotationIndex = 0; // Reset rotation index
            EventBus.emit('structure-deselected'); // Emit an event to update the UI

            this.drawGrid();
            this.updateMinimapData();
            this.emitStatsUpdate();
            this.checkGameOver();
        }
    }

    countCellsInStructure(structure: boolean[][]): number {
        return structure.flat().filter(cell => cell).length;
    }

    rotateStructureLeft = () => {
        if (this.selectedStructure) {
            this.rotationIndex = (this.rotationIndex - 1 + 8) % 8;
            this.updateHoverStructure();
            this.drawGrid();
        }
    }
    
    rotateStructureRight = () => {
        if (this.selectedStructure) {
            this.rotationIndex = (this.rotationIndex + 1) % 8;
            this.updateHoverStructure();
            this.drawGrid();
        }
    }
    
    updateHoverStructure() {
        if (this.selectedStructure) {
            let structure = structures[this.selectedStructure];
            const rotationDegrees = Math.floor(this.rotationIndex / 2) * 90;
            this.hoverStructure = this.rotateStructure(structure, rotationDegrees, this.selectedStructure);
        }
    }

    private rotateStructure(structure: boolean[][], degrees: number, structureName: string): boolean[][] {
        if (degrees === 0) return structure;
        
        if (structureName === 'LWSS') {
            // Special rotation for LWSS
            const rotations = Math.floor(degrees / 90) % 4;
            let rotated = structure;
            for (let i = 0; i < rotations; i++) {
                rotated = this.rotateLWSS(rotated);
            }
            return rotated;
        }
        
        const rows = structure.length;
        const cols = structure[0].length;
        let rotated: boolean[][] = [];

        if (degrees === 45 || degrees === 135 || degrees === 225 || degrees === 315) {
            // For 45-degree rotations, we need to create a larger grid
            const size = Math.max(rows, cols) * 2;
            rotated = Array(size).fill(null).map(() => Array(size).fill(false));

            const centerX = Math.floor(size / 2);
            const centerY = Math.floor(size / 2);

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (structure[y][x]) {
                        let newX, newY;
                        switch (degrees) {
                            case 45:
                                newX = centerX + (x - y);
                                newY = centerY + (x + y);
                                break;
                            case 135:
                                newX = centerX - (y + x);
                                newY = centerY + (x - y);
                                break;
                            case 225:
                                newX = centerX - (x - y);
                                newY = centerY - (x + y);
                                break;
                            case 315:
                                newX = centerX + (y + x);
                                newY = centerY - (x - y);
                                break;
                        }
                        if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
                            rotated[newY][newX] = true;
                        }
                    }
                }
            }

            // Trim the rotated structure
            rotated = this.trimStructure(rotated);
        } else {
            // For 90-degree rotations, we can use the previous method
            rotated = Array(cols).fill(null).map(() => Array(rows).fill(false));
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (degrees === 90) {
                        rotated[x][rows - 1 - y] = structure[y][x];
                    } else if (degrees === 180) {
                        rotated[cols - 1 - x][rows - 1 - y] = structure[y][x];
                    } else if (degrees === 270) {
                        rotated[cols - 1 - x][y] = structure[y][x];
                    }
                }
            }
        }

        return rotated;
    }

    private rotateLWSS(lwss: boolean[][]): boolean[][] {
        const rows = lwss.length;
        const cols = lwss[0].length;
        let rotated: boolean[][] = Array(cols).fill(null).map(() => Array(rows).fill(false));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = lwss[y][x];
            }
        }
        
        return rotated;
    }

    private trimStructure(structure: boolean[][]): boolean[][] {
        let minX = structure[0].length, maxX = 0, minY = structure.length, maxY = 0;

        for (let y = 0; y < structure.length; y++) {
            for (let x = 0; x < structure[y].length; x++) {
                if (structure[y][x]) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        return structure.slice(minY, maxY + 1).map(row => row.slice(minX, maxX + 1));
    }

    drawStructureArrow(x: number, y: number, structure: boolean[][], structureName: string) {
        const arrowColor = 0xFFFF00; // Yellow color for the arrow
        const arrowSize = this.cellSize * 2; // Increased arrow size
        const centerX = (x + structure[0].length / 2) * this.cellSize;
        const centerY = (y + structure.length / 2) * this.cellSize;

        let endX: number = centerX;
        let endY: number = centerY;

        const direction = Math.floor(this.rotationIndex / 2);

        if (structureName === 'Glider') {
            switch (direction) {
                case 0: // Southeast
                    endX = centerX + arrowSize * 0.7;
                    endY = centerY + arrowSize * 0.7;
                    break;
                case 1: // Southwest
                    endX = centerX - arrowSize * 0.7;
                    endY = centerY + arrowSize * 0.7;
                    break;
                case 2: // Northwest
                    endX = centerX - arrowSize * 0.7;
                    endY = centerY - arrowSize * 0.7;
                    break;
                case 3: // Northeast
                    endX = centerX + arrowSize * 0.7;
                    endY = centerY - arrowSize * 0.7;
                    break;
            }
        } else if (structureName === 'LWSS') {
            switch (direction) {
                case 0: // Left
                    endX = centerX - arrowSize;
                    break;
                case 1: // Up
                    endY = centerY - arrowSize;
                    break;
                case 2: // Right
                    endX = centerX + arrowSize;
                    break;
                case 3: // Down
                    endY = centerY + arrowSize;
                    break;
            }
        }

        // Draw the arrow
        this.graphics.lineStyle(3, arrowColor);
        this.graphics.beginPath();
        this.graphics.moveTo(centerX, centerY);
        this.graphics.lineTo(endX, endY);
        this.graphics.strokePath();

        // Draw arrowhead
        const arrowheadSize = this.cellSize * 0.5;
        const angle = Math.atan2(endY - centerY, endX - centerX);
        this.graphics.fillStyle(arrowColor);
        this.graphics.fillTriangle(
            endX, endY,
            endX - arrowheadSize * Math.cos(angle - Math.PI / 6), endY - arrowheadSize * Math.sin(angle - Math.PI / 6),
            endX - arrowheadSize * Math.cos(angle + Math.PI / 6), endY - arrowheadSize * Math.sin(angle + Math.PI / 6)
        );
    }

    handleMouseWheel(deltaY: number) {
        const zoomChange = deltaY * -0.001;
        const newZoom = Phaser.Math.Clamp(this.targetZoom + zoomChange, this.minZoom, this.maxZoom);
        
        if (newZoom !== this.targetZoom) {
            this.targetZoom = newZoom;
        }
    }

    clampCamera() {
        const camera = this.cameras.main;
        const view = camera.worldView;

        const maxScrollX = Math.max(0, this.worldWidth - view.width);
        const maxScrollY = Math.max(0, this.worldHeight - view.height);

        camera.scrollX = Phaser.Math.Clamp(camera.scrollX, 0, maxScrollX);
        camera.scrollY = Phaser.Math.Clamp(camera.scrollY, 0, maxScrollY);
    }

    updateMinimapData() {
        const cells: {x: number, y: number, color: number}[] = [];
        for (let y = 0; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                if (this.grid[y][x]) {
                    let color;
                    if (this.isPulsarCell(x, y)) {
                        color = this.pulsarColor;
                    } else {
                        const cellKey = `${x},${y}`;
                        const cellAge = this.stableStructures[cellKey] || 0;
                        color = cellAge >= 10 ? this.orangeColor : 0x00ff00;
                    }
                    cells.push({ x, y, color });
                }
                // Add enemy cells to the minimap
                if (this.enemyGrid[y][x]) {
                    cells.push({ x, y, color: this.enemyColor });
                }
            }
        }

        // Add snakes to the minimap data
        for (const snake of this.snakes) {
            for (const segment of snake.body) {
                cells.push({ x: segment.x, y: segment.y, color: this.snakeColor });
            }
        }

        const worldPixelWidth = this.worldSize * this.cellSize;
        const worldPixelHeight = this.worldSize * this.cellSize;

        const viewportRect = {
            x: this.camera.scrollX / worldPixelWidth,
            y: this.camera.scrollY / worldPixelHeight,
            width: (this.camera.width / this.camera.zoom) / worldPixelWidth,
            height: (this.camera.height / this.camera.zoom) / worldPixelHeight
        };

        // Clamp the viewport rectangle to ensure it doesn't go out of bounds
        viewportRect.x = Phaser.Math.Clamp(viewportRect.x, 0, 1 - viewportRect.width);
        viewportRect.y = Phaser.Math.Clamp(viewportRect.y, 0, 1 - viewportRect.height);

        this.minimapData = { cells, viewportRect, worldSize: this.worldSize };
        EventBus.emit('minimap-updated', this.minimapData);
    }

    canPlaceStructure(x: number, y: number, structure: boolean[][]): boolean {
        const structureCost = this.countCellsInStructure(structure);
        if (this.remainingCells < structureCost) return false;

        const isPulsar = this.selectedStructure === 'Pulsar';
        const influenceArea = this.getPulsarInfluenceArea();

        for (let dy = 0; dy < structure.length; dy++) {
            for (let dx = 0; dx < structure[dy].length; dx++) {
                const worldX = x + dx;
                const worldY = y + dy;
                if (worldX < 0 || worldX >= this.worldSize || worldY < 0 || worldY >= this.worldSize) {
                    return false;
                }
                if (structure[dy][dx]) {
                    if (this.grid[worldY][worldX]) {
                        return false;
                    }
                    // Check if the cell is within the influence area, unless it's a Pulsar
                    if (!isPulsar && !influenceArea[worldY][worldX]) {
                        return false;
                    }
                }
            }
        }

        // For Pulsar, check if its red border area intersects with any existing Pulsar's red border
        if (isPulsar) {
            const pulsarSize = 13;
            const borderSize = pulsarSize + 4; // 2 cells on each side
            for (const existingPulsar of this.pulsars) {
                const existingBorderX = existingPulsar.x - 2;
                const existingBorderY = existingPulsar.y - 2;
                
                // Check if the new Pulsar's border intersects with the existing Pulsar's border
                if (!(x - 2 + borderSize <= existingBorderX || 
                      x - 2 >= existingBorderX + borderSize ||
                      y - 2 + borderSize <= existingBorderY ||
                      y - 2 >= existingBorderY + borderSize)) {
                    return false;
                }
            }
        }

        return true;
    }

    countEnemyNeighbors(x: number, y: number): number {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newX = x + i;
                const newY = y + j;
                if (newX >= 0 && newX < this.worldSize && newY >= 0 && newY < this.worldSize) {
                    count += this.enemyGrid[newY][newX] ? 1 : 0;
                }
            }
        }
        return count;
    }

    shootEnemyShips() {
        const structures = ['Glider', 'LWSS'];
        const safeDistance = 5; // Distance from the edge to ensure ships don't die immediately
        const predictionSteps = 100; // Number of steps to predict

        for (const spawnX of this.enemySpawnPoints) {
            const structure = structures[Math.floor(Math.random() * structures.length)];
            const rotatedStructure = this.getAimedStructure(structure, spawnX, safeDistance, this.worldSize / 2, this.worldSize);
            
            if (this.canPlaceEnemyStructure(spawnX, safeDistance, rotatedStructure)) {
                // Create a temporary grid for prediction
                const tempGrid = this.enemyGrid.map(row => [...row]);
                this.placeStructureOnGrid(tempGrid, spawnX, safeDistance, rotatedStructure);

                // Predict movement
                const predictedGrid = this.predictCellMovement(tempGrid, predictionSteps);

                // Check if the ship will reach the player's area
                const willReachPlayer = this.checkShipReachesPlayer(predictedGrid);

                if (willReachPlayer) {
                    this.placeEnemyStructure(spawnX, safeDistance, rotatedStructure);
                }
            }
        }
    }

    getAimedStructure(structureName: string, x: number, y: number, targetX: number, targetY: number): boolean[][] {
        let structure = structures[structureName];
        // Always aim downwards for top-spawning enemies
        return this.rotateStructure(structure, 180, structureName);
    }

    canPlaceEnemyStructure(x: number, y: number, structure: boolean[][]): boolean {
        for (let dy = 0; dy < structure.length; dy++) {
            for (let dx = 0; dx < structure[dy].length; dx++) {
                const worldX = x + dx;
                const worldY = y + dy;
                if (worldX < 0 || worldX >= this.worldSize || worldY < 0 || worldY >= this.worldSize) {
                    return false;
                }
                if (structure[dy][dx] && (this.grid[worldY][worldX] || this.enemyGrid[worldY][worldX])) {
                    return false;
                }
            }
        }
        return true;
    }

    placeEnemyStructure(x: number, y: number, structure: boolean[][]) {
        for (let dy = 0; dy < structure.length; dy++) {
            for (let dx = 0; dx < structure[dy].length; dx++) {
                if (structure[dy][dx]) {
                    this.enemyGrid[y + dy][x + dx] = true;
                }
            }
        }
    }

    private keepEnemiesAway() {
        const safeDistance = Math.floor(this.worldSize / 5); // Increased safe distance

        for (let y = 0; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                if (y > this.worldSize - safeDistance && this.enemyGrid[y][x]) {
                    this.enemyGrid[y][x] = false;
                }
            }
        }
    }

    toggleMusic = () => {
        if (this.isMusicPlaying) {
            this.backgroundMusic.pause();
            this.isMusicPlaying = false;
        } else {
            this.startBackgroundMusic();
        }
        EventBus.emit('music-state-changed', this.isMusicPlaying);
    }

    private startBackgroundMusic() {
        if (this.backgroundMusic && !this.isMusicPlaying) {
            this.backgroundMusic.play();
            this.isMusicPlaying = true;
            EventBus.emit('music-state-changed', this.isMusicPlaying);
        }
    }

    private predictCellMovement(initialGrid: boolean[][], steps: number): boolean[][] {
        let currentGrid = initialGrid.map(row => [...row]);
        
        for (let step = 0; step < steps; step++) {
            const newGrid = currentGrid.map(row => [...row]);
            
            for (let y = 0; y < this.worldSize; y++) {
                for (let x = 0; x < this.worldSize; x++) {
                    const neighbors = this.countNeighborsInGrid(currentGrid, x, y);
                    
                    if (currentGrid[y][x]) {
                        // Cell survival
                        newGrid[y][x] = (neighbors === 2 || neighbors === 3);
                    } else {
                        // Cell birth
                        newGrid[y][x] = (neighbors === 3);
                    }
                }
            }
            
            currentGrid = newGrid;
        }
        
        return currentGrid;
    }

    private countNeighborsInGrid(grid: boolean[][], x: number, y: number): number {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newX = x + i;
                const newY = y + j;
                if (newX >= 0 && newX < this.worldSize && newY >= 0 && newY < this.worldSize) {
                    count += grid[newY][newX] ? 1 : 0;
                }
            }
        }
        return count;
    }

    private placeStructureOnGrid(grid: boolean[][], x: number, y: number, structure: boolean[][]) {
        for (let dy = 0; dy < structure.length; dy++) {
            for (let dx = 0; dx < structure[dy].length; dx++) {
                if (structure[dy][dx]) {
                    grid[y + dy][x + dx] = true;
                }
            }
        }
    }

    private checkShipReachesPlayer(grid: boolean[][]): boolean {
        const playerArea = Math.floor(this.worldSize * 0.7); // Consider the bottom 30% as player area
        for (let y = playerArea; y < this.worldSize; y++) {
            for (let x = 0; x < this.worldSize; x++) {
                if (grid[y][x]) {
                    return true;
                }
            }
        }
        return false;
    }

    private updateSnakes()
    {
        for (let i = this.snakes.length - 1; i >= 0; i--) {
            const snake = this.snakes[i];
            const newHead = snake.move(this.findNearestPulsar(snake.head));

            // Check if the snake's head is adjacent to any regular cell
            if (this.isAdjacentToCell(newHead.x, newHead.y)) {
                // Convert snake to regular cells
                for (const segment of snake.body) {
                    this.grid[segment.y][segment.x] = true;
                }
                // Remove the snake
                this.snakes.splice(i, 1);

                // Reward the player with 10 remaining cells
                this.remainingCells += 10;
                this.collisionSound.play(); // Play a sound to indicate the reward
                this.emitStatsUpdate(); // Update the UI with the new remaining cells count
            }
        }
    }

    private isAdjacentToCell(x: number, y: number): boolean {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip the center cell
                const checkX = x + dx;
                const checkY = y + dy;
                if (
                    checkX >= 0 && checkX < this.worldSize &&
                    checkY >= 0 && checkY < this.worldSize &&
                    this.grid[checkY][checkX]
                ) {
                    return true; // Found an adjacent live cell
                }
            }
        }
        return false; // No adjacent live cells found
    }

    private spawnSnake()
    {
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x: number, y: number;

        switch (edge) {
            case 0: // top
                x = Math.floor(Math.random() * this.worldSize);
                y = 0;
                break;
            case 1: // right
                x = this.worldSize - 1;
                y = Math.floor(Math.random() * this.worldSize);
                break;
            case 2: // bottom
                x = Math.floor(Math.random() * this.worldSize);
                y = this.worldSize - 1;
                break;
            case 3: // left
            default:
                x = 0;
                y = Math.floor(Math.random() * this.worldSize);
                break;
        }

        const length = Math.floor(Math.random() * 3) + 3; // Random length between 3 and 5
        const direction = this.getRandomDirection();
        
        // Check if the spawn position is valid
        if (!this.grid[y][x]) {
            const snake = new Snake(x, y, length, direction);
            this.snakes.push(snake);
        }
    }

    private findNearestPulsar(point: { x: number, y: number }): { x: number, y: number } {
        let nearestPulsar = { x: 0, y: 0 };
        let minDistance = Infinity;

        for (const pulsar of this.pulsars) {
            const distance = Phaser.Math.Distance.Between(point.x, point.y, pulsar.x, pulsar.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPulsar = { x: pulsar.x, y: pulsar.y };
            }
        }

        return nearestPulsar;
    }

    private getRandomDirection(): { x: number, y: number } {
        const directions = [
            { x: 1, y: 0 },  // right
            { x: -1, y: 0 }, // left
            { x: 0, y: 1 },  // down
            { x: 0, y: -1 }  // up
        ];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    private compareStates(state1: boolean[][], state2: boolean[][]): boolean {
        for (let y = 0; y < state1.length; y++) {
            for (let x = 0; x < state1[y].length; x++) {
                if (state1[y][x] !== state2[y][x]) {
                    return false;
                }
            }
        }
        return true;
    }

    private countPulsarCells(x: number, y: number): number {
        const pulsarSize = 13;
        let cellCount = 0;

        for (let dy = 0; dy < pulsarSize; dy++) {
            for (let dx = 0; dx < pulsarSize; dx++) {
                if (this.grid[y + dy] && this.grid[y + dy][x + dx]) {
                    cellCount++;
                }
            }
        }

        return cellCount;
    }

    handleStructureSelected = (structureName: string | null) => {
        this.selectedStructure = structureName;
        if (structureName !== null) {
            this.clickSound.play();
        }
        this.updateHoverStructure();
    }

    private getPulsarInfluenceArea(): boolean[][] {
        const influenceArea = Array(this.worldSize).fill(null).map(() => Array(this.worldSize).fill(false));
        const influenceRadius = 25; // Adjust this value to change the size of the influence area
        const pulsarSize = 13; // Size of the pulsar structure
        const centerOffset = Math.floor(pulsarSize / 2); // Offset to center the influence area

        for (const pulsar of this.pulsars) {
            const centerX = pulsar.x + centerOffset;
            const centerY = pulsar.y + centerOffset;
            for (let dy = -influenceRadius; dy <= influenceRadius; dy++) {
                for (let dx = -influenceRadius; dx <= influenceRadius; dx++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
                        influenceArea[y][x] = true;
                    }
                }
            }
        }

        return influenceArea;
    }

    private updateHoverCell() {
        if (this.input.activePointer.isDown) {
            const worldPoint = this.camera.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
            const x = Math.floor(worldPoint.x / this.cellSize);
            const y = Math.floor(worldPoint.y / this.cellSize);

            if (x >= 0 && x < this.worldSize && y >= 0 && y < this.worldSize) {
                if (this.hoverCell?.x !== x || this.hoverCell?.y !== y) {
                    this.hoverCell = { x, y };
                    if (this.selectedStructure) {
                        this.updateHoverStructure();
                    } else {
                        this.hoverStructure = null;
                    }
                    if (this.isMouseDown) {
                        this.toggleCell(x, y);
                    }
                    this.drawGrid();
                }
            } else {
                this.hoverCell = null;
                this.hoverStructure = null;
            }
        }
    }

    private handleStructurePlacement() {
        if (this.input.activePointer.isDown && this.hoverCell && this.selectedStructure) {
            const { x, y } = this.hoverCell;
            this.placeStructure(x, y, this.selectedStructure);
        }
    }

    private updateGameSpeed = (speed: number) => {
        this.gameSpeed = speed;
        if (this.isSimulationRunning && this.simulationTimer) {
            this.simulationTimer.remove();
            this.simulationTimer = this.time.addEvent({
                delay: this.gameSpeed,
                callback: this.updateGrid,
                callbackScope: this,
                loop: true
            });
        }
    }
}