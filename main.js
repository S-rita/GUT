const canvas_width = 960;
const canvas_height = 700;

var myGamePiece;
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

//trees
var tree_types = [
    './assets/tree_1.svg', 
    './assets/tree_2.svg'
]
var trees = []
var treeImage = new Image(); 
treeImage.src = './assets/tree_1.svg'; //default 
var lastTreeSpawnAt = 0;
var TREE_SPAWN_GAP = 600; //600
var TREE_MAX_DEPTH = 500; //1500

//billboards
var billboards = []; 
var billboardImage = new Image(); 
billboardImage.src = './assets/billboard_1.svg'; 

var lastBillboardSpawnAt = 0;
var BILLBOARD_SPAWN_GAP = 600; //600
var BILLBOARD_MAX_DEPTH = 500; //1500

function isGreenSegment(distance){
    return Math.sin(20 * Math.pow(1 - (distance / (myGameArea.canvas.height / 2)), 3) + distance * 0.1) > 0;
}

function spawnBillboard(worldDist){
    if (isGreenSegment(worldDist)){
        billboards.push({
            worldDist,
            baseWidth: 200,
            baseHeight: 200,
            image: billboardImage, 
            color: "transparent", 
            side: Math.random() < 0.5 ? 'left' : 'right'
        }); 
        console.log("Billboard spawned at ", worldDist); 
    }
}

function drawBillboards() {
    var gameCTX = myGameArea.context; 
    var i = 0;
    while (i < billboards.length){
        var b = billboards[i]; 
        var depth = b.worldDist - distance;  //dist from player pos
        if (depth <= 0) { billboards.splice(i, 1); continue; }

        var p = Math.max(0, Math.min(1, 1 - (depth / BILLBOARD_MAX_DEPTH)));

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
            gameCTX.drawImage(b.image, x, screenY - bh - 10, bw, bh);  
        } else {
            gameCTX.fillStyle = b.color; 
            gameCTX.fillRect(x, screenY - bh - 10, bw, bh); 
        }

        if (screenY > myGameArea.canvas.height + 50){
            billboards.splice(i, 1);
            continue;
        }
        i++; 
    }
}


function startGame() {
  myGamePiece = new component(30, 30, "red", 270, 540);
  scoreboard = new component("30px", "Consolas", "black", 280, 40, "text");
  track.push([0, 100]);
  track.push([1, 500]);
  track.push([0, 1000]);
  track.push([-2, 500]);
  track.push([0, 2000]);
  track.push([1, 500]);
  myGameArea.start();
}

var myGameArea = {
  canvas: document.createElement("canvas"),
  start: function () {
    this.canvas.width = canvas_width;
    this.canvas.height = canvas_height;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 10);
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
};

function component(width, height, color, x, y, spawnOffset=0, laneOffset=0) {
  this.score = 0;
  this.width = width;
  this.height = height;
  this.spawnOffset = spawnOffset;
  this.laneOffset = laneOffset;
  this.speedX = 0;
  this.speedY = 0;    
  this.x = x;
  this.y = y;
  this.update = function() {
      ctx = myGameArea.context;
      if (this.type == "text") {
          ctx.font = this.width + " " + this.height;
          ctx.fillStyle = color;
          ctx.fillText(this.text, this.x, this.y);
      } else {
          ctx.fillStyle = color;
          ctx.fillRect(this.x, this.y, this.width, this.height);
      }
  }
  this.newPos = function() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.hitBottom();
  }
  this.hitBottom = function() {
      var rockbottom = myGameArea.canvas.height - this.height;
      if (this.y > rockbottom) {
          this.y = rockbottom;
      }
  }
  this.move = function(n) {
      this.x += n;
  } 
  // this.crashWith = function(otherobj) {
  //     var myleft = this.x;
  //     var myright = this.x + (this.width);
  //     var mytop = this.y;
  //     var mybottom = this.y + (this.height);
  //     var otherleft = otherobj.x;
  //     var otherright = otherobj.x + (otherobj.width);
  //     var othertop = otherobj.y;
  //     var otherbottom = otherobj.y + (otherobj.height);
  //     var crash = true;
  //     if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
  //         crash = false;
  //     }
  //     return crash;
  // }
}

function updateGameArea() {
    // for (i = 0; i < myObstacles.length; i += 1) {
    //     if (myGamePiece.crashWith(myObstacles[i])) {
    //         return;
    //     } 
    // }

    myGameArea.clear();
    myGameArea.frameNo += 1;

    canvasHeight = myGameArea.canvas.height;
    canvasWidth = myGameArea.canvas.width;

    if (myGameArea.frameNo == 1 || everyinterval(5)) {
        x = myGameArea.canvas.width;
        y = myGameArea.canvas.height;
        distance += speed;
        //billboard
        if (distance - lastBillboardSpawnAt >= BILLBOARD_SPAWN_GAP){
            lastBillboardSpawnAt = distance; 
            spawnBillboard(distance + 500); 
        }

        draw(myGameArea.canvas)
    }
    for (i = 0; i < trackLines.length; i++) {
        trackLines[i].update();
    }
    
    drawBillboards(); 

    if (everyinterval(200)) {
        myObstacles.push(new component(30, 30, "red", 270, 240, 0, 0))
    }

    console.log("curve", curvature);
    for (let i = 0; i < myObstacles.length; i++) {
        const halfH = canvasHeight / 2;
        let perspective = (myObstacles[i].y - halfH) / halfH;
        
        const middlePointObs = canvasWidth / 2 + myObstacles[i].spawnOffset + curvature * 500 * Math.pow(1 - perspective, 2);

        myObstacles[i].y += speed * 0.1;
        const laneDrift = myObstacles[i].laneOffset * (perspective);
        
        myObstacles[i].x = middlePointObs + laneDrift;

        myObstacles[i].update();
    }

  // player movement
  if (controls.left) {
    myGamePiece.move(-5);
  }
  if (controls.right) {
    myGamePiece.move(5);
  }

  scoreboard.text = "SCORE: " + score;
  scoreboard.update();
  myGamePiece.newPos();
  // myGamePiece.update();
  myGameArea.canvas
    .getContext("2d")
    .drawImage(
      document.getElementById("car"),
      myGamePiece.x,
      530,
      200,
      150
    );
}

function everyinterval(n) {
  if ((myGameArea.frameNo / n) % 1 == 0) {
    return true;
  }
  return false;
}

function accelerate(n) {
  myGamePiece.gravity = n;
}

function draw(canvas) {
    x = canvas.width;
    y = canvas.height;
    
    offset = 0;
    trackNumber = 0;

    while (trackNumber < track.length && offset <= distance) {
        offset += track[trackNumber][1];
        trackNumber++;
    }

    targetCurvature = track[trackNumber - 1][0];
    
    trackCurveDiff = (targetCurvature - curvature) * 0.01;
    curvature += trackCurveDiff;

    for (j = 0; j < y / 2; j+=5) {

        perspective = j / (y / 2);
        middlePoint = x / 2 + curvature * 500 * Math.pow((1 - perspective), 2);
    
        gap = canvas_width * perspective + 300;

        if (j == 0) {
            middleValue = middlePoint;
        }

        color = Math.sin(20 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "green" : "darkgreen";
        trackLines.push(new component(middlePoint - gap/2, 5, color, 0, y/2 + j));
        trackLines.push(new component(x - middlePoint + gap/2, 5, color, middlePoint + gap/2, y/2 + j));
    } 
    while (trackLines.length > y/5) {
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