export class GameArea {
  constructor(width, height, updateFunc) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.frameNo = 0;
    this.interval = null;
    this.updateFunc = updateFunc;
  }

  start() {
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.interval = setInterval(() => this.updateFunc(), 10);
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
