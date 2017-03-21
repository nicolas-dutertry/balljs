$(function () {	
	loadGame();
});

function loadGame() {
    var documentWidth = $(document).width();
    var documentHeight = $(document).height();
    
    var ratio1 = $(document).width() / 550;
    var ratio2 = $(document).height() / 820;
    var ratio = (ratio1 > ratio2) ? ratio2 : ratio1;

    var ballradius = 10*ratio;
    var blocklength = 60*ratio;
    var blockspace = 10*ratio;
    var blockFontSize = Math.floor(25*ratio);
    var blockperrow = 7;
    var blockpercol = 8;
    var speed = 600*ratio;
    var width = 500*ratio;
    var height = 710*ratio;
    var left = documentWidth/2-width/2;
    var fontSize = Math.floor(20*ratio);
    
    var blocks = new Array();
    var balls = new Array();
    
    $("#main").width(width);
    $("#main").height(documentHeight);
    $("#main").offset({top: 0, left: left});
    
    var headerDiv = $("#header");
    headerDiv.css("font-size", fontSize*2 + "px");
    headerDiv.offset({top: 0, left: left});
    headerDiv.width(width);
    var scoreDiv = $("#score");
    scoreDiv.html("&nbsp;");
    
    var reloadImg = $("#reload");
    var reloadPos = scoreDiv.height()/2-fontSize;
    reloadImg.offset({top: reloadPos, left: left+reloadPos});
    reloadImg.width(fontSize*2);
    reloadImg.height(fontSize*2);
    
    if(localStorage && localStorage.bestScore) {
    	var bestDiv = $("#best");
    	bestDiv.css("font-size", (fontSize-1) + "px");
    	bestDiv.offset({top: 0, left: left+reloadPos+fontSize*2.5});    	
    	bestDiv.html("BEST<br/>" + localStorage.bestScore);
    }
    
    $("canvas").attr("width", width);
    $("canvas").attr("height", height+2);
    $("canvas").offset({top: headerDiv.height(), left: left});
    
    var gameOverDiv = $("#game-over");
    gameOverDiv.css("font-size", fontSize*2 + "px");
    gameOverDiv.css("border-radius", fontSize + "px");    
    gameOverDiv.offset({top: height/2, left: left+0.05*width});
    gameOverDiv.width(0.9*width);
    gameOverDiv.css("z-index", "0");
    
    var aboutDiv = $("#about");
    aboutDiv.css("font-size", Math.floor(0.8*fontSize) + "px");
    aboutDiv.width(width-fontSize/2);
    aboutDiv.offset({top: documentHeight-aboutDiv.height()-fontSize/2, left: left});    
    
    var canvasBackground = document.getElementById("canvas-background");
    var ctxBackground = canvasBackground.getContext("2d");
    ctxBackground.fillStyle = "rgb(0,0,0)";
    ctxBackground.fillRect(0, 0, canvasBackground.width, canvasBackground.height);
    
    var canvasBlocks = document.getElementById("canvas-blocks");
    var ctxBlocks = canvasBlocks.getContext("2d");
    ctxBlocks.clearRect(0, 0, ctxBlocks.width, ctxBlocks.height);
    
    var canvasBalls = document.getElementById("canvas-balls");
    var ctxBalls = canvasBalls.getContext("2d");
    ctxBalls.clearRect(0, 0, canvasBalls.width, canvasBalls.height);
    
    var launchx = width / 2;    
    var level = 0;    
    var launchTarget = null;
    var touchPos = null;
    var gameover = false;

    class Block {
        constructor(x, y, counter) {
            this.x = x;
            this.y = y;
            this.counter = counter;
            this.dirty = true;
        }
        
        decrease() {
			this.dirty = true;
			this.counter--;
			
			if(this.counter <= 0) {
				ctxBlocks.clearRect(this.x-1, this.y-1, blocklength+2, blocklength+2);
				return false;
			}
			
			return true;
		}
		
		moveDown() {
			this.dirty = true;
			ctxBlocks.clearRect(this.x-1, this.y-1, blocklength+2, blocklength+2);
			this.y += blocklength + blockspace;
		}

        draw() {
			if(this.dirty) {
				var hue = 0.1 + this.counter/50;
				var rgb = hsv2rgb(hue, 1, 1);
				ctxBlocks.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
				ctxBlocks.fillRect(this.x, this.y, blocklength, blocklength);
				ctxBlocks.font = "bold " + blockFontSize + "px Courier";
				ctxBlocks.fillStyle = "rgb(0,0,0)";
				let text = "" + this.counter;
				let metric = ctxBlocks.measureText(text);
				ctxBlocks.fillText(text, this.x + blocklength/2 - metric.width/2, this.y + blocklength/2 + fontSize/2);
			}
        }
    }

    class Ball {
        constructor(starttime, x, y, speedx, speedy) {
            this.starttime = starttime;
            this.x = x;
            this.y = y;
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
                collisionXTime = (width - ballradius - this.x) * 1000 / this.speedx + this.starttime;
                collisionXType = "right";
            } else if (this.speedx < 0) {
                collisionXTime = (ballradius - this.x) * 1000 / this.speedx + this.starttime;
                collisionXType = "left";
            }

            var collisionYTime;
            var collisionYType;
            if (this.speedy > 0) {
                collisionYTime = (height - ballradius - this.y) * 1000 / this.speedy + this.starttime;
                collisionYType = "bottom";
            } else if (this.speedy < 0) {
                collisionYTime = (ballradius - this.y) * 1000 / this.speedy + this.starttime;
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
                    let potentialTime = (block.x - ballradius - this.x) * 1000 / this.speedx + this.starttime;
                    let potentialY = this.y + this.speedy * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialY > block.y - ballradius && potentialY < block.y + blocklength + ballradius) {
                        this.collisionTime = potentialTime;
                        this.collisionType = "right";
                        this.collisionBlock = block;
                    }
                } else if (this.speedx < 0) {
                    let potentialTime = (block.x + blocklength + ballradius - this.x) * 1000 / this.speedx + this.starttime;
                    let potentialY = this.y + this.speedy * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialY > block.y - ballradius && potentialY < block.y + blocklength + ballradius) {
                        this.collisionTime = potentialTime;
                        this.collisionType = "left";
                        this.collisionBlock = block;
                    }
                }

                if (this.speedy > 0) {
                    let potentialTime = (block.y - ballradius - this.y) * 1000 / this.speedy + this.starttime;
                    let potentialX = this.x + this.speedx * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialX > block.x - ballradius && potentialX < block.x + blocklength + ballradius) {
                        this.collisionTime = potentialTime;
                        this.collisionType = "bottom";
                        this.collisionBlock = block;
                    }
                } else if (this.speedy < 0) {
                    let potentialTime = (block.y + blocklength + ballradius - this.y) * 1000 / this.speedy + this.starttime;
                    let potentialX = this.x + this.speedx * (potentialTime - this.starttime) / 1000;
                    if (potentialTime >= this.starttime && potentialTime < this.collisionTime && potentialX > block.x - ballradius && potentialX < block.x + blocklength + ballradius) {
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
			if(newy > height - ballradius) {
				return;
			}
            var newx = this.x + this.speedx * (time - this.starttime) / 1000;
            
            ctxBalls.fillStyle = "rgb(255,255,255)";
            ctxBalls.beginPath();
            ctxBalls.arc(newx, newy, ballradius, 0, Math.PI * 2, true);
            ctxBalls.fill();
        }
    }

    function shoot(mousex, mousey) {
        let x = mousex - launchx;
        let y = mousey - height + 5;
        var speedx = x * speed / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var speedy = y * speed / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var currentTime = Date.now();
        var ballCount = level <= 1 ? 1 : level-1;        
        for (var i = 0; i < ballCount; i++) {
            balls.push(new Ball(currentTime + i * 90, launchx, height - ballradius, speedx, speedy));
        }

        launchx = null;
    }

    function nextLevel() {
        // Increment level
    	level++;
        
    	// Move each existing block down
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].moveDown();
            if(blocks[i].y > blockspace + (blocklength+blockspace)*blockpercol) {
                gameover = true;
            }
        }

        // Compute new block count
        var newBlockCount = 1 + Math.floor(Math.random()*(blockperrow-2));
        var availablePos = new Array();
        for(let i = 0; i < blockperrow; i++) {
        	availablePos.push(i);
        }
        
        // Position new blocks randomly on first line
        for (let i = 0; i < newBlockCount; i++) {
        	let counter = level;
            if (Math.random() < 0.5) {
                counter = 2*level;
            }
            let posIndex =  Math.floor(Math.random()*availablePos.length);
            let pos = availablePos[posIndex];
            availablePos.splice(posIndex, 1);
            blocks.push(new Block(blockspace + (blockspace+blocklength)*pos, blockspace + blocklength, counter));
        }
        
        
        if(gameover) {
        	if(localStorage) {
        		if(localStorage.bestScore) {
        			let bestScore = Number(localStorage.bestScore);
        			if(level-1 > bestScore) {
        				bestScore = level-1;
        				localStorage.bestScore = bestScore;
        			}
        		} else {
        			let bestScore = level-1;
        			localStorage.bestScore = bestScore;
        		}
        	}
            gameOverDiv.css("z-index", "4");
            
        } else {
        	scoreDiv.html("" + level);
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

    function drawAll() {
    	if(gameover) {
    		return;
    	}

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
        
        ctxBalls.clearRect(0, 0, canvasBalls.width, canvasBalls.height);

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
            requestAnimationFrame(drawAll);
        }
    }

    $("#canvas-balls").off();
    
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
    
    $("#reload").off();
    $("#reload").click(function() {
    	gameover = true;
    	loadGame();
    });

    drawAll();
}

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
