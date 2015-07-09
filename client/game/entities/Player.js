/**
 * Created by Yunen on 26/05/15.
 */
var DEFAULT_PLAYER_SPEED = 180;

var Player = function(id, x, y){
    this.id = id;
    this.speed = DEFAULT_PLAYER_SPEED;

    Phaser.Sprite.call(this, game, x, y, 'player');
    game.physics.enable(this, Phaser.Physics.ARCADE);
    game.add.existing(this);
};

Player.prototype = Object.create(Phaser.Sprite.prototype);

Player.prototype.handleInput = function() {
    this.handleMovement();
};

Player.prototype.handleMovement = function() {
    var moving = true;

    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        this.body.velocity.y = 0;
        this.body.velocity.x = -this.speed;
    } else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        this.body.velocity.y = 0;
        this.body.velocity.x = this.speed;
    } else if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = -this.speed;
    } else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = this.speed;
    } else {
        moving = false;
        this.freeze();
    }

    if(moving)  {
        // Send move player message
        socket.emit("move player", {id: this.id, x: this.position.x, y: this.position.y});
    }
};

Player.prototype.freeze = function() {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
};