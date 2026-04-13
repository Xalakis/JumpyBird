export class Renderer {
    constructor(canvas, scoreElement, messageElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scoreElement = scoreElement;
        this.messageElement = messageElement;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawMountains(bgOffset, color, speedMultiplier, heightRange) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, this.canvas.height);
        for (let x = 0; x <= this.canvas.width; x += 10) {
            const noise = Math.sin(x * 0.01 + bgOffset * speedMultiplier) * 20;
            const noise2 = Math.sin(x * 0.02 + bgOffset * speedMultiplier * 0.5) * 10;
            const y = this.canvas.height - heightRange - noise - noise2;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.canvas.width, this.canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    drawBird(bird) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(bird.x, bird.y);

        // Shield Bubble
        if (bird.shieldCount > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, bird.radius + 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Invincibility Flash
        if (bird.isInvincible && Math.floor(bird.invincibilityTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.radius, bird.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(8, -6, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();

        // Pupil
        ctx.beginPath();
        ctx.arc(10, -6, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Beak
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.quadraticCurveTo(18, -1, 22, 4);
        ctx.quadraticCurveTo(18, 9, 12, 8);
        ctx.closePath();
        ctx.fillStyle = '#FF8C00';
        ctx.fill();
        ctx.stroke();

        // Wing
        ctx.save();
        ctx.translate(-12, 0);
        ctx.rotate(bird.wingFlap * -1.2);
        ctx.beginPath();
        ctx.ellipse(6, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFACD';
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    drawObstacles(obstacles) {
        const ctx = this.ctx;
        obstacles.forEach(o => {
            // Top Rock
            ctx.fillStyle = '#757575';
            ctx.fillRect(o.x, 0, o.width, o.topHeight);
            ctx.fillStyle = '#616161';
            ctx.beginPath();
            ctx.moveTo(o.x, o.topHeight);
            ctx.lineTo(o.x + o.width / 2, o.topHeight + 10);
            ctx.lineTo(o.x + o.width, o.topHeight);
            ctx.fill();

            // Bottom Tree
            ctx.fillStyle = '#5D4037';
            const trunkWidth = o.width * 0.4;
            const trunkX = o.x + (o.width - trunkWidth) / 2;
            ctx.fillRect(trunkX, o.bottomY, trunkWidth, this.canvas.height - o.bottomY);
            ctx.fillStyle = o.leafColor || '#2E7D32';
            ctx.beginPath();
            ctx.arc(o.x + o.width / 2, o.bottomY, o.width * 1.2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawShieldPowerup(pX, pY) {
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(pX, pY);
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(12, -10);
            ctx.lineTo(12, 5);
            ctx.quadraticCurveTo(0, 18, -12, 5);
            ctx.lineTo(-12, -10);
            ctx.closePath();
            ctx.fillStyle = '#00e5ff';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();        
    }

    drawPowerups(powerups) {
        const ctx = this.ctx;
        powerups.forEach(p => {
            this.drawShieldPowerup(p.x, p.y);
        });
    }

    drawEnemies(enemies) {
        const ctx = this.ctx;
        const time = Date.now() * 0.01; // Used for wing flapping animation
        
        enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);

            // Wing Flap factor (-1 to 1)
            const flap = Math.sin(time * 2);

            // Draw Wings first so they are behind the body
            ctx.fillStyle = '#333'; // Dark grey for wings
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;

            // Left Wing
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-e.radius * 1.5, -e.radius * (1 + flap), -e.radius * 2, 0);
            ctx.quadraticCurveTo(-e.radius * 1.5, e.radius * (1 + flap), 0, 0);
            ctx.fill();
            ctx.stroke();

            // Right Wing
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(e.radius * 1.5, -e.radius * (1 + flap), e.radius * 2, 0);
            ctx.quadraticCurveTo(e.radius * 1.5, e.radius * (1 + flap), 0, 0);
            ctx.fill();
            ctx.stroke();

            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, e.radius * 0.8, e.radius, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a1a'; // Near black body
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Ears
            ctx.beginPath();
            ctx.moveTo(-e.radius * 0.5, -e.radius * 0.8);
            ctx.lineTo(-e.radius * 0.7, -e.radius * 1.3);
            ctx.lineTo(-e.radius * 0.2, -e.radius * 0.9);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(e.radius * 0.5, -e.radius * 0.8);
            ctx.lineTo(e.radius * 0.7, -e.radius * 1.3);
            ctx.lineTo(e.radius * 0.2, -e.radius * 0.9);
            ctx.fill();
            ctx.stroke();

            // Eyes
            ctx.fillStyle = 'white';
            // Left eye
            ctx.beginPath();
            ctx.arc(-e.radius * 0.3, -e.radius * 0.3, e.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
            // Right eye
            ctx.beginPath();
            ctx.arc(e.radius * 0.3, -e.radius * 0.3, e.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();

            // Pupils (Red eyes for bats)
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(-e.radius * 0.3, -e.radius * 0.3, e.radius * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(e.radius * 0.3, -e.radius * 0.3, e.radius * 0.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawShields(count) {
        if (count <= 0) return;
        const ctx = this.ctx;
        const padding = 20;
        const iconSize = 30;
        const spacing = 10;

        for (let i = 0; i < count; i++) {
            const x = padding + i * (iconSize + spacing);
            const y = this.canvas.height - padding - iconSize / 2;

            this.drawShieldPowerup(x, y);
        }
    }

    drawAirplanes(airplanes) {
        const ctx = this.ctx;

        airplanes.forEach(a => {
            ctx.save();
            ctx.translate(a.x, a.y);

            const w = a.width;
            const h = a.height;
            // Nose is at the extreme left of our fuselage ellipse: -0.1w (center offset) - 0.45w (radius) = -0.55w
            const noseX = -w * 0.55;

            // --- 1. REAR WING & TAIL FIN (With Shading) ---
            const tailGrad = ctx.createLinearGradient(w * 0.2, -h * 0.6, w * 0.45, 0);
            tailGrad.addColorStop(0, '#BDC3C7'); // Darker top/edge
            tailGrad.addColorStop(1, '#95A5A6'); // Lighter base
            ctx.fillStyle = tailGrad;

            ctx.beginPath();
            // Start the fin from within the fuselage boundary so it looks attached
            ctx.moveTo(w * 0.2, -h * 0.1); 
            ctx.lineTo(w * 0.3, -h * 0.6);
            ctx.lineTo(w * 0.45, -h * 0.6);
            ctx.lineTo(w * 0.4, 0);
            ctx.closePath();
            ctx.fill();

            // --- 2. FUSELAGE (Body with Radial Shading) ---
            const fuselageCenterX = -w * 0.1;
            const fuselageCenterY = 0;
            const fusRadiusX = w * 0.45;
            const fusRadiusY = h * 0.3;

            // Advanced radial gradient to simulate light from top-left
            const radGrad = ctx.createRadialGradient(
                fuselageCenterX - fusRadiusX * 0.3, // Light source X offset
                -fusRadiusY * 0.4,                 // Light source Y offset (top)
                0,                                 // Inner radius
                fuselageCenterX,                   // Center X
                fuselageCenterY,                   // Center Y
                Math.max(fusRadiusX, fusRadiusY)   // Outer radius
            );
            radGrad.addColorStop(0, '#FFFFFF'); // Highlight (top-left)
            radGrad.addColorStop(0.4, '#ECF0F1'); // Mid tone
            radGrad.addColorStop(1, '#7F8C8D');  // Shadow (bottom/right)

            ctx.fillStyle = radGrad;
            ctx.strokeStyle = '#2C3E50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(fuselageCenterX, fuselageCenterY, fusRadiusX, fusRadiusY, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // --- 3. COCKPIT WINDOW (With Glint/Highlight) ---
            const cockpitX = -w * 0.25;
            const cockpitY = -h * 0.27; // Moved slightly up to protrude more from the fuselage top line
            const cockpitRX = w * 0.12;
            const cockpitRY = h * 0.13;

            // Base Window Color
            ctx.fillStyle = '#3498DB'; // Sky blue cockpit
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            // Using a slightly more balanced ellipse for better rounding as requested
            ctx.ellipse(cockpitX, cockpitY, cockpitRX * 1.1, cockpitRY * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();

            // Window Glint (Specular Highlight)
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.ellipse(cockpitX - cockpitRX*0.3, cockpitY - cockpitRY*0.3, cockpitRX * 0.4, cockpitRY * 0.4, 0, 0, Math.PI * 2);
            const glintGrad = ctx.createRadialGradient(cockpitX-5, cockpitY-5, 1, cockpitX-5, cockpitY-5, 15);
            glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glintGrad;
            ctx.fill();

            // --- 4. FRONT WING (With Shading) ---
            const wingGrad = ctx.createLinearGradient(-w * 0.3, h * 0.1, w * 0.1, h * 0.2);
            wingGrad.addColorStop(0, '#ECF0F1'); // Light edge
            wingGrad.addColorStop(1, '#BDC3C7'); // Darker depth

            ctx.fillStyle = wingGrad;
            ctx.strokeStyle = '#2C3E50';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-w * 0.3, h * 0.1);
            ctx.lineTo(w * 0.1, h * 0.2);
            ctx.lineTo(w * 0.05, h * 0.4);
            ctx.lineTo(-w * 0.4, h * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

             // --- 5. PROPELLER (Enhanced visibility & hub) ---
             ctx.save();
             ctx.translate(noseX, 0); // Move to nose tip
             ctx.rotate(a.propellerAngle);

             // Propeller blades: Reduced size to half of original span for better proportions
            ctx.fillStyle = '#2C3E50';
            ctx.fillRect(-1.5, -h * 0.35, 3, h * 0.7); // The main blade span (half height)

            // Hub center cap to hide the axis of rotation and make it look solid
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.06, 0, Math.PI * 2);
            ctx.fillStyle = '#34495E';
            ctx.fill();

            ctx.restore(); // end propeller transform
            ctx.restore(); // end airplane transform
        });
    }
}

