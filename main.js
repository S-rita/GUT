//fucking important = delete sprite after add new one (first in first out)

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const BACKGROUND_LAYERS = 4;
const SCORE_PER_MAP_CHANGE = 25;
const CAR_W = 120;
const CAR_H = 100;

const crashSound = new Audio("assets/boing.mp3");
crashSound.volume = 0.5;

const car_wheel = new Image();
const car_no_wheel = new Image();
const car_left_wheel = new Image();
const car_left_no_wheel = new Image();
const car_right_wheel = new Image();
const car_right_no_wheel = new Image();

car_wheel.src = "assets/car/car_wheel.svg";
car_no_wheel.src = "assets/car/car_no_wheel.svg";
car_left_wheel.src = "assets/car/car_left_wheel.svg";
car_left_no_wheel.src = "assets/car/car_left_no_wheel.svg";
car_right_wheel.src = "assets/car/car_right_wheel.svg";
car_right_no_wheel.src = "assets/car/car_right_no_wheel.svg";

var playerCar;
var myObstacles = [];
var trackLines = [];
var track = [];
var scoreboard;
var mapPool = [
  "england",
  "baguette",
  "japan",
  // "bangkok"
];
var switch_map = false;
var currentMap = mapPool[0];
var score = 0;
var hasChangedMap = false;
var distance = 0;
var middlePoint = 0;
var speed = 10;
var curvature = 0;

var backgroundBuildingsLayers = [
  new Image(),
  new Image(),
  new Image(),
  new Image(),
];

const controls = {
  left: false,
  right: false,
};


function setBackgroundLayers(map) {
  for (let i = 0; i < BACKGROUND_LAYERS; i++) {
    backgroundBuildingsLayers[i].src = `./assets/background/${map}/${map}_${
      i + 1
    }.svg`;
  }
}

