const canvas_width = 960;
const canvas_height = 540;
const CAR_W = 120, CAR_H = 100;

var playerCar;
var myObstacles = [];
var trackLines = [];
var track = [];
var scoreboard;
var score = 0;
var distance = 0;
var middlePoint = 0;
var speed = 10;
var curvature = 0;

const controls = {
  left: false,
  right: false,
};


function startGame() {
  playerCar = new component(CAR_W, CAR_H, null, canvas_width / 2, 480, "image");
  playerCar.imageId = "car";

  scoreboard = new component("30px", "Consolas", "black", 280, 40, "text");
  sky = new component(canvas_width, canvas_height / 2, "lightblue", 0, 0);

  document.getElementById("restart").style.display = "none";
  
  myObstacles = [];
  trackLines  = [];
  track       = [];
  score       = 0;
  distance    = 0;
  curvature   = 0;
  myGameArea.frameNo = 0;
  
  track.push([0, 1000]);
  track.push([1, 500]);
  track.push([0, 1000]);
  track.push([-2, 500]);
  track.push([0, 3000]);
  track.push([1, 500]);
  myGameArea.start();
}

var myGameArea = {
  canvas: document.createElement("canvas"),
  start: function () {
    this.canvas.width = canvas_width;
    this.canvas.height = canvas_height;
    this.context = this.canvas.getContext("2d");
    document.getElementById("game-container").prepend(this.canvas);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 10);
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
};

function component(width, height, color, x, y, type = null, spawnOffset = 0, laneOffset = 0) {
  this.type = type;
  this.score = 0;
  this.width = width;
  this.height = height;
  this.spawnOffset = spawnOffset;
  this.laneOffset = laneOffset;
  this.speedX = 0;
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.imageId = null;     // ← add this
  this.update = function () {
    const ctx = myGameArea.context;
    if (this.type === "text") {
      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = color;
      ctx.fillText(this.text || "", this.x, this.y);
    } else if (this.type === "image" && this.imageId) {
      const img = document.getElementById(this.imageId);
      ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  };

  this.newPos = function () {
    this.x += this.speedX;
    this.y += this.speedY;
    this.hitBottom();
  };

  this.hitBottom = function () {
    const rockbottom = myGameArea.canvas.height - this.height;
    if (this.y > rockbottom) this.y = rockbottom;
  };

  this.move = function (n) { 
    this.x += n; 
  };

  this.crashWith = function(otherobj) {
    const margin = 30;

    var myleft = this.x + margin;
    var myright = this.x + (this.width);
    var mytop = this.y + margin;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x + margin;
    var otherright = otherobj.x + (otherobj.width);
    var othertop = otherobj.y + margin;
    var otherbottom = otherobj.y + (otherobj.height);
    var crash = true;
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
        crash = false;
    }
    return crash;
  }
}

function gameOver() {
  if (myGameArea.interval) clearInterval(myGameArea.interval);

  const overlay = document.getElementById("restart");
  overlay.style.display = "flex";
}

function updateGameArea() {
  for (i = 0; i < myObstacles.length; i += 1) {
      if (playerCar.crashWith(myObstacles[i])) {
        gameOver();
        return;
      } 
  }

  myGameArea.clear();
  myGameArea.frameNo += 1;
  
  sky.update();

  if (myGameArea.frameNo == 1 || everyinterval(5)) {
    distance += speed;
    draw()
  }
  
  for (i = 0; i < trackLines.length; i++) {
    trackLines[i].update();
  }

  if (everyinterval(200)) {
    score += 1;
    
    const lane = (Math.random() * 2 - 1);

    const obs = new component(CAR_W, CAR_H, null, 270, canvas_height / 2, "image", -50 * lane, -300 * lane);
    obs.imageId = "car";
    myObstacles.push(obs);
  }

  for (let i = 0; i < myObstacles.length; i++) {
    half_height = canvas_height / 2;
    let perspective = (myObstacles[i].y - half_height) / half_height;
    
    const middlePointObs = canvas_width / 2 + myObstacles[i].spawnOffset + curvature * 500 * Math.pow(1 - perspective, 2);

    scaleSpeed = 0.1 + score / 100;
    myObstacles[i].y += speed * scaleSpeed;
    const laneDrift = myObstacles[i].laneOffset * (perspective);
    
    myObstacles[i].x = middlePointObs + laneDrift;

    scale = 0.2 + 1 * perspective;
    myObstacles[i].width  = CAR_W * scale;
    myObstacles[i].height = CAR_H * scale;

    myObstacles[i].update();
  }

  playerCar.imageId = "car";
  
  if (controls.left && playerCar.x > 70) {
    playerCar.move(-5);
    playerCar.imageId = "car-right";
  }

  if (controls.right && playerCar.x < canvas_width - 70) {
    playerCar.move(5);
    playerCar.imageId = "car-left";
  }

  scoreboard.text = "SCORE: " + score;

  scoreboard.update();
  playerCar.update();
}

function everyinterval(n) {
  if ((myGameArea.frameNo / n) % 1 == 0) {
    return true;
  }
  return false;
}

function accelerate(n) {
  playerCar.gravity = n;
}

function draw() {

    offset = 0;
    trackNumber = 0;

    while (trackNumber < track.length && offset <= distance) {
        offset += track[trackNumber][1];
        trackNumber++;
    }

    targetCurvature = track[trackNumber - 1][0];
    
    trackCurveDiff = (targetCurvature - curvature) * 0.01;
    curvature += trackCurveDiff;

    for (j = 0; j < canvas_height / 2; j+=5) {
      
      rowY = canvas_height / 2 + j;
      perspective = j / (canvas_height / 2);
      middlePoint = canvas_width / 2 + curvature * 500 * Math.pow((1 - perspective), 2);
  
      gap = canvas_width * perspective + 200;

      if (j == 0) {
          middleValue = middlePoint;
      }

      grass_color = Math.sin(20 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "green" : "darkgreen";
      line_color = Math.sin(50 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "red" : "white";

      trackLines.push(new component(gap, 5, "grey", middlePoint - gap/2, rowY));

      trackLines.push(new component(middlePoint - gap/2, 5, grass_color, 0, rowY));

      trackLines.push(new component(canvas_width - middlePoint + gap/2, 5, grass_color, middlePoint + gap/2, rowY));

      trackLines.push(new component(20, 5, line_color, middlePoint - gap/2, rowY));
      trackLines.push(new component(20, 5, line_color, middlePoint + gap/2, rowY));

      trackLines.push(new component(20, 5, line_color, middlePoint + gap/2, rowY));

      dashPeriod = 100;
      isDash = Math.sin(30 * Math.pow(1 - perspective, 1.5) + distance * 0.1) > 0;
      if (isDash) {
        trackLines.push(new component(4, 5, "white", middlePoint - 2, rowY));
      }
    } 

    while (trackLines.length > canvas_height/1) {
        trackLines.shift();
    }
    
    if (distance > offset) distance = 0;
}

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyA") controls.left = true;
  if (e.code === "KeyD") controls.right = true;
  console.log(controls);
});

document.addEventListener("keyup", (e) => {
  if (e.code === "KeyA") controls.left = false;
  if (e.code === "KeyD") controls.right = false;
});