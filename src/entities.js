import { 
    GRAVITY, BIRD_START_X, BIRD_START_Y, BIRD_RADIUS, JUMP_STRENGTH,
    ENEMY_RADIUS, AIRPLANE_WIDTH, AIRPLANE_HEIGHT 
} from './config.js';

export class Bird {
    // Pass gravity and jumpStrength into the constructor
    constructor(gravity, jumpStrength) {
        this.gravity = gravity;
        this.jumpStrength = jumpStrength;
        this.reset();
    }

    reset() {
        this.x = BIRD_START_X;
        this.y = BIRD_START_Y;
        this.radius = BIRD_RADIUS;
        this.velocity = -5; 
        this.wingFlap = 0;
        this.shieldCount = 0;
        this.isInvincible = false;
        this.invincibilityTimer = 0;
    }

    jump() {
        this.velocity = this.jumpStrength; // Use the passed-in value
        this.wingFlap = 1.0;
    }

    update() {
        this.velocity += this.gravity; // Use the passed-in value
        this.y += this.velocity;
        this.wingFlap *= 0.9;

        if (this.isInvincible) {
            this.invincibilityTimer--;
            if (this.invincibilityTimer <= 0) this.isInvincible = false;
        }
    }
}

export class Obstacle {
    constructor(x, width, topHeight, bottomY, type = 'standard') {
        this.x = x;
        this.width = width;
        this.topHeight = topHeight;
        this.bottomY = bottomY;
        this.type = type;
        this.passed = false;
        
        // Random leaf color
        const colors = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'];
        this.leafColor = colors[Math.floor(Math.random() * colors.length)];
        
        // For moving obstacles
        this.moveDir = 1;
        this.moveSpeed = 0.7;
        this.minTopHeight = topHeight - 100;
        this.maxTopHeight = topHeight + 100;
    }

    update(speed) {
        this.x -= speed;
        if (this.type === 'moving') {
            this.topHeight += this.moveDir * this.moveSpeed;
            this.bottomY += this.moveDir * this.moveSpeed;

            if (this.topHeight <= this.minTopHeight || this.topHeight >= this.maxTopHeight) {
                this.moveDir *= -1;
            }
        }
    }
}

export class Powerup {
    constructor(x, y, radius, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type;
    }

    update(speed) {
        this.x -= speed;
    }
}

export class Enemy {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.wingFlap = 0; // Used for animation in renderer
    }

    update(speed) {
        this.x -= speed;
        // We'll update wing flap based on time or frame count if needed, 
        // but let's try to keep it simple and use a sine wave in the renderer first.
    }
}

export class Airplane {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.propellerAngle = 0;
    }

    update(speed) {
        this.x -= speed;
        // Increment propeller angle for smooth rotation
        // Roughly ~4-5 rotations per second at 60fps (approx 1 radian per frame if using larger increments, or smaller)
        // Let's use a value that gives about 3 revolutions per second: 2 * PI * 3 / 60 = approx 0.3 radians/frame
        this.propellerAngle += 0.4;
    }

    getBounds() {
        return {
            left: this.x - this.width * 0.55,
            right: this.x + this.width * 0.45,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}