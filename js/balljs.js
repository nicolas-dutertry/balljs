/*
 * Balljs - A brick breaker game
 * http://github.com/nicolas-dutertry/balljs
 * 
 * Written by Nicolas Dutertry.
 * 
 * This file is provided under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */
const blockperrow = 7;
const blockpercol = 8;
    
var mute = true;
class SoundPool {
	constructor(file, volume, size) {
		this.file = file;
		this.pool = new Array();
		for(let i = 0; i < size; i++) {
			let audio = new Audio(file);
			audio.volume = volume;
			audio.load();
			this.pool.push(audio);
		}
		this.currSound = 0;
	}
	
	
	play() {
               if(mute) {
                        return;
               }
		if(this.pool[this.currSound].currentTime == 0 || this.pool[this.currSound].ended) {
			this.pool[this.currSound].play();
		}
		this.currSound = (this.currSound + 1) % this.pool.length;
	};
}

var launchsound = new SoundPool("sounds/launch.wav", .2, 1);
var blocksound = new SoundPool("sounds/rebound.wav", .2, 20);
var explosionsound = new SoundPool("sounds/rebound.wav", .2, 10);
var extraballsound = new SoundPool("sounds/newball.wav", .2, 10);

class Drawable {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    draw(time) {}
}

class Obstacle extends Drawable {
	constructor(ctx) {
        super(ctx);
    }
	
	nextLevel(game) {
		return true;
	}
	
	getNextCollision(ball) {
		return null;
	}
	
	// return NODESTROY, DESTROYED or BALLDESTROYED;
	processCollision(game) {
		return "NODESTROY";
	}
}

class TopBorder extends Obstacle {
	constructor() {
        super(null);
    }
	
	getNextCollision(ball) {
		if (ball.speedy < 0) {
			return {
    			time: (ball.radius - ball.y) * 1000 / ball.speedy + ball.starttime,
    			speedx: ball.speedx,
    			speedy: -ball.speedy
        	}
		}
		
		return null;
	}
	
}

class BottomBorder extends Obstacle {
	constructor(y) {
        super(null);
        this.y = y;
    }
	
	getNextCollision(ball) {
		if (ball.speedy > 0) {
			return {
    			time: (this.y - ball.radius - ball.y) * 1000 / ball.speedy + ball.starttime,
    			speedx: ball.speedx,
    			speedy: -ball.speedy
        	}
		}
		
		return null;
	}
	
	processCollision(game) {
		return "BALLDESTROYED";
	}
	
}

class LeftBorder extends Obstacle {
	constructor() {
        super(null);
    }
	
	getNextCollision(ball) {
		if (ball.speedx < 0) {
			return {
    			time: (ball.radius - ball.x) * 1000 / ball.speedx + ball.starttime,
    			speedx: -ball.speedx,
    			speedy: ball.speedy
        	}
		}
		
		return null;
	}
	
}

class RightBorder extends Obstacle {
	constructor(x) {
        super(null);
        this.x = x;
    }
	
	getNextCollision(ball) {
		if (ball.speedx > 0) {
			return {
    			time: (this.x - ball.radius - ball.x) * 1000 / ball.speedx + ball.starttime,
    			speedx: -ball.speedx,
    			speedy: ball.speedy
        	}
		}
		
		return null;
	}
	
}

class Block extends Obstacle {
    constructor(ctx, x, y, length, space, counter) {
    	super(ctx);
        this.x = x;
        this.y = y;
        this.length = length;
        this.space = space;
        this.counter = counter;
        this.dirty = true;
        this.fontSize = Math.floor(length/2.5);
    }
    
