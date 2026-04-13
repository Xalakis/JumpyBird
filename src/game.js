import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_STRENGTH, 
    OBSTACLE_SPEED, OBSTACLE_SPAWN_RATE, POWERUP_SPAWN_CHANCE, 
    POWERUP_SPEED, ENEMY_SPAWN_RATE, ENEMY_SPEED, ENEMY_RADIUS,
    AIRPLANE_SPAWN_CHANCE, AIRPLANE_SPEED, AIRPLANE_WIDTH, AIRPLANE_HEIGHT, AIRPLANE_SPACING
} from './config.js';
import { AudioManager } from './audio.js';
import { Bird, Obstacle, Powerup, Enemy, Airplane } from './entities.js';
import { Renderer } from './renderer.js';

class Game {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('gameCanvas');
        this.scoreElement = document.getElementById('score');
        this.messageElement = document.getElementById('message');
        this.highScoreContainer = document.getElementById('high-scores-container');

        // --- INITIALIZE CANVAS DIMENSIONS ---
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Modules
        this.renderer = new Renderer(this.canvas, this.scoreElement, this.messageElement);
        this.audio = new AudioManager();
        
        // Game State
        this.bird = new Bird(GRAVITY, JUMP_STRENGTH);
        this.obstacles = [];
        this.powerups = []; 
        this.enemies = [];
        this.airplanes = [];
        this.airplaneObstacles = []; // NEW: Planes acting as vertical obstacles
        this.score = 0;
        this.frameCount = 0;
        this.isGameOver = false;
        this.isCooldown = false;
        this.gameStarted = false;
        this.bgOffset = 0;

        // Powerup Scheduling logic
        this.nextPowerupFrame = -1;
        this.powerupTargetY = 0;
        this.powerupTargetX = 0; // NEW: Stores the randomized X position

        // High Scores
        this.highScores = JSON.parse(localStorage.getItem('jumpyBirdHighScores')) || [];
        this.highScoreListElement = document.getElementById('high-scores-list');
        this.displayHighScores();

