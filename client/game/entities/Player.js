/**
 * Created by Yunen on 26/05/15.
 */
var DEFAULT_PLAYER_SPEED = 180;
var MASS_SPEED_CONSTANT = 300;

/**
 * Player Constructor
 * @param id
 * @param x
 * @param y
 * @param character
 * @constructor
 */
var Player = function(id, x, y, character){
    this.id = id;
    this.speed = DEFAULT_PLAYER_SPEED;
    // breath counting
    this.counter = 1;
    // mass: player quits when mass < 5
    this.mass = 10;

    /**
     * speed_factor concept:
     * speed_factor * sqrt(mass) = constant
     * radius^2 ~ mass
     */
    this.speed_factor = MASS_SPEED_CONSTANT/Math.sqrt(this.mass);
    this.radius = Math.sqrt(this.mass) / 3;

    // point: accumulated score
    this.point = 0;

    var playerInfo = {
        bitmapSize: 50,
        smallCircleSize: 20,
        bigCircleSize: 25
    };
    this.circle = game.make.bitmapData(playerInfo.bitmapSize, playerInfo.bitmapSize);
    this.circle.addToWorld();

    // create gradientFill, gradientFill's coordinate used position of the circle
    var gradientFill = this.circle.context.createRadialGradient(playerInfo.bitmapSize/2, playerInfo.bitmapSize/2, 0, playerInfo.bitmapSize/2, playerInfo.bitmapSize/2, playerInfo.bitmapSize);

    switch(character) {
        case 0:
            gradientFill.addColorStop(0,'rgba(0,200,250,0.5)');
            gradientFill.addColorStop(1,'rgba(0,200,250,0)');
            break;
        case 1:
            gradientFill.addColorStop(0,'rgba(255,0,3,0.5)');
            gradientFill.addColorStop(1,'rgba(255,0,3,0)');
            break;
        case 2:
            gradientFill.addColorStop(0,'rgba(5,205,0,0.5)');
            gradientFill.addColorStop(1,'rgba(5,205,0,0)');
            break;
    }

    // create inner circle
    this.circle.circle(playerInfo.bitmapSize/2, playerInfo.bitmapSize/2, playerInfo.smallCircleSize, 'rgba(255,255,255,0.75)');
    // create outer circle
    this.circle.circle(playerInfo.bitmapSize/2, playerInfo.bitmapSize/2, playerInfo.bigCircleSize, gradientFill);

    Phaser.Sprite.call(this, game, x, y, this.circle);
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.collideWorldBounds=true;
    this.scale.x = this.radius;
    this.scale.y = this.radius;
    game.add.existing(this);
};

Player.prototype = Object.create(Phaser.Sprite.prototype);

Player.prototype.handleInput = function() {
    this.handleMovement();
};

/**
 * Update player's mass and recalculate its speed_factor
 * @param mass
 */
Player.prototype.updateMass = function(mass) {
    this.mass = mass;
    this.speed_factor = MASS_SPEED_CONSTANT/Math.sqrt(this.mass);
    this.radius = Math.sqrt(this.mass) / 3;
    this.scale.x = this.radius;
    this.scale.y = this.radius;
};

/**
 * Add some points to player's point
 * @param point
 */
Player.prototype.addPoint = function(point) {
    this.point += point;
    ground.scoretext.setText("Score : " + this.point);
};


/**
 * Set player's point
 * @param point
 */
Player.prototype.setPoint = function(point) {
    this.point = point;
    ground.scoretext.setText("Score : " + this.point);
};

// Breath
Player.prototype.breathe = function() {

    if (this.growing) {
        this.counter += 0.01;
    }
    else {
        this.counter -= 0.01;
    }

    if (this.counter > 1.3) {
        this.growing = false;
    }
    else if (this.counter < 1) {
        this.growing = true;
    }

    this.scale.setTo(this.counter, this.counter);
};

/**
 * Player movement event handler
 * handling inputs from keyboard or gyro
 */
Player.prototype.handleMovement = function() {
    var self = this;

    // Collisions
    game.physics.arcade.overlap(this, ground.dots, eatingDot, null, this);

    // Gyro control
    // setting gyroscope update frequency
    gyro.frequency = 20;
    // start gyroscope detection
    gyro.startTracking(function(o) {
        // updating player velocity
        // Modify speed_factor for better control
        self.body.velocity.x = self.body.velocity.x / 10 + Math.sqrt(Math.abs(o.gamma)) * self.speed_factor * (o.gamma/Math.abs(o.gamma)) * 7;
        self.body.velocity.y = self.body.velocity.y / 10 + Math.sqrt(Math.abs(o.beta)) * self.speed_factor * (o.beta/Math.abs(o.beta)) * 7;
    });

    // Send move player message
    socket.emit("move player", {id: this.id, x: this.position.x, y: this.position.y, mass: this.mass, point: this.point});

    // collisionHandler
    // collide with a dot
    function eatingDot(player, dot) {
        //kill dot
        dot.kill();

        // Update player information
        player.updateMass(player.mass + 1);
        player.addPoint(1);

        // Send remove dot message
        socket.emit("remove dot", {id: dot.id});

        // dot will be destroyed when server broadcast back
    }
};