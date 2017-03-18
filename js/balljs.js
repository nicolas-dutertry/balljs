$(function () {
    
    const ratio1 = $(document).width() / 550;
    const ratio2 = $(document).height() / 820;
    
    const ratio = (ratio1 > ratio2) ? ratio2 : ratio1;

    const ballradius = 9*ratio;
    const blocklength = 58*ratio;
    const blockspace = 12*ratio;
    const blockperrow = 7;
    const blockpercol = 8;
    const speed = 700*ratio;
    const width = 500*ratio;
    const height = 710*ratio;
    const fontSize = 20*ratio;
    
    const blocks = new Array();
    const balls = new Array();
    
    $("#main").width(width);
    
    const scoreDiv = $("<div id='score'></div>");
    scoreDiv.css("font-size", fontSize*2 + "px");
    $("#main").append(scoreDiv);
    $("#main").append($("<canvas id='canvas' width='" + width + "' height='" + height + "'></canvas>"));
    const messageDiv = $("<div id='message'></div>");
    messageDiv.css("font-size", fontSize*2 + "px");
    messageDiv.html("&nbsp;");
    $("#main").append(messageDiv);
    
    
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    
    var launchx = width / 2;    
    var level = 0;    
    var mousePos = null;
    var gameover = false;

    class Block {
        constructor(x, y, length, counter) {
            this.x = x;
            this.y = y;
            this.length = length;
            this.counter = counter;
        }

        draw() {
            var hue = 0.1 + this.counter/50;
            var rgb = hsv2rgb(hue, 1, 1);
            ctx.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
            ctx.fillRect(this.x, this.y, this.length, this.length);
            ctx.font = fontSize + "px Courier";
            ctx.fillStyle = "rgb(0,0,0)";
            ctx.fillText("" + this.counter, this.x + 5, this.y + this.length - 5);
        }
    }

    class Ball {
        constructor(starttime, x, y, radius, speedx, speedy) {
            this.starttime = starttime;
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.speedx = speedx;
            this.speedy = speedy;
            this.computeCollisionTime();
        }

        computeCollisionTime() {
            this.collisionTime = null;
            this.collisionType = null;
            this.collisionBlock = null;

            var collisionXTime;
            var collisionXType;
            if (this.speedx > 0) {
                collisionXTime = (width - this.radius - this.x) * 1000 / this.speedx + this.starttime;
                collisionXType = "right";
            } else if (this.speedx < 0) {
                collisionXTime = (this.radius - this.x) * 1000 / this.speedx + this.starttime;
                collisionXType = "left";
            }

            var collisionYTime;
            var collisionYType;
            if (this.speedy > 0) {
                collisionYTime = (height - this.radius - this.y) * 1000 / this.speedy + this.starttime;
                collisionYType = "bottom";
            } else if (this.speedy < 0) {
                collisionYTime = (this.radius - this.y) * 1000 / this.speedy + this.starttime;
                collisionYType = "top";
            }

            if (collisionYTime > collisionXTime) {
                this.collisionTime = collisionXTime;
                this.collisionType = collisionXType;
            } else {
                this.collisionTime = collisionYTime;
                this.collisionType = collisionYType;
            }

            for (let i = 0; i < blocks.length; i++) {
                let block = blocks[i];

                if (this.speedx > 0) {
                    let potentialTime = (block.x - this.radius - this.x) * 1000 / this.speedx + this.starttime;
                    let potentialY = this.y + this.speedy * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialY > block.y - this.radius && potentialY < block.y + block.length + this.radius) {
                        this.collisionTime = potentialTime;
                        this.collisionType = "right";
                        this.collisionBlock = block;
                    }
                } else if (this.speedx < 0) {
                    let potentialTime = (block.x + block.length + this.radius - this.x) * 1000 / this.speedx + this.starttime;
                    let potentialY = this.y + this.speedy * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialY > block.y - this.radius && potentialY < block.y + block.length + this.radius) {
                        this.collisionTime = potentialTime;
                        this.collisionType = "left";
                        this.collisionBlock = block;
                    }
                }

                if (this.speedy > 0) {
                    let potentialTime = (block.y - this.radius - this.y) * 1000 / this.speedy + this.starttime;
                    let potentialX = this.x + this.speedx * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialX > block.x - this.radius && potentialX < block.x + block.length + this.radius) {
                        this.collisionTime = potentialTime;
                        this.collisionType = "bottom";
                        this.collisionBlock = block;
                    }
                } else if (this.speedy < 0) {
                    let potentialTime = (block.y + block.length + this.radius - this.y) * 1000 / this.speedy + this.starttime;
                    let potentialX = this.x + this.speedx * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialX > block.x - this.radius && potentialX < block.x + block.length + this.radius) {
                        this.collisionTime = potentialTime;
                        this.collisionType = "top";
                        this.collisionBlock = block;
                    }
                }
            }
        }

        processCollision() {
            this.x = this.x + this.speedx * (this.collisionTime - this.starttime) / 1000;
            this.y = this.y + this.speedy * (this.collisionTime - this.starttime) / 1000;
            this.starttime = this.collisionTime;

            if (this.collisionType === "right" || this.collisionType === "left") {
                this.speedx = -this.speedx;
            } else {
                this.speedy = -this.speedy;
            }

            if (this.collisionBlock !== null) {
                this.collisionBlock.counter--;
                if (this.collisionBlock.counter === 0) {
                    let index = blocks.indexOf(this.collisionBlock);
                    blocks.splice(index, 1);
                }
            }

            return this.collisionBlock !== null || this.collisionType !== "bottom";
        }

        draw(time) {
			var newy = this.y + this.speedy * (time - this.starttime) / 1000;
			if(newy > height - this.radius) {
				return;
			}
            var newx = this.x + this.speedx * (time - this.starttime) / 1000;
            
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.beginPath();
            ctx.arc(newx, newy, this.radius, 0, Math.PI * 2, true);
            ctx.fill();
        }
    }

    function shoot(mousex, mousey) {
        let x = mousex - launchx;
        let y = mousey - height + 5;
        var speedx = x * speed / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var speedy = y * speed / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var currentTime = Date.now();
        for (var i = 0; i < level; i++) {
            balls.push(new Ball(currentTime + i * 80, launchx, height - ballradius, ballradius, speedx, speedy));
        }

        launchx = null;
    }

    function nextLevel() {
        level++;
        
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].y += blocklength + blockspace;
            if(blocks[i].y > blockspace + (blocklength+blockspace)*blockpercol) {
                gameover = true;
            }
        }

        for (let i = 0; i < blockperrow; i++) {
            if (Math.random() < 3.5 / 7) {
                let counter = level;
                if (Math.random() < 0.5) {
                    counter = 2*level;
                }
                blocks.push(new Block(blockspace + (blockspace+blocklength)*i, blockspace + blocklength, blocklength, counter));
            }
        }
        
        scoreDiv.html("" + level);
        if(gameover) {
            messageDiv.html("Game over");
        }
    }

    var requestAnimationFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;
        
    function getMousePos(evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function startDrawing() {
        $("#canvas").on("vmousedown", function (evt) {
            if (balls.length === 0 && !gameover) {
                mousePos = getMousePos(evt);
                drawStep();
            }
        });
        
        $("#canvas").on("vmousemove", function (evt) {            
            if (balls.length === 0 && mousePos !== null) {
                mousePos = getMousePos(evt);
            }
        });
        
        $("#canvas").on("vmouseout", function (evt) {
            mousePos = null;
        });
        
        $("#canvas").on("vmouseup", function (evt) {
            if (balls.length === 0 && mousePos !== null) {
                mousePos = getMousePos(evt);
                shoot(mousePos.x, mousePos.y);
                mousePos = null;
            }
        });

        drawStep();
    }

    function drawStep() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgb(255,255,255)";

        var currentTime = Date.now();
        let changeLevel = false;
        while (true) {
            let nextCollisionBalls = null;
            let nextCollisionTime = null;
            for (let i = 0; i < balls.length; i++) {
                let ball = balls[i];
                if (ball.collisionTime !== null && ball.collisionTime <= currentTime) {
                    if (nextCollisionTime === null || ball.collisionTime < nextCollisionTime) {
                        nextCollisionBalls = new Array();
                        nextCollisionTime = ball.collisionTime;
                    }

                    if (ball.collisionTime <= nextCollisionTime) {
                        nextCollisionBalls.push(ball);
                    }
                }
            }

            if (nextCollisionBalls !== null) {
                for (let i = 0; i < nextCollisionBalls.length; i++) {
                    if (!nextCollisionBalls[i].processCollision()) {
                        let index = balls.indexOf(nextCollisionBalls[i]);
                        balls.splice(index, 1);
                        if (launchx === null) {
                            launchx = nextCollisionBalls[i].x;
                        }
                    }
                }

                for (let i = 0; i < balls.length; i++) {
                    balls[i].computeCollisionTime();
                }
                
                if(balls.length === 0) {
                    changeLevel = true;
                }
            } else {
                break;
            }
        }

        if (level === 0 || changeLevel) {
            nextLevel();
        }

        for (let i = 0; i < blocks.length; i++) {
            blocks[i].draw();
        }

        if (launchx !== null) {
            ctx.beginPath();
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.arc(launchx, height - ballradius, ballradius, 0, Math.PI * 2, true);
            ctx.fill();
        }

        for (let i = 0; i < balls.length; i++) {
            balls[i].draw(currentTime);
        }
        
        if(mousePos !== null) {
            ctx.save();
            ctx.strokeStyle = "rgb(255,255,255)";
            ctx.setLineDash([5, 15]);
            ctx.beginPath();
            ctx.moveTo(launchx,height-ballradius);
            ctx.lineTo(mousePos.x,mousePos.y);
            ctx.stroke();
            ctx.restore();
        }

        if (!gameover && (balls.length !== 0 || mousePos !== null)) {
            requestAnimationFrame(drawStep);
        }
    }

    startDrawing();
});

