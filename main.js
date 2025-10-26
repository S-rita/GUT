
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const BACKGROUND_LAYERS = 4;
const SCORE_PER_MAP_CHANGE = 25;
const CAR_W = 120;
const CAR_H = 100;

const crashSound = new Audio("assets/boing.mp3");
crashSound.volume = 0.2;

const sheepSound = new Audio("assets/sheep_normal.mp3");
sheepSound.volume = 0.2;

const sheepCrashSound = new Audio("assets/sheep.mp3");
sheepCrashSound.volume = 0.2;

const woodSound = new Audio("assets/wood.mp3");
woodSound.volume = 0.2;

const jpSound = new Audio("assets/jp.mp3");

const carSound = new Audio("assets/car.mp3");
carSound.loop = true;
carSound.volume = 0;
let carSoundActive = false;

var playerCar;
var myObstacles = [];
var trackLines = [];
var track = [];
var scoreboard;
var mapPool = [
  "england",
  "baguette",
  "japan",
  "usa",
  "thailand"
];
var switch_map = false;
var currentMap = mapPool[0];
var score = 0;
var hasChangedMap = false;
var distance = 0;
var middlePoint = 0;
var speed = 20;
var curvature = 0;
var isSheepSign = 0;
var spawnspawnLane = 0;

// car
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

// obstacle
const obstacles = [];
const obstacles_size = [
  [120, 100], // car_blue_no_wheel
  [120, 100], // car_green_no_wheel
  [120, 100], // car_purple_no_wheel
  [120, 100], // car_yellow_no_wheel
  [80, 100],   // danger_sign
  [70, 80],  // sheep_no_leg
  [80, 100], // sheep_sign
  [60, 100],   // stop_sign
  [100, 100], // traffic_barricade
  [120, 100], // car_yellow_no_wheel
];
const wheel = new Image();
const sheep_leg = new Image();

wheel.src = "assets/obstacle/wheel.svg";
sheep_leg.src = "assets/obstacle/sheep_leg.svg";

const obstacleFiles = [
  "car_blue_no_wheel.svg",
  "car_green_no_wheel.svg",
  "car_purple_no_wheel.svg",
  "car_yellow_no_wheel.svg",
  "danger_sign.svg",
  "sheep_no_leg.svg",
  "sheep_sign.svg",
  "stop_sign.svg",
  "traffic_barricade.svg",
  "car_jp_no_wheel.svg"
];

for (let i = 0; i < obstacleFiles.length; i++) {
  const img = new Image();
  img.src = `assets/obstacle/${obstacleFiles[i]}`;
  obstacles.push(img);
}

// --- helpers ---
const img = (src) => { const i = new Image(); i.src = src; return i; };

const ASSETS = {
  base: {
    wheel, sheep_leg,
    car_wheel, car_no_wheel, car_left_wheel, car_left_no_wheel, car_right_wheel, car_right_no_wheel,
    // your global obstacle sprites:
    car_blue: obstacles[0],
    car_green: obstacles[1],
    car_purple: obstacles[2],
    car_yellow: obstacles[3],
    danger_sign: obstacles[4],
    sheep_no_leg: obstacles[5],
    sheep_sign: obstacles[6],
    stop_sign: obstacles[7],
    barricade: obstacles[8],
    car_jp_no_wheel: obstacles[9],
  },
  country: {
    england: {
      sheep_leg: img("assets/obstacles_england/sheep_leg.svg"),
      sheep_no_leg: img("assets/obstacles_england/sheep_no_leg.svg"),
      sheep_sign: img("assets/obstacles_england/sheep_sign.svg"),
    },
    baguette: {
      cone: img("assets/obstacles_baguette/cone.svg"),
      hydrant: img("assets/obstacles_baguette/hydrant.svg"),
    },
    japan: {
      jp_barricade: img("assets/obstacles_japan/jp_barricade.svg"),
      vending: img("assets/obstacles_japan/vending.svg"),
    },
    usa: {
      garbage: img("assets/obstacles_usa/garbage.svg"),
      stop_text_sign: img("assets/obstacles_usa/stop_text_sign.svg"),
    },
    thailand: {
      market: img("assets/obstacles_thailand/market.svg"),
      tuktuk: img("assets/obstacles_thailand/tuktuk.svg"),
      tuktuk_wheel: img("assets/obstacles_thailand/tuktuk_wheel.svg"),
    },
  }
};

