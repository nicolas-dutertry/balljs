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

require([
	'app/constants',
	'app/soundproperties',
	'app/soundpool',
	'app/drawable/topborder',
	'app/drawable/bottomborder',
	'app/drawable/rightborder',
	'app/drawable/leftborder',
	'app/drawable/block',
	'app/drawable/extraball',
	'app/drawable/ball'],
	
	function(
			constants,
			soundProperties,
			SoundPool,
			TopBorder,
			BottomBorder,
			RightBorder,
			LeftBorder,
			Block,
			ExtraBall,
			Ball) {

var launchsound = new SoundPool("sounds/launch.wav", .2, 1);

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
    soundImg.attr("src", soundProperties.mute ? "images/nosound.png" : "images/sound.png");
    
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
        	let ball = new Ball(ctxBalls, height, currentTime + i * 90, launchx, height - ballradius, ballradius, speedx, speedy);
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
			newBlockCount = 1 + Math.floor((random-0.5)*2*(constants.blockperrow-2));
		}
        var availablePos = new Array();
        for(let i = 0; i < constants.blockperrow; i++) {
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
    	soundProperties.mute = !soundProperties.mute;
    	soundImg.attr("src", soundProperties.mute ? "images/nosound.png" : "images/sound.png");
    });

    // Start drawing
    drawAll();
}

});