function hsv2rgb(h, s, v) {
    var r, g, b;
    if ( s == 0 ) {
       r = v * 255;
       g = v * 255;
       b = v * 255;
    } else {
       var var_h = h * 6;
       if ( var_h == 6 ) {
           var_h = 0;
       }

       var var_i = Math.floor( var_h );
       var var_1 = v * ( 1 - s );
       var var_2 = v * ( 1 - s * ( var_h - var_i ) );
       var var_3 = v * ( 1 - s * ( 1 - ( var_h - var_i ) ) );

       if ( var_i == 0 ) {
           var_r = v;
           var_g = var_3;
           var_b = var_1;
       } else if ( var_i == 1 ) {
           var_r = var_2;
           var_g = v;
           var_b = var_1;
       } else if ( var_i == 2 ) {
           var_r = var_1;
           var_g = v;
           var_b = var_3
       } else if ( var_i == 3 ) {
           var_r = var_1;
           var_g = var_2;
           var_b = v;
       } else if ( var_i == 4 ) {
           var_r = var_3;
           var_g = var_1;
           var_b = v;
       } else {
           var_r = v;
           var_g = var_1;
           var_b = var_2
       }

       r = var_r * 255
       g = var_g * 255
       b = var_b * 255

       }
    return  {
        r: Math.round(r),
        g: Math.round(g),
        b: Math.round(b)
    };
};