function drawBackgroundLayers(offset = 0) {
  var ctx = myGameArea.context;
  for (let i = BACKGROUND_LAYERS - 1; i >= 0; i--) {
    var img = backgroundBuildingsLayers[i];
    if (img && img.complete) {
      var parallaxSpeed = (i + 1) / BACKGROUND_LAYERS;
      var totalOffset = offset * parallaxSpeed;
      var wrappedOffset =
        ((totalOffset % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;

      var imgHeight = (img.height / img.width) * CANVAS_WIDTH;
      var yPos = CANVAS_HEIGHT / 2 - imgHeight;

      ctx.drawImage(img, wrappedOffset, yPos, CANVAS_WIDTH, imgHeight);
      ctx.drawImage(
        img,
        wrappedOffset - CANVAS_WIDTH,
        yPos,
        CANVAS_WIDTH,
        imgHeight
      );
    }
  }
}
//trees
var tree_types = [
    './assets/tree_1.svg', 
    './assets/tree_2.svg'
]

var sprites = []; 
var SPAWN_SEQ = 0; 
const SPRITE_LIMIT = 60; 

var trees = []
var treeImage = new Image(); 
treeImage.src = './assets/tree_1.svg'; //default 
var lastTreeSpawnAt = 0;
const TREE_SPAWN_GAP = 70; //70 more freq spawning
const TREE_MAX_DEPTH = 500; //500 smoother scaling
const TREE_SCROLL = 0.35;

//billboards
var billboards = []; 
var billboardImage = new Image(); 
billboardImage.src = './assets/billboard_1.svg'; 

var lastBillboardSpawnAt = 0;
const BILLBOARD_SPAWN_GAP = 600; //600
const BILLBOARD_MAX_DEPTH = 500; //1500
const BILLBOARD_SCROLL = 0.55

function isGreenSegment(distance){
    return Math.sin(20 * Math.pow(1 - (distance / (myGameArea.canvas.height / 2)), 3) + distance * 0.1) > 0;
}

function spawnBillboard(worldDist){
    if (isGreenSegment(worldDist)){
        sprites.push({
            spawnId: ++SPAWN_SEQ, 
            worldDist,
            baseWidth: 200,
            baseHeight: 200,
            image: billboardImage,
            color: "transparent",
            offset: 30,
            side: Math.random() < 0.5 ? 'left' : 'right',
            scrollSpeed: BILLBOARD_SCROLL, //parallax
            maxDepth: BILLBOARD_MAX_DEPTH,
            scaleRate: 0.85
        });
        console.log("Billboard spawned at ", worldDist); 
        if(sprites.length > SPRITE_LIMIT) sprites.shift(); 
    }
}

function spawnSprite(worldDist, img, width, height){
    if (isGreenSegment(worldDist)){
        sprites.push({
            spawnId: ++SPAWN_SEQ, 
            worldDist,
            baseWidth: width,
            baseHeight: height,
            image: img, 
            color: "transparent", 
            side: Math.random() < 0.5 ? 'left' : 'right',
            offset: getRandomBetween(50, 300), 
            scrollSpeed: TREE_SCROLL,      // parallax
            maxDepth: TREE_MAX_DEPTH,
            scaleRate: 0.80
        }); 
        console.log("Tree spawned at ", worldDist); 
        if(sprites.length > SPRITE_LIMIT) sprites.shift(); 
    }
}


function drawBillboards() {
    var gameCTX = myGameArea.context; 
    var i = 0;
    while (i < billboards.length){
        var b = billboards[i]; 
        var depth = b.worldDist - distance * BILLBOARD_SCROLL;  //dist from player pos
        if (depth <= 0) { billboards.splice(i, 1); continue; }

        var p = Math.max(0, Math.min(1, 1 - (depth / BILLBOARD_MAX_DEPTH)));
        p *= 0.85 //scale rate 

        var screenMiddle = myGameArea.canvas.width / 2 + curvature * 500 * Math.pow((1 - p), 2);

        var screenY = myGameArea.canvas.height/2 + p * (myGameArea.canvas.height/2);
        var scale = Math.max(0.1, 0.2 + (1 - (depth / BILLBOARD_MAX_DEPTH)) * 1.8);

        var bw = b.baseWidth * scale;
        var bh = b.baseHeight * scale;

        var gap = canvas_width * p + 300;
        var leftEdge = screenMiddle - gap / 2;
        var rightEdge = screenMiddle + gap / 2;

        // position left/right of path : 30px offset
        var x = (b.side === 'left') ? leftEdge - bw - 30 : rightEdge + 30;

        if(b.image && b.image.complete){
            gameCTX.drawImage(b.image, x, screenY - bh, bw, bh);  
        } else {
            gameCTX.fillStyle = b.color; 
            gameCTX.fillRect(x, screenY - bh, bw, bh); 
        }

        if (screenY > myGameArea.canvas.height + 50){
            billboards.splice(i, 1);
            continue;
        }
        i++; 
    }
}

function drawEntities() {
  const ctx = myGameArea.context;
  const renderList = [];

  for (let i = sprites.length - 1; i >= 0; i--) {
    const s = sprites[i];

    const depth = s.worldDist - distance * s.scrollSpeed; // parallax depth
    if (depth <= 0) { sprites.splice(i, 1); continue; }

    let p = Math.max(0, Math.min(1, 1 - (depth / s.maxDepth)));
    p *= s.scaleRate;

    const screenMiddle = myGameArea.canvas.width / 2 + curvature * 500 * Math.pow((1 - p), 2);
    const screenY = myGameArea.canvas.height/2 + p * (myGameArea.canvas.height/2);
    const scale = Math.max(0.1, 0.2 + (1 - (depth / s.maxDepth)) * 1.8);

    const bw = s.baseWidth  * scale;
    const bh = s.baseHeight * scale;

    const gap = canvas_width * p + 300;
    const leftEdge  = screenMiddle - gap / 2;
    const rightEdge = screenMiddle + gap / 2;

    const x = (s.side === 'left') ? leftEdge - bw - s.offset : rightEdge + s.offset;

    renderList.push({ s, x, y: screenY - bh, w: bw, h: bh, depth });
  }

    if (renderList.length > 1) {
        renderList.sort((a, b) => b.depth - a.depth);
    }

  // Paint
  for (const r of renderList) {
    const s = r.s;
    if (s.image && s.image.complete) {
      ctx.drawImage(s.image, r.x, r.y, r.w, r.h);
    } else {
      ctx.fillStyle = s.color || 'transparent';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }
}

function startGame() {
  setBackgroundLayers(currentMap);
  playerCar = new component(CAR_W, CAR_H, null, CANVAS_WIDTH / 2, CANVAS_HEIGHT-80, "image");

  scoreboard = new component("30px", "Consolas", "black", 40, 60, "text");

  sky = new component(CANVAS_WIDTH, CANVAS_HEIGHT / 2, "lightblue", 0, 0);

  document.getElementById("restart").style.display = "none";

  myObstacles = [];
  trackLines = [];
  track = [];
  score = 0;
  distance = 0;
  curvature = 0;
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
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.context = this.canvas.getContext("2d");
    document.getElementById("game-container").prepend(this.canvas);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 10);
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
};

function component(
  width,
  height,
  color,
  x,
  y,
  type = null,
  spawnOffset = 0,
  laneOffset = 0
) {
  this.type = type;
  this.width = width;
  this.height = height;
  this.spawnOffset = spawnOffset;
  this.laneOffset = laneOffset;
  this.speedX = 0;
  this.x = x;
  this.y = y;

  this.image1 = null;
  this.image2 = null;
  this.shakeCounter = 0;

  this.update = function () {
    const ctx = myGameArea.context;
    if (this.type === "text") {
      const padding = 5;
      const textMetrics = ctx.measureText(this.text || "");
      const textWidth = textMetrics.width;
      const textHeight = parseInt(this.width, 10); // width holds font size like "30px"
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; 
      ctx.fillRect(this.x - padding, this.y - textHeight, textWidth + padding * 2, textHeight + padding);

      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = color;
      ctx.fillText(this.text || "", this.x, this.y);

    } else if (this.type === "image") {

      this.shakeCounter += 0.1;
      const shakeOffset = Math.sin(this.shakeCounter) * 1.5;

      ctx.drawImage(this.image1, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      ctx.drawImage(this.image2, this.x - this.width / 2, this.y - this.height / 2 + shakeOffset, this.width, this.height);

    } else {

      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  this.newPos = function () {
    this.speedX += this.accelX;
    this.speedX *= 0.9;
    const maxSpeed = 8;
    if (this.speedX > maxSpeed) this.speedX = maxSpeed;
    if (this.speedX < -maxSpeed) this.speedX = -maxSpeed;
    if (
      (this.speedX < 0 && this.x > 90) ||
      (this.speedX > 0 && this.x < CANVAS_WIDTH - 90)
    ) {
      this.x += this.speedX;
    }
  };

  this.isHitBottom = function () {
    const rockbottom = myGameArea.canvas.height + this.height;
    return this.y > rockbottom;
  };

  this.move = function (n) {
    this.accelX = n;
  };

  this.crashWith = function (otherobj) {
    const margin = 30;

    var myleft = this.x + margin;
    var myright = this.x + this.width;
    var mytop = this.y + margin;
    var mybottom = this.y + this.height;
    var otherleft = otherobj.x + margin;
    var otherright = otherobj.x + otherobj.width;
    var othertop = otherobj.y + margin;
    var otherbottom = otherobj.y + otherobj.height;
    var crash = true;
    if (
      mybottom < othertop ||
      mytop > otherbottom ||
      myright < otherleft ||
      myleft > otherright
    ) {
      crash = false;
    }
    return crash;
  };
}

function gameOver() {
  if (myGameArea.interval) clearInterval(myGameArea.interval);

  const overlay = document.getElementById("restart");
  overlay.style.display = "flex";
}

function updateGameArea() {
  for (i = 0; i < myObstacles.length; i += 1) {
      if (playerCar.crashWith(myObstacles[i])) {
        crashSound.play();
        gameOver();
        return;
      } 
  }

  myGameArea.clear();
  myGameArea.frameNo += 1;

  if (myGameArea.frameNo == 1 || everyinterval(5)) {
    distance += speed;
    draw();
  }

  for (let i = 0; i < trackLines.length; i++) {
    trackLines[i].update();
  }

  if (everyinterval(200)) {
    score += 1;

    const lane = (Math.random() * 2 - 1);

    const obs = new component(CAR_W, CAR_H, null, 270, CANVAS_HEIGHT / 2, "image", -50 * lane, -300 * lane);
    obs.image1 = car_wheel;
    obs.image2 = car_no_wheel;
    myObstacles.push(obs);
  }
  // background shift
  drawBackgroundLayers(curvature * 300);

  if ((score !== 0 && !hasChangedMap && score % SCORE_PER_MAP_CHANGE === 0) || switch_map) {
    hasChangedMap = true;
    currentMap = mapPool[(mapPool.indexOf(currentMap) + 1) % mapPool.length];
    setBackgroundLayers(currentMap);
    switch_map = false;
  }
  if (score % 5 !== 0) hasChangedMap = false;

  for (let i = 0; i < myObstacles.length; i++) {
    
    if (myObstacles[i].isHitBottom()) {
      console.log("delete obstacle");
      myObstacles.splice(i, 1);
    }

    half_height = CANVAS_HEIGHT / 2;
    let perspective = (myObstacles[i].y - half_height) / half_height;
    
    const middlePointObs = CANVAS_WIDTH / 2 + myObstacles[i].spawnOffset + curvature * 500 * Math.pow(1 - perspective, 2);

    scaleSpeed = 0.1 + score / 100;
    myObstacles[i].y += speed * scaleSpeed;
    const laneDrift = myObstacles[i].laneOffset * perspective;

    myObstacles[i].x = middlePointObs + laneDrift;

    scale = 0.2 + 1 * perspective;
    myObstacles[i].width = CAR_W * scale;
    myObstacles[i].height = CAR_H * scale;
    myObstacles[i].update();
  }
  
  playerCar.move(0);
  playerCar.image1 = car_wheel;
  playerCar.image2 = car_no_wheel;
  
  if (controls.left && playerCar.x > 70) {
    playerCar.move(-1);
    playerCar.image1 = car_right_wheel;
    playerCar.image2 = car_right_no_wheel;
  }

  if (controls.right && playerCar.x < CANVAS_WIDTH - 70) {
    playerCar.move(1);
    playerCar.image1 = car_left_wheel;
    playerCar.image2 = car_left_no_wheel;
  }

  scoreboard.text = "SCORE: " + score;
  scoreboard.update();

  playerCar.newPos();
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

  trackLines.length = 0;
  offset = 0;
  trackNumber = 0;

  while (trackNumber < track.length && offset <= distance) {
      offset += track[trackNumber][1];
      trackNumber++;
  }

  targetCurvature = track[trackNumber - 1][0];
  
  trackCurveDiff = (targetCurvature - curvature) * 0.01;
  curvature += trackCurveDiff;

  for (j = 0; j < CANVAS_HEIGHT / 2; j++) {
    
    rowY = CANVAS_HEIGHT / 2 + j;
    perspective = j / (CANVAS_HEIGHT / 2);
    middlePoint = CANVAS_WIDTH / 2 + curvature * 500 * Math.pow((1 - perspective), 2);

    gap = CANVAS_WIDTH * perspective + 200;

    if (j == 0) {
        middleValue = middlePoint;
    }

    grass_color = Math.sin(20 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "green" : "darkgreen";

    trackLines.push(new component(gap, 5, "grey", middlePoint - gap/2, rowY));

    trackLines.push(new component(middlePoint - gap/2, 5, grass_color, 0, rowY));

    trackLines.push(new component(CANVAS_WIDTH - middlePoint + gap/2, 5, grass_color, middlePoint + gap/2, rowY));

    trackLines.push(new component(15, 5, "white", middlePoint - gap/2, rowY));
    trackLines.push(new component(15, 5, "white", middlePoint + gap/2, rowY));


    dashPeriod = 100;
    isDash = Math.sin(30 * Math.pow(1 - perspective, 1.5) + distance * 0.1) > 0;
    if (isDash) {
      trackLines.push(new component(4, 5, "white", middlePoint - 2, rowY));
    }
  } 
  
  if (distance > offset) distance = 0;
}

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyA" || e.code === "ArrowLeft") controls.left = true;
  if (e.code === "KeyD" || e.code === "ArrowRight") controls.right = true;
  if (e.code === "ShiftLeft") switch_map = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code === "KeyA" || e.code === "ArrowLeft") controls.left = false;
  if (e.code === "KeyD" || e.code === "ArrowRight") controls.right = false;
});