$(function () {
    
    const documentWidth = $(document).width();
    const documentHeight = $(document).height();
    
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
    const left = documentWidth/2-width/2;
    const fontSize = Math.floor(20*ratio);
    
    const blocks = new Array();
    const balls = new Array();
    
    $("#main").width(width);
    $("#main").height(documentHeight);
    $("#main").offset({top: 0, left: left});
    
    const scoreDiv = $("<div id='score'></div>");
    scoreDiv.css("font-size", fontSize*2 + "px");
    scoreDiv.offset({top: 0, left: left});
    scoreDiv.width(width);
    scoreDiv.html("&nbsp;");
    $("#main").append(scoreDiv);
    
    $("#main").append($("<canvas id='canvas-background' width='" + width + "' height='" + height + "'></canvas>"));
    $("#main").append($("<canvas id='canvas-blocks' width='" + width + "' height='" + height + "'></canvas>"));
    $("#main").append($("<canvas id='canvas-balls' width='" + width + "' height='" + height + "'></canvas>"));
    $("canvas").offset({top: scoreDiv.height(), left: left});
    
    const messageDiv = $("<div id='message'></div>");
    messageDiv.css("font-size", fontSize*2 + "px");
    messageDiv.offset({top: scoreDiv.height()+height, left: left});
    messageDiv.width(width);
    messageDiv.html("&nbsp;");
    $("#main").append(messageDiv);
    
    
    const canvasBackground = document.getElementById("canvas-background");
    const ctxBackground = canvasBackground.getContext("2d");
    ctxBackground.fillStyle = "rgb(0,0,0)";
    ctxBackground.fillRect(0, 0, canvasBackground.width, canvasBackground.height);
    
    const canvasBlocks = document.getElementById("canvas-blocks");
    const ctxBlocks = canvasBlocks.getContext("2d");
    
    const canvasBalls = document.getElementById("canvas-balls");
    const ctxBalls = canvasBalls.getContext("2d");
    
    var launchx = width / 2;    
    var level = 0;    
    var launchTarget = null;
    var touchPos = null;
    var gameover = false;

    class Block {
        constructor(x, y, length, counter) {
            this.x = x;
            this.y = y;
            this.length = length;
            this.counter = counter;
            this.dirty = true;
        }
        
        decrease() {
			this.dirty = true;
			this.counter--;
			
			if(this.counter <= 0) {
				ctxBlocks.clearRect(this.x-1, this.y-1, this.length+2, this.length+2);
				return false;
			}
			
			return true;
		}
		
		moveDown() {
			this.dirty = true;
			ctxBlocks.clearRect(this.x-1, this.y-1, this.length+2, this.length+2);
			this.y += blocklength + blockspace;
		}

        draw() {
			if(this.dirty) {
				var hue = 0.1 + this.counter/50;
				var rgb = hsv2rgb(hue, 1, 1);
				ctxBlocks.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
				ctxBlocks.fillRect(this.x, this.y, this.length, this.length);
				ctxBlocks.font = "bold " + fontSize + "px Courier";
				ctxBlocks.fillStyle = "rgb(0,0,0)";
				let text = "" + this.counter;
				let metric = ctxBlocks.measureText(text);
				ctxBlocks.fillText(text, this.x + this.length/2 - metric.width/2, this.y + this.length/2 + fontSize/2);
			}
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
                if (!this.collisionBlock.decrease()) {
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
            
            ctxBalls.fillStyle = "rgb(255,255,255)";
            ctxBalls.beginPath();
            ctxBalls.arc(newx, newy, this.radius, 0, Math.PI * 2, true);
            ctxBalls.fill();
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
            blocks[i].moveDown();
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
        var rect = canvasBalls.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function startDrawing() {
        $("#canvas-balls").on("vmousedown", function (evt) {
            if (balls.length === 0 && !gameover) {
                touchPos = getMousePos(evt);
            }
        });
        
        $("#canvas-balls").on("vmousemove", function (evt) {            
            if (balls.length === 0 && touchPos !== null) {
				let mousePos = getMousePos(evt);
				let y = height-ballradius+touchPos.y-mousePos.y;
				
				if(y < height-2*ballradius) {
					let x = launchx+touchPos.x-mousePos.x;					
					
					launchTarget = {
						x: x,
						y: y
					}
				} else {
					launchTarget = null;
				}
            }
        });
        
        $("#canvas-balls").on("vmouseout", function (evt) {
            launchTarget = null;
            touchPos = null;
        });
        
        $("#canvas-balls").on("vmouseup", function (evt) {
            if (balls.length === 0 && launchTarget !== null) {
                let mousePos = getMousePos(evt);
				
				let y = height-ballradius+touchPos.y-mousePos.y;
				let x = launchx+touchPos.x-mousePos.x;
				
                launchTarget = {
					x: x,
					y: y
				}
				
                shoot(launchTarget.x, launchTarget.y);
            }            
            launchTarget = null;
            touchPos = null;
        });

        drawStep();
    }

    function drawStep() {
		ctxBalls.clearRect(0, 0, canvasBalls.width, canvasBalls.height);

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
            ctxBalls.beginPath();
            ctxBalls.fillStyle = "rgb(255,255,255)";
            ctxBalls.arc(launchx, height - ballradius, ballradius, 0, Math.PI * 2, true);
            ctxBalls.fill();
        }

        for (let i = 0; i < balls.length; i++) {
            balls[i].draw(currentTime);
        }
        
        if(launchTarget !== null) {
			ctxBalls.fillStyle = "rgb(255,255,255)";
			let launcherLength = Math.sqrt(Math.pow(launchTarget.x-launchx, 2)+Math.pow(launchTarget.y-height+ballradius, 2));
			for(let i = 1; i <= 16; i++) {
				ctxBalls.beginPath();
				ctxBalls.arc(launchx+(launchTarget.x-launchx)*i/8, height-ballradius+(launchTarget.y-height+ballradius)*i/8, launcherLength*ballradius/height, 0, Math.PI * 2, true);
				ctxBalls.fill();
			}			
        }

        if (!gameover) {
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