    getNextCollision(ball) {
    	let potentialCorner = null;
    	let nextCollision = null;

        if (ball.speedx > 0) {
            let potentialTime = (this.x - ball.radius - ball.x) * 1000 / ball.speedx + ball.starttime;
            let potentialY = ball.y + ball.speedy * (potentialTime - ball.starttime) / 1000;
            if (potentialTime >= ball.starttime && potentialY > this.y - ball.radius && potentialY < this.y + this.length + ball.radius) {
                if(potentialY < this.y) {
                	potentialCorner = {
                		x: this.x,
                		y: this.y
                	};
                } else if(potentialY > this.y+this.length) {
                	potentialCorner = {
                    		x: this.x,
                    		y: this.y+this.length
                    	};
                } else {
                	nextCollision = {
                			time: potentialTime,
                			speedx: -ball.speedx,
                			speedy: ball.speedy
                	}
                }
            }
        } else if (ball.speedx < 0) {
            let potentialTime = (this.x + this.length + ball.radius - ball.x) * 1000 / ball.speedx + ball.starttime;
            let potentialY = ball.y + ball.speedy * (potentialTime - ball.starttime) / 1000;
            if (potentialTime >= ball.starttime && potentialY > this.y - ball.radius && potentialY < this.y + this.length + ball.radius) {
            	if(potentialY < this.y) {
                	potentialCorner = {
                		x: this.x+this.length,
                		y: this.y
                	};
                } else if(potentialY > this.y+this.length) {
                	potentialCorner = {
                    		x: this.x+this.length,
                    		y: this.y+this.length
                    	};
                } else {
                	nextCollision = {
                			time: potentialTime,
                			speedx: -ball.speedx,
                			speedy: ball.speedy
                	}
                }
            }
        }

        if (ball.speedy > 0) {
            let potentialTime = (this.y - ball.radius - ball.y) * 1000 / ball.speedy + ball.starttime;
            let potentialX = ball.x + ball.speedx * (potentialTime - ball.starttime) / 1000;
            if (potentialTime >= ball.starttime && (nextCollision === null || potentialTime < nextCollision.time) && potentialX > this.x - ball.radius && potentialX < this.x + this.length + ball.radius) {
            	if(potentialX < this.x) {
                	potentialCorner = {
                		x: this.x,
                		y: this.y
                	};
                } else if(potentialX > this.x+this.length) {
                	potentialCorner = {
                    		x: this.x+this.length,
                    		y: this.y
                    	};
                } else {
                	nextCollision = {
                			time: potentialTime,
                			speedx: ball.speedx,
                			speedy: -ball.speedy
                	}
                }
            }
        } else if (ball.speedy < 0) {
            let potentialTime = (this.y + this.length + ball.radius - ball.y) * 1000 / ball.speedy + ball.starttime;
            let potentialX = ball.x + ball.speedx * (potentialTime - ball.starttime) / 1000;
            if (potentialTime >= ball.starttime && (nextCollision === null || potentialTime < nextCollision.time) && potentialX > this.x - ball.radius && potentialX < this.x + this.length + ball.radius) {
            	if(potentialX < this.x) {
                	potentialCorner = {
                		x: this.x,
                		y: this.y+this.length
                	};
                } else if(potentialX > this.x+this.length) {
                	potentialCorner = {
                    		x: this.x+this.length,
                    		y: this.y+this.length
                    	};
                } else {
                	nextCollision = {
                			time: potentialTime,
                			speedx: ball.speedx,
                			speedy: -ball.speedy
                	}
                }
            }
        }
        
        if(potentialCorner !== null) {
        	let potentialTime = ball.getCollisionTime(potentialCorner.x, potentialCorner.y, ball.radius);
        	if(potentialTime !== null && potentialTime >= ball.starttime && (nextCollision === null || potentialTime < nextCollision.time)) {
        		let potentialX = ball.x + ball.speedx * (potentialTime - ball.starttime) / 1000;
        		let potentialY = ball.y + ball.speedy * (potentialTime - ball.starttime) / 1000;
        		
        		/*
        		 * Collision angle: theta
        		 * cos(theta) = (cornerX-potentialX)/ball.radius
        		 * sin(theta) = (cornerY-potentialY)/ball.radius
        		 * 
        		 * Speed angle: alpha
        		 * cos(alpha) = speedX/speed
        		 * sin(alpha) = speedY/speed
        		 * 
        		 * New speed angle: beta = PI-alpha+2*theta
        		 * cos(beta) = newspeedX/speed
        		 * sin(beta) = newspeedY/speed
        		 * 
        		 * We can use the following trigonometry formulae:
        		 * cos(PI-a) = -cos(a)
        		 * sin(PI-a) = sin(a)
        		 * cos(a-b) = cos(a)cos(b)+sin(a)sin(b)
        		 * sin(a-b) = sin(a)cos(b)-cos(a)sin(b)
        		 * cos(2a) = cos²(a) - 1
        		 *         = 1 - 2sin²(a)
        		 * sin(2a) = 2cos(a)sin(a)
        		 * 
        		 * Thus:
        		 * cos(beta) = cos(PI - alpha + 2*theta) = -cos(alpha - 2*theta)
        		 *           = - [ cos(alpha)*cos(2*theta) + sin(alpha)*sin(2*theta) ]
        		 *           = - cos(alpha)*(2*cos²(theta)-1) - 2*sin(alpha)*sin(theta)*cos(theta)
        		 * newspeedX = - speedX*(2*cos²(theta)-1) - 2*speedY*sin(theta)*cos(theta)
        		 *           = speedX - 2*speedX*cos²(theta) - 2*speedY*sin(theta)*cos(theta)
        		 *           = speedX - 2*(speedX*cos(theta) + speedY*sin(theta))*cos(theta)
        		 * 
        		 * sin(beta) = sin(PI - alpha + 2*theta) = sin(alpha - 2*theta)
        		 *           = sin(alpha)*cos(2*theta) - cos(alpha)*sin(2*theta)
        		 *           = sin(alpha)*(1-2*sin²(theta)) - 2*cos(alpha)*sin(theta)*cos(theta)
        		 * newspeedY = speedY*(1-2*sin²(theta)) - 2*speedX*sin(theta)*cos(theta)
        		 *           = speedY - 2*speedY*sin²(theta) - 2*speedX*sin(theta)*cos(theta)
        		 *           = speedY - 2*(speedY*sin(theta) + speedX*cos(theta))*sin(theta)
        		 */
        		
        		
        		let costheta = (potentialCorner.x-potentialX)/ball.radius;                		
        		let sintheta = (potentialCorner.y-potentialY)/ball.radius;
        		let projection = ball.speedx*costheta + ball.speedy*sintheta;
        		
        		nextCollision = {
            			time: potentialTime,
            			speedx: ball.speedx-2*projection*costheta,
            			speedy: ball.speedy-2*projection*sintheta
            	}
        	}
        }
        
        return nextCollision;
    }
    