// --- single source of truth for base size etc ---
const OBSTACLE_DEFS = {
  // Global “no wheel” cars (wheel under body, slight shake handled by your component)
  car_blue: { w: 120, h: 100, img1: () => ASSETS.base.wheel, img2: () => ASSETS.base.car_blue, kind: "car_nw" },
  car_green: { w: 120, h: 100, img1: () => ASSETS.base.wheel, img2: () => ASSETS.base.car_green, kind: "car_nw" },
  car_purple: { w: 120, h: 100, img1: () => ASSETS.base.wheel, img2: () => ASSETS.base.car_purple, kind: "car_nw" },
  car_yellow: { w: 120, h: 100, img1: () => ASSETS.base.wheel, img2: () => ASSETS.base.car_yellow, kind: "car_nw" },

  // Signs / static
  danger_sign: { w: 80, h: 100, img1: () => ASSETS.base.danger_sign, kind: "sign" },
  stop_sign: { w: 60, h: 100, img1: () => ASSETS.base.stop_sign, kind: "sign" }, // plays wood sound on hit
  barricade: { w: 100, h: 100, img1: () => ASSETS.base.barricade, kind: "wood" },

  // Sheep special
  sheep_no_leg: { w: 70, h: 80, img1: () => ASSETS.base.sheep_leg, img2: () => ASSETS.base.sheep_no_leg, kind: "sheep" },
  sheep_sign: { w: 80, h: 100, img1: () => ASSETS.base.sheep_sign, kind: "sheep_sign" },

  // JP reverse car (comes from horizon to middle)
  jp_car: { w: 120, h: 100, img1: () => ASSETS.base.car_wheel, img2: () => ASSETS.base.car_jp_no_wheel, kind: "jp_car", startAtBottom: false },
};

// Country-specific adds (sizes are approximate – adjust as yours)
const COUNTRY_DEFS = {
  england: [
    { key: "eng_sheep_no_leg", w: 70, h: 80, img1: () => ASSETS.country.england.sheep_leg, img2: () => ASSETS.country.england.sheep_no_leg, kind: "sheep" },
    { key: "eng_sheep_sign", w: 80, h: 100, img1: () => ASSETS.country.england.sheep_sign, kind: "sheep_sign" },
  ],
  baguette: [
    { key: "fr_cone", w: 70, h: 90, img1: () => ASSETS.country.baguette.cone, kind: "static" },
    { key: "fr_hydrant", w: 90, h: 110, img1: () => ASSETS.country.baguette.hydrant, kind: "static" },
  ],
  japan: [
    { key: "jp_barricade2", w: 100, h: 100, img1: () => ASSETS.country.japan.jp_barricade, kind: "wood" },
    { key: "jp_vending", w: 100, h: 140, img1: () => ASSETS.country.japan.vending, kind: "static" },
    { key: "jp_car", ...OBSTACLE_DEFS.jp_car }, // reuse same special
  ],
  usa: [
    { key: "us_garbage", w: 100, h: 100, img1: () => ASSETS.country.usa.garbage, kind: "static" },
    { key: "us_stop_textsign", w: 60, h: 100, img1: () => ASSETS.country.usa.stop_text_sign, kind: "sign" },
  ],
  thailand: [
    { key: "th_market", w: 140, h: 140, img1: () => ASSETS.country.thailand.market, kind: "static" },
    { key: "th_tuktuk", w: 120, h: 120, img1: () => ASSETS.country.thailand.tuktuk_wheel, img2: () => ASSETS.country.thailand.tuktuk, kind: "car_nw" },
  ],
};

