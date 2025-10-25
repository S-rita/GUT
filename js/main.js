import { GameArea } from "./gameArea.js";
import { Component } from "./component.js";
import { controls } from "./input.js";
import { Track } from "./track.js";

const canvasWidth = 960;
const canvasHeight = 700;

let gameArea, player, sky, scoreboard, track;
let speed = 10;
let score = 0;
let distance = 0;
let obstacles = [];

function startGame() {
  gameArea = new GameArea(canvasWidth, canvasHeight, updateGameArea);
  player = new Component(30, 30, "red", canvasWidth / 2 - 100, 540);
  scoreboard = new Component("30px", "Consolas", "black", 280, 40, "text");
  sky = new Component(canvasWidth, canvasHeight / 2, "lightblue", 0, 0);
  track = new Track(canvasWidth, canvasHeight);
  track.setup();

  gameArea.start();
}

function updateGameArea() {
  gameArea.clear();
  const ctx = gameArea.context;
  gameArea.frameNo += 1;

  sky.update(ctx);

  if (gameArea.frameNo === 1 || everyInterval(5)) {
    distance += speed;
    track.draw(distance, speed);
  }

  for (const line of track.trackLines) {
    line.update(ctx);
  }

  if (everyInterval(200)) {
    score++;
    obstacles.push(new Component(30, 30, "red", 270, canvasHeight / 2, "obstacle", -50, -300));
  }

  for (const obs of obstacles) {
    const halfHeight = canvasHeight / 2;
    const perspective = (obs.y - halfHeight) / halfHeight;
    const middlePoint = canvasWidth / 2 + obs.spawnOffset + track.curvature * 500 * Math.pow(1 - perspective, 2);
    obs.y += speed * 0.1;
    obs.x = middlePoint + obs.laneOffset * perspective;
    obs.update(ctx);
  }

  // Player movement
  if (controls.left) player.move(-5);
  if (controls.right) player.move(5);

  scoreboard.text = `SCORE: ${score}`;
  scoreboard.update(ctx);

  player.newPos();
  ctx.drawImage(document.getElementById("car"), player.x, 540, 200, 125);
}

function everyInterval(n) {
  return gameArea.frameNo % n === 0;
}

window.addEventListener("DOMContentLoaded", startGame);