    processCollision(game) {
		this.dirty = true;
		this.counter--;
		
		if(this.counter <= 0) {
			this.ctx.clearRect(this.x-1, this.y-1, this.length+2, this.length+2);
			explosionsound.play();
			return "DESTROYED";
		}
		
		blocksound.play();
		return "NODESTROY";
	}
	
	nextLevel(game) {
		this.dirty = true;
		this.ctx.clearRect(this.x-1, this.y-1, this.length+2, this.length+2);
		this.y += this.length + this.space;
		if(this.y > this.space + (this.length+this.space)*blockpercol) {
            game.gameover = true;
        }
		
		return true;
	}

    draw(time) {
		if(this.dirty) {
			var hue = 0.1 + this.counter/50;
			var rgb = hsv2rgb(hue, 1, 1);
			this.ctx.fillStyle = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
			this.ctx.fillRect(this.x, this.y, this.length, this.length);
			this.ctx.font = "bold " + this.fontSize + "px Courier";
			this.ctx.fillStyle = "rgb(0,0,0)";
			let text = "" + this.counter;
			let metric = this.ctx.measureText(text);
			this.ctx.fillText(text, this.x + this.length/2 - metric.width/2, this.y + this.length/2 + this.fontSize/2);
		}
    }
}

class ExtraBall extends Obstacle{
	constructor(ctx, x, y, radius, length, space, lineWidth) {
		super(ctx);
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.length = length;
        this.space = space;
        this.lineWidth = lineWidth;
        this.deleted = false;
        this.extradius = 0;
    }
	
	nextLevel(game) {
		this.clear();
		this.y += this.length + this.space;
		if(this.y > this.space + (this.length + this.space)*(blockpercol+1))  {
			this.deleted = true;
		}
		return !this.deleted;
	}
	
	getNextCollision(ball) {
		if(!this.deleted) {
        	let time = ball.getCollisionTime(this.x, this.y, ball.radius + 2*this.radius);
        	if(time !== null && time >= ball.starttime) {
        		return {
        			time: time,
        			speedx: ball.speedx,
        			speedy: ball.speedy
        		}
        	}
    	}
		return null;
	}
	
	processCollision(game) {
		if(!this.deleted) {
    		this.clear();
    		this.deleted = true;
    		game.ballCount++;
    		extraballsound.play();
		}
	}
	