// Build the pool for a given map
function getActiveObstaclePool(map) {
  const base = [
    "car_blue", "car_green", "car_purple", "car_yellow",
    "danger_sign", "stop_sign", "barricade",
  ].map(k => ({ key: k, ...OBSTACLE_DEFS[k] }));

  const country = COUNTRY_DEFS[map] || [];
  return base.concat(country);
}

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
    backgroundBuildingsLayers[i].src = `./assets/background/${map}/${map}_${i + 1
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
//clock to offset 
var worldDistance = 0;

//trees
var tree_types = [
  './assets/trees/tree_1.svg',
  './assets/trees/tree_2.svg'
]

var sprites = [];
var SPAWN_SEQ = 0;
const SPRITE_LIMIT = 60;
var trees = []
var treeImage = new Image();
treeImage.src = tree_types[0] //default 
var lastTreeSpawnAt = 0;
const TREE_SPAWN_GAP = 300; //70 more freq spawning
const TREE_MAX_DEPTH = 700; //500 smoother scaling
const TREE_SCROLL = 0.18;

function isGreenSegment(distance) {
  return Math.sin(20 * Math.pow(1 - (distance / (CANVAS_HEIGHT / 2)), 3) + distance * 0.1) > 0;
}



treeImage.src = tree_types[getRandomBetween(0, 1)];
function spawnSprite(worldDist, img, width, height) {
  if (isGreenSegment(worldDist)) {
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
    if (sprites.length > SPRITE_LIMIT) sprites.shift();
  }
}

function drawEntities() {
  const ctx = myGameArea.context;
  const renderList = [];

  for (let i = sprites.length - 1; i >= 0; i--) {
    const s = sprites[i];

    const camDepth = (s.worldDist - worldDistance);       // <-- z-order key
    if (camDepth <= 0) { sprites.splice(i, 1); continue; }
    const depth = camDepth * s.scrollSpeed;

    // const depth = (s.worldDist - worldDistance) * s.scrollSpeed; // parallax depth
    // if (depth <= 0) { sprites.splice(i, 1); continue; }

    let p = Math.max(0, Math.min(1, 1 - (depth / s.maxDepth)));
    p *= s.scaleRate;

    const screenMiddle = CANVAS_WIDTH / 2 + curvature * 500 * Math.pow((1 - p), 2);
    const screenY = CANVAS_HEIGHT / 2 + p * (CANVAS_HEIGHT / 2);
    const scale = Math.max(0.1, 0.2 + (1 - (depth / s.maxDepth)) * 1.8);

    const bw = s.baseWidth * scale;
    const bh = s.baseHeight * scale;

    const gap = CANVAS_WIDTH * p + 300;
    const leftEdge = screenMiddle - gap / 2;
    const rightEdge = screenMiddle + gap / 2;

    const x = (s.side === 'left') ? leftEdge - bw - s.offset : rightEdge + s.offset;

    renderList.push({ s, x, y: screenY - bh, w: bw, h: bh, camDepth, bottom: (screenY - bh) + bh });
  }

  if (renderList.length > 1) {
    renderList.sort((a, b) => a.bottom - b.bottom);
  }

  // paint
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
  playerCar = new component(CAR_W, CAR_H, null, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100, "image");

  scoreboard = new component("30px", "Consolas", "black", 40, 60, "text");

  sky = new component(CANVAS_WIDTH, CANVAS_HEIGHT / 2, "lightblue", 0, 0);

  document.getElementById("restart").style.display = "none";

  //reset spawn measure
  sprites.length = 0;
  SPAWN_SEQ = 0;
  lastTreeSpawnAt = 0;

  myObstacles = [];
  trackLines = [];
  track = [];
  score = 0;
  distance = 0;
  worldDistance = 0;
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
  spawnLaneOffset = 0
) {
  this.type = type;
  this.width = width;
  this.height = height;
  this.spawnOffset = spawnOffset;
  this.spawnLaneOffset = spawnLaneOffset;
  this.speedX = 0;
  this.toRemove = 0;
  this.x = x;
  this.y = y;

  this.baseWidth;
  this.baseHeight;

  this.image1 = null;
  this.image2 = null;
  this.shakeCounter = 0;

  this.update = function () {
    const ctx = myGameArea.context;
    if (this.type === "text") {
      const padding = 5;
      const textMetrics = ctx.measureText(this.text || "");
      const textWidth = textMetrics.width;
      const textHeight = parseInt(this.width, 10);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(this.x - padding, this.y - textHeight, textWidth + padding * 2, textHeight + padding);

      ctx.font = this.width + " " + this.height;
      ctx.fillStyle = color;
      ctx.fillText(this.text || "", this.x, this.y);

    } else if (this.type === "image") {

      this.shakeCounter += 0.1;
      const shakeOffset = Math.sin(this.shakeCounter) * 1.5;

      if (this.image1) ctx.drawImage(this.image1, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      if (this.image2) ctx.drawImage(this.image2, this.x - this.width / 2, this.y - this.height / 2 + shakeOffset, this.width, this.height);

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
    const rockbottom = CANVAS_HEIGHT + this.height;
    return this.y > rockbottom;
  };

  this.isHitMiddle = function () {
    const rockbottom = CANVAS_HEIGHT / 2;
    return this.y < rockbottom;
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


function getRandomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function gameOver() {
  if (myGameArea.interval) clearInterval(myGameArea.interval);
  const overlay = document.getElementById("restart");
  overlay.style.display = "flex";
}

function spawnFromDef(def, spawnLane) {
  console.log(def);
  // where to start (top/horizon vs bottom)
  const startAtBottom = (def.startAtBottom !== false); // default true = start at horizon half
  let startY = startAtBottom ? (CANVAS_HEIGHT / 2) : CANVAS_HEIGHT;
  if (def.kind === "jp_car") startY = CANVAS_HEIGHT + 400; // explicit: JP car rises to middle

  const obs = new component(def.w, def.h, null,
    CANVAS_WIDTH / 2, startY, "image",
    -50 * spawnLane, -300 * spawnLane
  );

  obs.image1 = def.img1 ? def.img1() : null;
  obs.image2 = def.img2 ? def.img2() : null;
  obs.baseWidth = def.w;
  obs.baseHeight = def.h;
  obs.kind = def.kind;         // for behavior in update/collision
  obs.key = def.key || def.name;

  // sounds on spawn (sheep bleat)
  if (obs.kind === "sheep") sheepSound.play();

  myObstacles.push(obs);
}


function updateGameArea() {
  for (let i = 0; i < myObstacles.length; i++) {
    if (playerCar.crashWith(myObstacles[i])) {
      jpSound.pause();

      const kind = myObstacles[i].kind;
      if (kind === "sheep") {
        sheepCrashSound.play();
      } else if (kind === "wood") {
        woodSound.play();
      } else {
        crashSound.play();
      }

      gameOver();
      return;
    }
  }


  myGameArea.clear();
  myGameArea.frameNo += 1;

  //update clock
  worldDistance += speed;
  distance += speed;

  drawBackgroundLayers(curvature * 300);

  if (myGameArea.frameNo == 1 || everyinterval(5)) {
    draw();
  }

  if (everyinterval(1)) {
    if (worldDistance - lastTreeSpawnAt >= TREE_SPAWN_GAP) {
      lastTreeSpawnAt = worldDistance;
      // spawnSprite(worldDistance             
      spawnSprite(worldDistance + 1.4 * (TREE_MAX_DEPTH / TREE_SCROLL), treeImage, 90, 150);
    }
  }

  for (let i = 0; i < trackLines.length; i++) {
    trackLines[i].update();
  }

  drawEntities();

  // Spawn Obstacles
  if (everyinterval(200)) {
    score += 1;

    const pool = getActiveObstaclePool(currentMap);

    // handle sheep sign wave:
    let lane = Math.random() * 3.6 - 1.8;
    if (isSheepSign) {
      for (let i = 0; i < 2; i++) {
        const sheepDef = pool.find(p => p.kind === "sheep");
        if (sheepDef) {
          spawnFromDef(sheepDef, lane + i * 0.5);
        }
      }
      isSheepSign = false;
    } else {
      const def = pool[Math.floor(Math.random() * pool.length)];

      // roadway signage that should not be in the lane center:
      if (def.key === "danger_sign" || def.kind === "sign" || def.kind === "sheep_sign") {
        if (currentMap === "japan" && def.key === "jp_car") {
          // no-op: jp_car handled below
        } else {
          lane = Math.random() < 0.5 ? -2.5 : 2.5;
        }
      }

      if (def.kind === "sheep_sign") isSheepSign = true;
      spawnFromDef(def, lane);
    }
  }


  // Change Map
  if ((score !== 0 && !hasChangedMap && score % SCORE_PER_MAP_CHANGE === 0) || switch_map) {
    hasChangedMap = true;
    currentMap = mapPool[(mapPool.indexOf(currentMap) + 1) % mapPool.length];
    setBackgroundLayers(currentMap);
    isSheepSign = false;
    switch_map = false;
  }
  if (score % 5 !== 0) hasChangedMap = false;

  // Update Obstacles
  let maxCarGain = 0;

  for (let i = 0; i < myObstacles.length; i++) {
    const o = myObstacles[i];

    // remove conditions
    if ((o.kind !== "jp_car" && o.isHitBottom()) ||
      (o.kind === "jp_car" && o.isHitMiddle())) {
      o.toRemove = true;
      if (o.kind === "jp_car") jpSound.pause();
      continue;
    }

    const half_height = CANVAS_HEIGHT / 2;
    const perspective = (o.y - half_height) / half_height;
    const middlePointObs = CANVAS_WIDTH / 2 + o.spawnOffset + curvature * 500 * Math.pow(1 - perspective, 2);

    let scaleSpeed = 0.1 + (score / 100) * perspective;
    let scaleSize = 0.2 + 1 * perspective;

    // slow down signs if you want (like old code on sheep_sign)
    if (o.kind === "sheep_sign") scaleSpeed *= 0.5;

    // JP car comes “upwards” then stops at middle, with engine sound volume by distance
    if (o.kind === "jp_car") {
      jpSound.play();

      // adjust volume by distance once playing
      const perspectiveClamped = Math.max(0, Math.min(1, (o.y - CANVAS_HEIGHT / 2) / (CANVAS_HEIGHT / 2)));
      jpSound.volume = perspectiveClamped;

      scaleSpeed *= -1; // reverse direction (car moves up)
    }

    if (o.kind === "car_nw") {
      // silent near horizon, then fade in
      const startSilence = 0.25;
      let g = (perspective - startSilence) / (1 - startSilence);
      g = Math.max(0, Math.min(1, g));     // clamp

      // optional: attenuate if far from center lane
      const centerX = CANVAS_WIDTH / 2 + o.spawnOffset + curvature * 500 * Math.pow(1 - perspective, 2);
      const lateral = Math.abs(o.x - centerX);
      const laneAtten = Math.max(0.3, 1 - lateral / 300);

      const wanted = g * laneAtten * 0.45; // cap overall gain
      if (wanted > maxCarGain) maxCarGain = wanted;
    }

    o.y += speed * scaleSpeed;
    const spawnLaneDrift = o.spawnLaneOffset * perspective;
    o.x = middlePointObs + spawnLaneDrift;
    o.width = o.baseWidth * scaleSize;
    o.height = o.baseHeight * scaleSize;
    o.update();
  }

  if (maxCarGain > 0.02) {
    if (!carSoundActive) {
      // start once; catch autoplay errors silently
      carSound.currentTime = 0;
      carSound.play().catch(() => { });
      carSoundActive = true;
    }
    // smooth volume to avoid clicks
    carSound.volume = carSound.volume * 0.8 + maxCarGain * 0.2;
  } else {
    // fade out and pause when inaudible
    carSound.volume = carSound.volume * 0.85;
    if (carSound.volume < 0.01 && carSoundActive) {
      carSound.pause();
      carSoundActive = false;
    }
  }
  myObstacles = myObstacles.filter(o => !o.toRemove);

  // player movement
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

    grass_color = Math.sin(20 * Math.pow(1 - perspective, 3) + distance * 0.006) > 0 ? "green" : "darkgreen";

    trackLines.push(new component(gap, 5, "grey", middlePoint - gap / 2, rowY));

    trackLines.push(new component(middlePoint - gap / 2, 5, grass_color, 0, rowY));

    trackLines.push(new component(CANVAS_WIDTH - middlePoint + gap / 2, 5, grass_color, middlePoint + gap / 2, rowY));

    trackLines.push(new component(15, 5, "white", middlePoint - gap / 2, rowY));
    trackLines.push(new component(15, 5, "white", middlePoint + gap / 2, rowY));


    dashPeriod = 100;
    isDash = Math.sin(30 * Math.pow(1 - perspective, 1.5) + distance * 0.01) > 0;
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