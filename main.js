const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 700;
const BACKGROUND_LAYERS = 4;

var playerCar;
var myObstacles = [];
var trackLines = [];
var track = [];
var scoreboard;
var mapPool = [
    "england",
    "baguette",
    // "japan",
    // "bangkok"
];
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
    new Image()
];

const controls = {
    left: false,
    right: false,
};

function setBackgroundLayers(map) {
    for (let i = 0; i < BACKGROUND_LAYERS; i++) {
        backgroundBuildingsLayers[i].src = `./assets/background/${map}/${map}_${i+1}.svg`;
    }
}

function drawBackgroundLayers(offset = 0) {
    var ctx = myGameArea.context;
    for (let i = BACKGROUND_LAYERS - 1; i >= 0; i--) {
        var img = backgroundBuildingsLayers[i];
        if (img && img.complete) {
            var parallaxSpeed = (i + 1) / BACKGROUND_LAYERS;
            var totalOffset = offset * parallaxSpeed;
            var wrappedOffset = (((totalOffset) % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;
            
            var imgHeight = (img.height / img.width) * CANVAS_WIDTH;
            var yPos = (CANVAS_HEIGHT / 2) - imgHeight;
            
            ctx.drawImage(img, wrappedOffset, yPos, CANVAS_WIDTH, imgHeight);
            ctx.drawImage(img, wrappedOffset - CANVAS_WIDTH, yPos, CANVAS_WIDTH, imgHeight);
        }
    }
}

function startGame() {
    myGamePiece = new component(30, 30, "red", CANVAS_WIDTH / 2 - 100, 540);
    scoreboard = new component("30px", "Consolas", "black", 280, 40, "text");
    sky = new component(CANVAS_WIDTH, CANVAS_HEIGHT / 2, "lightblue", 0, 0);
    setBackgroundLayers(currentMap);

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
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
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
    this.update = function () {
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
    this.newPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
        this.hitBottom();
    }
    this.hitBottom = function () {
        var rockbottom = myGameArea.canvas.height - this.height;
        if (this.y > rockbottom) {
            this.y = rockbottom;
        }
    }
    this.move = function (n) {
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

    sky.update();

    if (myGameArea.frameNo == 1 || everyinterval(5)) {
        distance += speed;
        draw()
    }

    for (let i = 0; i < trackLines.length; i++) {
        trackLines[i].update();
    }

    if (everyinterval(100)) {
        score += 1;
        myObstacles.push(new component(30, 30, "red", 270, CANVAS_HEIGHT / 2, "obstacle", -50, -300))
    }

    for (let i = 0; i < myObstacles.length; i++) {
        half_height = CANVAS_HEIGHT / 2;
        let perspective = (myObstacles[i].y - half_height) / half_height;

        const middlePointObs = CANVAS_WIDTH / 2 + myObstacles[i].spawnOffset + curvature * 500 * Math.pow(1 - perspective, 2);

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

    // background shift
    drawBackgroundLayers(curvature * 300);

    if (score !== 0 && !hasChangedMap && score % 5 === 0) {
        hasChangedMap = true;
        currentMap = mapPool[(mapPool.indexOf(currentMap) + 1) % mapPool.length];
        setBackgroundLayers(currentMap);
    }
    if (score % 5 !== 0) hasChangedMap = false; 


    scoreboard.text = "SCORE: " + score;
    scoreboard.update();

    myGamePiece.newPos();

    myGameArea.canvas
        .getContext("2d")
        .drawImage(
            document.getElementById("car"),
            myGamePiece.x,
            540,
            200,
            125
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

    for (j = 0; j < CANVAS_HEIGHT / 2; j += 5) {

        rowY = CANVAS_HEIGHT / 2 + j;
        perspective = j / (CANVAS_HEIGHT / 2);
        middlePoint = CANVAS_WIDTH / 2 + curvature * 500 * Math.pow((1 - perspective), 2);

        gap = CANVAS_WIDTH * perspective + 200;

        if (j == 0) {
            middleValue = middlePoint;
        }

        grass_color = Math.sin(20 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "green" : "darkgreen";
        line_color = Math.sin(50 * Math.pow(1 - perspective, 3) + distance * 0.1) > 0 ? "red" : "white";

        trackLines.push(new component(gap, 5, "grey", middlePoint - gap / 2, rowY));

        trackLines.push(new component(middlePoint - gap / 2, 5, grass_color, 0, rowY));

        trackLines.push(new component(CANVAS_WIDTH - middlePoint + gap / 2, 5, grass_color, middlePoint + gap / 2, rowY));

        trackLines.push(new component(20, 5, line_color, middlePoint - gap / 2, rowY));
        trackLines.push(new component(20, 5, line_color, middlePoint + gap / 2, rowY));

        trackLines.push(new component(20, 5, line_color, middlePoint + gap / 2, rowY));

        dashPeriod = 100;
        isDash = Math.sin(30 * Math.pow(1 - perspective, 1.5) + distance * 0.1) > 0;
        if (isDash) {
            trackLines.push(new component(4, 5, "white", middlePoint - 2, rowY));
        }
    }

    while (trackLines.length > CANVAS_HEIGHT / 1) {
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