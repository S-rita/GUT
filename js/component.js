export class Component {
  constructor(width, height, color, x, y, type = null, spawnOffset = 0, laneOffset = 0) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.spawnOffset = spawnOffset;
    this.laneOffset = laneOffset;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
  }

  update(ctx) {
    if (this.type === "text") {
      ctx.font = `${this.width} ${this.height}`;
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, this.x, this.y);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  newPos() {
    this.x += this.speedX;
    this.y += this.speedY;
  }

  move(n) {
    this.x += n;
  }
}