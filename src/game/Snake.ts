export class Snake {
    body: { x: number, y: number }[];
    direction: { x: number, y: number };

    constructor(x: number, y: number, length: number, direction: { x: number, y: number }) {
        this.body = [];
        this.direction = direction;

        // Initialize the snake body
        for (let i = 0; i < length; i++) {
            this.body.push({
                x: x - i * direction.x,
                y: y - i * direction.y
            });
        }
    }

    get head() {
        return this.body[0];
    }

    move(target: { x: number, y: number }): { x: number, y: number } {
        // Determine new direction based on target
        const dx = target.x - this.head.x;
        const dy = target.y - this.head.y;

        // Change direction only if it's not a 180-degree turn
        if (Math.abs(dx) > Math.abs(dy) && dx !== 0) {
            this.direction = { x: Math.sign(dx), y: 0 };
        } else if (dy !== 0) {
            this.direction = { x: 0, y: Math.sign(dy) };
        }

        const newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y
        };

        this.body.unshift(newHead);
        this.body.pop(); // Remove the tail to keep the snake's length constant

        return newHead;
    }
}