        // Bind Event Listeners
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.handleAction();
        });

        this.canvas.addEventListener('pointerdown', (e) => {
            // Prevent default touch behavior like zooming or scrolling on the canvas
            if (e.cancelable) e.preventDefault();
            this.handleAction();
        });
    }

    handleAction() {
        if (this.isCooldown) return;

        if (!this.gameStarted) {
            this.startGame();
        } else if (this.isGameOver) {
            this.resetGame();
        } else {
            this.bird.jump();
            this.audio.play('jump');
        }
    }

    startGame() {
        this.gameStarted = true;
        this.messageElement.style.display = 'none';
        this.bird.velocity = -5; // Initial upward boost
        this.gameLoop();
    }

    resetGame() {
        this.bird.reset();
        this.obstacles = [];
        this.powerups = [];
        this.enemies = [];
        this.airplanes = [];
        this.airplaneObstacles = []; // NEW: Planes acting as vertical obstacles
        this.score = 0;
        this.frameCount = 0;
        this.isGameOver = false;
        this.isCooldown = false;
        this.nextPowerupFrame = -1;
        this.powerupTimer = 0;
        this.scoreElement.innerText = `Score: ${this.score}`;
        this.messageElement.style.display = 'none';
        this.gameLoop();
    }

    spawnEnemy() {
        const randomY = Math.random() * (this.canvas.height - ENEMY_RADIUS * 2) + ENEMY_RADIUS;
        const newEnemy = new Enemy(this.canvas.width, randomY, ENEMY_RADIUS);
        this.enemies.push(newEnemy);
    }

    spawnVerticalAirplaneColumn() {
        const gapHeight = 200;
        const minPipeHeight = 50;
        const randomY = Math.random() * (this.canvas.height - gapHeight - (minPipeHeight * 2)) + minPipeHeight;
        const x = this.canvas.width;

        // Create planes to mimic top and bottom pipes
        const p1 = new Airplane(x, randomY - AIRPLANE_HEIGHT, AIRPLANE_WIDTH, AIRPLANE_HEIGHT);
        const p2 = new Airplane(x, randomY + gapHeight, AIRPLANE_WIDTH, AIRPLANE_HEIGHT);

        this.airplaneObstacles.push({
            x: x,
            width: AIRPLANE_WIDTH, 
            planes: [p1, p2],
            passed: false
        });
    }

    spawnAirplaneWave() {
        const startX = this.canvas.width + AIRPLANE_SPACING;
        for (let i = 0; i < 3; i++) {
            const randomY = Math.random() * (this.canvas.height - AIRPLANE_HEIGHT - 40) + 20;
            const xOffset = i * AIRPLANE_SPACING;
            this.airplanes.push(new Airplane(startX + xOffset, randomY, AIRPLANE_WIDTH, AIRPLANE_HEIGHT));
        }
    }

    spawnObstacle() {
        const gapHeight = 200;
        const minPipeHeight = 50;
        const pipeWidth = 50;
        const randomY = Math.random() * (this.canvas.height - gapHeight - (minPipeHeight * 2)) + minPipeHeight;
        
        let type = 'standard';
        if (this.score > 0 && Math.random() < 0.2) {
            type = 'moving';
        }
        const newObstacle = new Obstacle(this.canvas.width, pipeWidth, randomY, randomY + gapHeight, type);
        this.obstacles.push(newObstacle);

        // --- SCHEDULED POWERUP SPAWNING ---
        if (Math.random() < POWERUP_SPAWN_CHANCE) {
            const padding = 20;
            const targetY = Math.random() * (newObstacle.bottomY - newObstacle.topHeight - (padding * 2)) + (newObstacle.topHeight + padding);
            const xDeviation = (Math.random() * 100) - 50;
            this.powerupTargetX = this.canvas.width + xDeviation;
            const spawnDelay = 15; 
            this.nextPowerupFrame = this.frameCount + spawnDelay;
            this.powerupTargetY = targetY;
        }
    }

    isYPositionSafe(y, radius) {
        for (let o of this.obstacles) {
            const isAtRightEdge = (o.x < this.canvas.width && o.x + o.width > this.canvas.width - 30);
            if (isAtRightEdge) {
                const hitsTop = (y - radius < o.topHeight);
                const hitsBottom = (y + radius > o.bottomY);
                const canopyCenterX = o.x + o.width / 2;
                const canopyCenterY = o.bottomY;
                const canopyRadius = o.width * 1.2;
                const dx = this.canvas.width - canopyCenterX; 
                const dy = y - canopyCenterY;
                const hitsCanopy = Math.sqrt(dx * dx + dy * dy) < (radius + canopyRadius);
                if (hitsTop || hitsBottom || hitsCanopy) return false; 
            }
        }
        return true;
    }

    trySpawnPowerup() {
        if (this.powerups.length > 0) return;
        if (Math.random() < POWERUP_SPAWN_CHANCE) {
            const radius = 15;
            const minGapY = 50;
            const maxGapY = this.canvas.height - 50;
            const randomY = Math.random() * (maxGapY - minGapY) + minGapY;

            if (this.isYPositionSafe(randomY, radius)) {
                this.powerups.push(new Powerup(this.canvas.width, randomY, radius, 'shield'));
            }
        }
    }

    update() {
        if (this.isGameOver) return;
        this.bgOffset += 0.5;
        this.bird.update();

        // --- POWERUP SCHEDULING ---
        if (this.nextPowerupFrame !== -1 && this.frameCount === this.nextPowerupFrame) {
            this.powerups.push(new Powerup(this.powerupTargetX, this.powerupTargetY, 15, 'shield'));
            this.nextPowerupFrame = -1;
        }

        // Obstacle or Airplane Spawning
        if (this.frameCount % OBSTACLE_SPAWN_RATE === 0) {
            if (Math.random() < AIRPLANE_SPAWN_CHANCE) {
                this.spawnVerticalAirplaneColumn();
            } else {
                this.spawnObstacle();
            }
        }

        // Enemy Spawning
        if (this.frameCount % ENEMY_SPAWN_RATE === 0) {
            this.spawnEnemy();
        }

        // Powerup Movement & Collision
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            let p = this.powerups[i];
            p.update(POWERUP_SPEED);
            const dx = this.bird.x - p.x;
            const dy = this.bird.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.bird.radius + p.radius) {
                this.bird.shieldCount = Math.min(this.bird.shieldCount + 1, 3);
                this.audio.play('shieldGain');
                this.powerups.splice(i, 1);
                continue;
            }
            if (p.x + p.radius < 0) this.powerups.splice(i, 1);
        }

        // Enemy Movement & Collision
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            e.update(ENEMY_SPEED);
            const dx = this.bird.x - e.x;
            const dy = this.bird.y - e.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.bird.radius + e.radius) {
                if (this.bird.shieldCount > 0) {
                    this.bird.shieldCount--;
                    this.audio.play('shieldPop');
                    this.bird.isInvincible = true;
                    this.bird.invincibilityTimer = 60;
                } else if (!this.bird.isInvincible) {
                    this.gameOver();
                }
            }
            if (e.x + e.radius < 0) this.enemies.splice(i, 1);
        }

        // Airplane Movement & Collision (Regular Waves)
        for (let i = this.airplanes.length - 1; i >= 0; i--) {
            let a = this.airplanes[i];
            a.update(AIRPLANE_SPEED);
            const bounds = a.getBounds();
            const closestX = Math.max(bounds.left, Math.min(this.bird.x, bounds.right));
            const closestY = Math.max(bounds.top, Math.min(this.bird.y, bounds.bottom));
            const dx = this.bird.x - closestX;
            const dy = this.bird.y - closestY;
            const distanceSquared = (dx * dx) + (dy * dy);
            if (distanceSquared < (this.bird.radius * this.bird.radius)) {
                if (this.bird.shieldCount > 0) {
                    this.bird.shieldCount--;
                    this.audio.play('shieldPop');
                    this.bird.isInvincible = true;
                    this.bird.invincibilityTimer = 60;
                } else if (!this.bird.isInvincible) {
                    this.gameOver();
                }
            }
            if (a.x + a.width < 0) this.airplanes.splice(i, 1);
        }

        // Airplane Obstacles Movement & Collision (Vertical Columns)
        for (let i = this.airplaneObstacles.length - 1; i >= 0; i--) {
            const ao = this.airplaneObstacles[i];
            for (let j = ao.planes.length - 1; j >= 0; j--) {
                const a = ao.planes[j];
                a.update(OBSTACLE_SPEED);

                // Collision with bird
                const bounds = a.getBounds();
                const closestX = Math.max(bounds.left, Math.min(this.bird.x, bounds.right));
                const closestY = Math.max(bounds.top, Math.min(this.bird.y, bounds.bottom));
                const dx = this.bird.x - closestX;
                const dy = this.bird.y - closestY;
                const distanceSquared = (dx * dx) + (dy * dy);

                if (distanceSquared < (this.bird.radius * this.bird.radius)) {
                    if (this.bird.shieldCount > 0) {
                        this.bird.shieldCount--;
                        this.audio.play('shieldPop');
                        this.bird.isInvincible = true;
                        this.bird.invincibilityTimer = 60;
                    } else if (!this.bird.isInvincible) {
                        this.gameOver();
                    }
                }

                if (a.x + a.width < 0) ao.planes.splice(j, 1);
            }

            // Scoring for airplane obstacle column
            if (!ao.passed && ao.x + AIRPLANE_WIDTH < this.bird.x) {
                this.score++;
                ao.passed = true;
                this.scoreElement.innerText = `Score: ${this.score}`;
                this.audio.play('score');
            }

            if (ao.planes.length === 0 || ao.x + AIRPLANE_WIDTH < 0) {
                this.airplaneObstacles.splice(i, 1);
            }
        }

        // Obstacle Movement & Collision (Regular Pipes)
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let o = this.obstacles[i];
            o.update(OBSTACLE_SPEED);
            let hitObstacle = false;
            let hitType = null;
            if (this.bird.x + this.bird.radius > o.x && this.bird.x - this.bird.radius < o.x + o.width && this.bird.y - this.bird.radius < o.topHeight) {
                hitObstacle = true;
                hitType = 'top';
            } else if (this.bird.x + this.bird.radius > o.x && this.bird.x - this.bird.radius < o.x + o.width && this.bird.y + this.bird.radius > o.bottomY) {
                hitObstacle = true;
                hitType = 'bottom';
            } else {
                const canopyCenterX = o.x + o.width / 2;
                const canopyCenterY = o.bottomY;
                const canopyRadius = o.width * 1.2;
                const dx = this.bird.x - canopyCenterX;
                const dy = this.bird.y - canopyCenterY;
                if (Math.sqrt(dx * dx + dy * dy) < this.bird.radius + canopyRadius) {
                    hitObstacle = true;
                    hitType = 'bottom';
                }
            }

            if (hitObstacle) {
                if (this.bird.shieldCount > 0) {
                    this.bird.shieldCount--;
                    this.audio.play('shieldPop');
                    this.bird.isInvincible = true;
                    this.bird.invincibilityTimer = 60;
                    if (hitType === 'top') this.bird.y = o.topHeight + this.bird.radius + 2;
                    else this.bird.y = o.bottomY - this.bird.radius - 2;
                    this.bird.velocity = 0;
                } else if (!this.bird.isInvincible) {
                    this.gameOver();
                }
            }

            if (!o.passed && o.x + o.width < this.bird.x) {
                this.score++;
                o.passed = true;
                this.scoreElement.innerText = `Score: ${this.score}`;
                this.audio.play('score');
            }

            if (o.x + o.width < 0) this.obstacles.splice(i, 1);
        }

        if (this.bird.y + this.bird.radius > this.canvas.height || this.bird.y - this.bird.radius < 0) {
            this.gameOver();
        }

        this.frameCount++;
    }

    draw() {
        this.renderer.clear();
        // Background layers
        this.renderer.drawMountains(this.bgOffset, '#4a5d6a', 0.2, 150);
        this.renderer.drawMountains(this.bgOffset, '#5a7d8a', 0.5, 80);

        // Game entities (drawn from back to front)
        this.renderer.drawPowerups(this.powerups);
        this.renderer.drawObstacles(this.obstacles);
        this.renderer.drawEnemies(this.enemies);
        this.renderer.drawAirplanes(this.airplanes);

        // Special airplane obstacle columns
        if (this.airplaneObstacles) {
            const allPlaneObstaclePlanes = this.airplaneObstacles.flatMap(ao => ao.planes);
            this.renderer.drawAirplanes(allPlaneObstaclePlanes);
        }

        // The Bird
        this.renderer.drawBird(this.bird);

        // UI Elements (always on top)
        this.renderer.drawShields(this.bird.shieldCount);
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isCooldown = true;

        this.updateHighScores(this.score);
        this.displayHighScores();
        this.audio.play('gameOver');
        this.messageElement.classList.add('game-over');
        this.messageElement.style.display = 'block';
        this.messageElement.innerHTML = `GAME OVER<br>Final Score: ${this.score}<br>Tap or Press Space to Restart`;
        setTimeout(() => {
            this.isCooldown = false;
        }, 1000);
    }

    updateHighScores(newScore) {
        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b - a);
        this.highScores = this.highScores.slice(0, 5);
        localStorage.setItem('jumpyBirdHighScores', JSON.stringify(this.highScores));
    }

    displayHighScores() {
        if (this.highScores.length === 0) {
            this.highScoreContainer.style.display = 'none';
            return;
        }
        let html = '<h3>TOP 5 RUNS</h3>';
        this.highScores.forEach((s, i) => {
            html += `<div class="score-item">${i + 1}. ${s} pts</div>`;
        });
        this.highScoreContainer.innerHTML = html;
        this.highScoreContainer.style.display = 'block';
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize Game
const game = new Game();