	clear() {
		this.ctx.clearRect(this.x-this.length/2, this.y-this.length/2, this.length, this.length);
	}
	
	draw(time) {
		if(!this.deleted) {
			let extradius = this.radius + Math.floor(this.radius*((Math.cos(time/50)/4)+1));
    		
    		if(extradius !== this.extradius) {
    			this.clear();	    	
    			
    			this.ctx.save();
    			this.ctx.strokeStyle = "rgb(255,255,255)";
    			this.ctx.lineWidth = this.lineWidth;
    			this.ctx.beginPath();
    			this.ctx.arc(this.x, this.y, extradius, 0, Math.PI * 2, true);
    			this.ctx.stroke();
    			this.ctx.restore();
	    		
    			this.ctx.fillStyle = "rgb(255,255,255)";	    		
    			this.ctx.beginPath();
    			this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    			this.ctx.fill();
	    		
	    		this.extradius = extradius;
    		}
		}
    }
}

class Ball extends Drawable {
    constructor(ctx, starttime, x, y, radius, speedx, speedy) {
    	super(ctx);
        this.starttime = starttime;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedx = speedx;
        this.speedy = speedy;
        this.launched = false;
        this.checkInfinite = false;
        this.nextCollision = null;
    }

    computeNextCollision(obstacles) {    	
        this.nextCollision = null;
        
        for(let i = 0; i < obstacles.length; i++) {
        	let nextCollision = obstacles[i].getNextCollision(this);
        	if(nextCollision !== null && (this.nextCollision === null || this.nextCollision.time > nextCollision.time)) {
        		this.nextCollision = {
        			time: nextCollision.time,
        			speedx: nextCollision.speedx,
        			speedy: nextCollision.speedy,
        			obstacle: obstacles[i]
        		}
        	}
        }
    }

    processCollision() {        	
        this.x = this.x + this.speedx * (this.nextCollision.time - this.starttime) / 1000;
        this.y = this.y + this.speedy * (this.nextCollision.time - this.starttime) / 1000;
        this.starttime = this.nextCollision.time;
        
        this.speedx = this.nextCollision.speedx;
        this.speedy = this.nextCollision.speedy;
        
        // Infinite rebound prevention
        if(this.checkInfinite && /*this.nextCollision.obstacle === null &&*/ this.speedy > -this.radius && this.speedy < this.radius) {
        	this.speedy = this.radius;
        	if(this.speedx > 0) {
        		this.speedx = Math.sqrt(speed*speed-this.radius*this.radius);
        	} else {
        		this.speedx = -Math.sqrt(speed*speed-this.radius*this.radius);
        	}
        }
        this.horizontal = false;
        
    	if(this.speedy > -this.radius && this.speedy < this.radius) {
    		this.checkInfinite = true;
    	}

        return this.nextCollision;
    }

    draw(time) {
		var newy = this.y + this.speedy * (time - this.starttime) / 1000;
		/*
		if(newy > height - this.radius) {
			if(this.launched) {
				this.deleted = true;
			}
			return;
		}
		*/
		
		this.launched = true;
		
        var newx = this.x + this.speedx * (time - this.starttime) / 1000;
        
        this.ctx.fillStyle = "rgb(255,255,255)";
        this.ctx.beginPath();
        this.ctx.arc(newx, newy, this.radius, 0, Math.PI * 2, true);
        this.ctx.fill();
    }
    
    getCollisionTime(ex, ey, d) {
    	/*
    	 * We simplify the equation by translating the referential (space and time) to the ball starting point.
    	 * We will also work with seconds instead of milliseconds.  
    	 */
    	let tx = ex-this.x;
    	let ty = ey-this.y;
    	
    	/*
    	 * We want to know when the distance to the target will equal d.
    	 * We use Pythagore :
    	 * (tx-x)^2 + (ty-y)^2 - d^2 = 0
    	 * (tx-speedx*time)^2 + (ty-speedy*time)^2 - d^2 = 0
    	 * speedx^2*time^2 - 2*tx*speedx*time + tx^2 + speedy^2*time^2 - 2*ty*speedy*time + ty^2 - d^2 = 0
    	 * (speedx^2 + speedy^2)*time^2 - (2*tx*speedx + 2*ty*speedy)*time + tx^2 + ty^2 - d^2 = 0
    	 * 
    	 * We end up with a quadratic equation (a*time^2+b*time+c)
    	 */
    	
    	let a = this.speedx*this.speedx + this.speedy*this.speedy;
    	let b = -(2*tx*this.speedx + 2*ty*this.speedy);
    	let c = tx*tx + ty*ty - d*d;
    	
        let t = solveQuadraticEquation(a, b, c);
         
         if(t !== null) {
        	 return t*1000+this.starttime;
         }
         
         return null;
    }
}

