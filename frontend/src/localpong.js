import PongRenderer from "./pongrenderer.js";

class PongGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id ${canvasId} not found`);
        }
        this.renderer = new PongRenderer(this.canvas);
        this.paddle1 = { x: this.canvas.width / 80, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.paddle2 = { x: this.canvas.width - this.canvas.width / 40, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: 10, dx: 4, dy: 4 };
        this.endScore = 3;
        this.score1 = 0;
        this.score2 = 0;
        this.commands = { up: 0, down: 0, w: 0, s: 0 };
        this.reset = false;

        // document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        // document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        // document.addEventListener('keydown', (event) => this.resumeGame(event, this.reset));
        // document.addEventListener('keydown', (event) => this.resumeGame(event));
    }

    handleKeyDown(event) {
        switch (event.key) {
            case 'ArrowUp':
                this.commands.up = 1;
                break;
            case 'ArrowDown':
                this.commands.down = 1;
                break;
            case 'w':
                this.commands.w = 1;
                break;
            case 's':
                this.commands.s = 1;
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.key) {
            case 'ArrowUp':
                this.commands.up = 0;
                break;
            case 'ArrowDown':
                this.commands.down = 0;
                break;
            case 'w':
                this.commands.w = 0;
                break;
            case 's':
                this.commands.s = 0;
                break;
        }
    }

    drawPaddle(paddle) {
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        let gradient = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        gradient.addColorStop(0, "lightgrey");
        gradient.addColorStop(0.5, "lightblue");
        gradient.addColorStop(1, "lightgrey");
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        this.ctx.shadowColor = "transparent";
    }

    drawScore() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect((this.canvas.width / 4) - 7, 25, 30, 30);
        this.ctx.fillRect((this.canvas.width / 4) * 3 - 7, 25, 30, 30);

        this.ctx.font = "30px Audiowide";
        this.ctx.fillStyle = "#ff4632";

        this.ctx.shadowColor = "#ff4632"
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(this.score1, (this.canvas.width / 4), 50);
        this.ctx.fillText(this.score2, (this.canvas.width / 4) * 3, 50);
        this.ctx.shadowColor = "transparent";
    }

    drawBall() {
        let gradient = this.ctx.createRadialGradient(this.ball.x, this.ball.y, this.ball.radius / 4, this.ball.x, this.ball.y, this.ball.radius);
        gradient.addColorStop(0, "lightblue");
        gradient.addColorStop(1, "lightgrey");
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 4;
        this.ctx.shadowOffsetY = 4;
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.shadowColor = "transparent";
    }

    movePaddles() {
        if (this.commands.up == 1)
            this.paddle2.y = Math.max(this.paddle2.y - this.paddle2.dy, 0);
        if (this.commands.down == 1)
            this.paddle2.y = Math.min(this.paddle2.y + this.paddle2.dy, this.canvas.height - this.paddle2.height);
        if (this.commands.w == 1)
            this.paddle1.y = Math.max(this.paddle1.y - this.paddle1.dy, 0);
        if (this.commands.s == 1)
            this.paddle1.y = Math.min(this.paddle1.y + this.paddle1.dy, this.canvas.height - this.paddle1.height);
    }

    pingPong() {
        if (this.ball.y + this.ball.radius > this.canvas.height || this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
        }
        if (this.ball.x + this.ball.radius > this.canvas.width - 20 && this.ball.y + this.ball.radius > this.paddle2.y && this.ball.y + this.ball.radius < this.paddle2.y + 100 && this.ball.dx > 0) {
            this.ball.dx = -this.ball.dx;
            let deltaY = (this.ball.y - (this.paddle1.y + this.paddle2.height / 2)) / (this.paddle2.height / 2);
            this.ball.dy = deltaY * 2;
        } else if (this.ball.x + this.ball.radius < 40 && this.ball.y + this.ball.radius > this.paddle1.y && this.ball.y + this.ball.radius < this.paddle1.y + 100 && this.ball.dx < 0) {
            this.ball.dx = -this.ball.dx;
            let deltaY = (this.ball.y - (this.paddle1.y + this.paddle1.height / 2)) / (this.paddle1.height / 2);
            this.ball.dy = deltaY * 2;
        }
    }

    gameEnd() {
        this.renderer.drawGameOverMessage(this.score1 > this.score2 ? 1 : 2);
    }

    setup()
    {
        this.paddle1 = { x: this.canvas.width / 80, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.paddle2 = { x: this.canvas.width - this.canvas.width / 40, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
        this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: 10, dx: 4, dy: 4 };
    }
    gameLoop() {
        console.log("La game loop se lance");
        this.movePaddles();
        this.renderer.renderingLoop(this.paddle1, this.paddle2, this.score1, this.score2, this.ball);
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        this.pingPong();
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            let winner;
            this.ball.dx > 0 ? (this.score1 += 1, winner = 1) : (this.score2 += 1, winner = 2);
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height / 2;
            this.ball.dx = this.ball.dx > 0 ? -4 : 4;
            this.ball.dy = 4;
            this.paused = true;
            this.renderer.drawPauseMessage(winner);
            if (this.paused) return;
        }
        if (this.score1 == this.endScore || this.score2 == this.endScore) {
            this.gameEnd();
            
            this.ball.dy = 4;
            this.paused = true;
            document.addEventListener('keydown', (event) => this.resumeGame(event, true));
            if (this.paused) return;
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    resumeGame(event, reset = false) {
        if (event.code === 'Space') {
            if (reset === true) {
                this.score1 = 0;
                this.score2 = 0;
                this.paddle1 = { x: this.canvas.width / 80, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
                this.paddle2 = { x: this.canvas.width - this.canvas.width / 40, y: this.canvas.height / 2 - this.canvas.height / 8, width: this.canvas.width / 80, height: this.canvas.height / 4, dy: this.canvas.height / 40 };
                this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: 10, dx: 4, dy: 4 };
                this.endScore = 3;
            }
            this.reset = false;

            requestAnimationFrame(() => this.gameLoop());
        }
    }
}
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.paused = true;
        cancelAnimationFrame(this.animationFrameId);
        document.removeEventListener('keydown', this.resumeGame);
        document.removeEventListener('keydown', (event) => this.handleKeyDown(event));
        document.removeEventListener('keyup', (event) => this.handleKeyUp(event));
        document.removeEventListener('keydown', (event) => this.resumeGame(event));
    } else {
        this.paused = false;
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
});
export default PongGame;