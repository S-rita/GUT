import { Component } from "./component.js";

export class Track {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.track = [];
    this.trackLines = [];
    this.curvature = 0;
    this.distance = 0;
  }

  setup() {
    this.track = [
      [0, 100],
      [1, 500],
      [0, 1000],
      [-2, 500],
      [0, 2000],
      [1, 500],
    ];
  }

  draw(distance, speed) {
    let offset = 0;
    let trackNumber = 0;

    while (trackNumber < this.track.length && offset <= distance) {
      offset += this.track[trackNumber][1];
      trackNumber++;
    }

    const targetCurvature = this.track[trackNumber - 1][0];
    this.curvature += (targetCurvature - this.curvature) * 0.01;

    for (let j = 0; j < this.canvasHeight / 2; j += 5) {
      const rowY = this.canvasHeight / 2 + j;
      const perspective = j / (this.canvasHeight / 2);
      const middlePoint = this.canvasWidth / 2 + this.curvature * 500 * Math.pow((1 - perspective), 2);
      const gap = this.canvasWidth * perspective + 200;

      const grassColor = Math.sin(20 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "green" : "darkgreen";
      const lineColor = Math.sin(50 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "red" : "white";

      this.trackLines.push(new Component(gap, 5, "grey", middlePoint - gap / 2, rowY));
      this.trackLines.push(new Component(middlePoint - gap / 2, 5, grassColor, 0, rowY));
      this.trackLines.push(new Component(this.canvasWidth - middlePoint + gap / 2, 5, grassColor, middlePoint + gap / 2, rowY));
      this.trackLines.push(new Component(20, 5, lineColor, middlePoint - gap / 2, rowY));
      this.trackLines.push(new Component(20, 5, lineColor, middlePoint + gap / 2, rowY));

      if (Math.sin(30 * Math.pow(1 - perspective, 1.5) + distance * 0.1) > 0) {
        this.trackLines.push(new Component(4, 5, "white", middlePoint - 2, rowY));
      }
    }

    while (this.trackLines.length > this.canvasHeight) {
      this.trackLines.shift();
    }

    return offset;
  }
}
