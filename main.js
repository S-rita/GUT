class TestGame extends Phaser.Scene {
    preload ()
    {
        this.load.image('car', 'assets/mistake.jpg');
    }

    create() {
        this.add.text(400, 250, 'Hello');
        this.player = this.createPlayer();
        this.cursors = this.input.keyboard.createCurserKeys();
        // this.add.image(400, 30, 'car').setOrigin(0.5);
    }
        
	update()
	{
		if (this.cursors.left.isDown)
		{
			this.player.setVelocityX(-160)

			this.player.anims.play('left', true)
		}
		else if (this.cursors.right.isDown)
		{
			this.player.setVelocityX(160)

			this.player.anims.play('right', true)
		}
		else
		{
			this.player.setVelocityX(0)

			this.player.anims.play('turn')
		}

		if (this.cursors.up.isDown && this.player.body.touching.down)
		{
			this.player.setVelocityY(-330)
		}
    }

    createPlayer()
    {
        this.player = this.physics.add.image(100, 450, 'car')
        this.player.setBounce(0.2)
        this.player.setCollideWorldBounds(true)
    }
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: TestGame,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    }
};

const game = new Phaser.Game(config);