$(function () {
	loadGame();
});

function loadGame() {
    var documentWidth = $(document).width();
    var documentHeight = $(document).height();
    
    var ratio1 = $(document).width() / 550;
    var ratio2 = $(document).height() / 820;
    var ratio = (ratio1 > ratio2) ? ratio2 : ratio1;

    var ballradius = 9*ratio;
    var blocklength = 60*ratio;
    var blockspace = 10*ratio;
    var blockFontSize = Math.floor(25*ratio);
    var speed = 800*ratio;
    var width = 500*ratio;
    var height = 710*ratio;
    var left = documentWidth/2-width/2;
    var fontSize = Math.floor(20*ratio);
    var launcherFontSize = Math.floor(18*ratio);
    
    var obstacles = new Array();
    obstacles.push(new TopBorder());
    obstacles.push(new BottomBorder(height));
    obstacles.push(new LeftBorder());
    obstacles.push(new RightBorder(width));
    
    var balls = new Array();
    
    $("#toucharea").width(documentWidth);
    $("#toucharea").height(documentHeight);
    
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

    var soundImg = $("#sound");
    soundImg.offset({top: reloadPos, left: left+width-reloadPos-fontSize*2});
    soundImg.width(fontSize*2);
    soundImg.height(fontSize*2);
    soundImg.attr("src", mute ? "images/nosound.png" : "images/sound.png");
    
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
    gameOverDiv.css("z-index", "-1");
    
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
    
    var game = {
    	nextLaunchx: width / 2,
	    level: 0,
	    ballCount: 1,    
	    gameover: false
    };
    var launchx;
    var launchTarget = null;
    var touchPos = null;       

    function shoot(mousex, mousey) {
        let x = mousex - launchx;
        let y = mousey - height + 5;
        var speedx = x * speed / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var speedy = y * speed / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var currentTime = Date.now();        
        for (var i = 0; i < game.ballCount; i++) {
        	let ball = new Ball(ctxBalls, currentTime + i * 90, launchx, height - ballradius, ballradius, speedx, speedy);
        	ball.computeNextCollision(obstacles);
            balls.push(ball);
        }
        
        game.nextLaunchx = null;
        
        launchsound.play();
    }

    function nextLevel() {
        // Increment level
    	game.level++;
    	
    	launchx = game.nextLaunchx;
    	game.nextLaunchx = null;
        
    	// Move each existing block down
        for (let i = 0; i < obstacles.length; i++) {
        	if(!obstacles[i].nextLevel(game)) {
        		obstacles.splice(i, 1);
            	i--;
        	}
        }

        // Compute new block count
        // The most probable number is 3
        var newBlockCount = 3;
        var random = Math.random();
        if(random > 0.5) {
			newBlockCount = 1 + Math.floor((random-0.5)*2*(blockperrow-2));
		}
        var availablePos = new Array();
        for(let i = 0; i < blockperrow; i++) {
        	availablePos.push(i);
        }
        
        // Position new blocks randomly on first line
        for (let i = 0; i < newBlockCount; i++) {
        	let counter = game.level;
            if (Math.random() < 0.3) {
                counter = 2*game.level;
            }
            let posIndex =  Math.floor(Math.random()*availablePos.length);
            let pos = availablePos[posIndex];
            availablePos.splice(posIndex, 1);
            obstacles.push(new Block(ctxBlocks, blockspace + (blockspace+blocklength)*pos, blockspace + blocklength, blocklength, blockspace, counter));
        }
        
        if(game.level > 1) {
	        let posIndex =  Math.floor(Math.random()*availablePos.length);
	        let pos = availablePos[posIndex];
	        obstacles.push(new ExtraBall(ctxBlocks, blockspace + (blockspace+blocklength)*pos+blocklength/2, blockspace + 3*blocklength/2, ballradius, blocklength, blockspace, 4*ratio));
        }
        
        if(game.gameover) {
        	if(localStorage) {
        		if(localStorage.bestScore) {
        			let bestScore = Number(localStorage.bestScore);
        			if(game.level-1 > bestScore) {
        				bestScore = game.level-1;
        				localStorage.bestScore = bestScore;
        			}
        		} else {
        			let bestScore = game.level-1;
        			localStorage.bestScore = bestScore;
        		}
        	}
            gameOverDiv.css("z-index", "4");
            
        } else {
        	scoreDiv.html("" + game.level);
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
    	if(game.gameover) {
    		return;
    	}

        var currentTime = Date.now();
        let changeLevel = false;
        
        // Check collisions since previous frame 
        while (true) {
            let collisionBalls = null;
            let collisionTime = null;
            // Check the first collision occurred since previous frame
            for (let i = 0; i < balls.length; i++) {
                let ball = balls[i];
                if (ball.nextCollision.time !== null && ball.nextCollision.time <= currentTime) {
                    if (collisionTime === null || ball.nextCollision.time < collisionTime) {
                        collisionBalls = new Array();
                        collisionTime = ball.nextCollision.time;
                    }

                    if (ball.nextCollision.time <= collisionTime) {
                        collisionBalls.push(ball);
                    }
                }
            }

            // Process collisions
            if (collisionBalls !== null) {
            	let deletedBlocks = new Array();
                for (let i = 0; i < collisionBalls.length; i++) {
                	let ball = collisionBalls[i];
                	// return NODESTROY, DESTROYED or BALLDESTROYED;
                	let collision = ball.processCollision();
                	let action = collision.obstacle.processCollision(game); 
                    if (action === "BALLDESTROYED") {
                    	// Remove the ball
                        let index = balls.indexOf(ball);
                        balls.splice(index, 1);
                        // The first removed ball will be the next launcher start point
                        if (game.nextLaunchx === null) {
                        	game.nextLaunchx = ball.x;
                        }
                    } else if (action === "DESTROYED") {
                    	let index = obstacles.indexOf(collision.obstacle);
                    	obstacles.splice(index, 1);
                    	deletedBlocks.push(collision.obstacle);
                    }
                }
                
                // Re-compute next collisions from collision time since blocks may have changed
                for (let i = 0; i < balls.length; i++) {
                	let ball = balls[i];
                	if(collisionBalls.indexOf(ball) >= 0) {
                		// Balls in collisionBalls have already been recomputed 
                		ball.computeNextCollision(obstacles);
                		continue;
                	}
                	
                	// Re-Compute only for balls which should have touch deleted blocks
                	let deletedIndex = deletedBlocks.indexOf(ball.nextCollision.obstacle);
                	if(deletedIndex >= 0) {
                    	// Re-compute
                		ball.computeNextCollision(obstacles);
                	}
                }                
                
                if(balls.length === 0) {
                    changeLevel = true;
                }
            } else {
            	break;
            }
        }

        // Move obstacles down if necessary
        if (game.level === 0 || changeLevel) {        	
            nextLevel();
        }

        // Draw obstacles
        for (let i = 0; i < obstacles.length; i++) {
        	obstacles[i].draw(currentTime);
        }
        
        // Clear previous frame drawing
        ctxBalls.clearRect(0, 0, canvasBalls.width, canvasBalls.height);
        
        // Draw balls
        for (let i = 0; i < balls.length; i++) {
            balls[i].draw(currentTime);
        }

        // Draw launcher start point
        if (launchx !== null) {
            let launchCount = game.ballCount;
			if(balls.length > 0) {
				launchCount = 0;
				for (let i = 0; i < balls.length; i++) {
					if(!balls[i].launched) {
						launchCount++;
					}
				}
			}
			if(launchCount > 0) {
				ctxBalls.beginPath();
	            ctxBalls.fillStyle = "rgb(255,255,255)";
	            ctxBalls.arc(launchx, height - ballradius, ballradius, 0, Math.PI * 2, true);
	            ctxBalls.fill();
	            
	            ctxBalls.font = launcherFontSize + "px Courier";
	            let text = "x" + launchCount;
				let metric = ctxBalls.measureText(text);
				ctxBalls.fillText(text, launchx - metric.width, height-ballradius*3);
			} else {
				launchx = null;
			}
        }
        
        if (game.nextLaunchx !== null) {
        	ctxBalls.beginPath();
            ctxBalls.fillStyle = "rgb(255,255,255)";
            ctxBalls.arc(game.nextLaunchx, height - ballradius, ballradius, 0, Math.PI * 2, true);
            ctxBalls.fill();
        }        
        
        // Draw launcher
        if(launchTarget !== null) {
			ctxBalls.fillStyle = "rgb(255,255,255)";
			let launcherLengthP2 = Math.pow(launchTarget.x-launchx, 2)+Math.pow(launchTarget.y-height+ballradius, 2);
			if(launcherLengthP2 > 100*ballradius*ballradius) {
				let targetx = launchTarget.x;
				let targety = launchTarget.y;				
				let launcherLength = Math.sqrt(launcherLengthP2);
				
				if(launcherLength > height/2) {
					targetx = (targetx-launchx)*height/(2*launcherLength)+launchx;
					targety = (targety-height+ballradius)*height/(2*launcherLength)+height-ballradius;
					launcherLength = height/2;
				}
				
				let theta = 0;
				if(targetx-launchx === 0) {
					theta = -Math.PI/2;
				} else if(targetx-launchx > 0) {
					theta = Math.atan((targety-height+ballradius)/(targetx-launchx));
				} else {
					theta = Math.PI + Math.atan((targety-height+ballradius)/(targetx-launchx));
				}
				
				let l = 6*ballradius;
				let lx=launchx+l*(targetx-launchx)/launcherLength;
				let ly=height-ballradius+l*(targety-height+ballradius)/launcherLength;
				ctxBalls.beginPath();
				ctxBalls.arc(launchx, height-ballradius, 1.5*ballradius, theta-Math.PI/8, theta+Math.PI/8, false);
				ctxBalls.lineTo(lx, ly);
				ctxBalls.fill();
				
				for(let i = 1; i <= 16; i++) {
					ctxBalls.beginPath();
					ctxBalls.arc(lx+(targetx-lx)*i/7, ly+(targety-ly)*i/7, launcherLength*ballradius/height, 0, Math.PI * 2, true);
					ctxBalls.fill();
				}
			}
        }
        
        // Schedule next drawing
        if (!game.gameover) {
            requestAnimationFrame(drawAll);
        }
    }

    // Events for ball launcher
    $("#toucharea").off();
    
    $("#toucharea").on("vmousedown", function (evt) {
        if (balls.length === 0 && !game.gameover) {
            touchPos = getMousePos(evt);
        }
    });
    
    $("#toucharea").on("vmousemove", function (evt) {            
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
    
    $("#toucharea").on("vmouseout", function (evt) {
        launchTarget = null;
        touchPos = null;
    });
    
    $("#toucharea").on("vmouseup", function (evt) {
        if (balls.length === 0 && launchTarget !== null) {
            let mousePos = getMousePos(evt);
			
			let y = height-ballradius+touchPos.y-mousePos.y;
			let x = launchx+touchPos.x-mousePos.x;
			
            launchTarget = {
				x: x,
				y: y
			}
            
            if(Math.pow(launchTarget.x-launchx, 2)+Math.pow(launchTarget.y-height+ballradius, 2) > 100*ballradius*ballradius) {			
            	shoot(launchTarget.x, launchTarget.y);
            }
        }            
        launchTarget = null;
        touchPos = null;
    });
    
    // Reload button
    $("#reload").off();
    $("#reload").click(function() {
    	game.gameover = true;
    	loadGame();
    });

    $("#sound").off();
    $("#sound").click(function() {
    	mute = !mute;
    	soundImg.attr("src", mute ? "images/nosound.png" : "images/sound.png");
    });

    // Start drawing
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
}

function solveQuadraticEquation(a, b, c) {
	let delta = b*b-4*a*c;
    
    if(delta >= 0) {
    	let x1 = (-b+Math.sqrt(delta))/(2*a);
    	let x2 = (-b-Math.sqrt(delta))/(2*a);
   	 
    	// return only the first positive solution
    	let x = (x1 < x2 && x1 >= 0) ? x1 : x2;
        
        return x;
    }
    
    return null;
}
