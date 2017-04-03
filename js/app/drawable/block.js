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
 *	  http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

define(['app/constants', './obstacle', '../soundpool'], function(constants, Obstacle, SoundPool) {
	
	const blocksound = new SoundPool("sounds/rebound.wav", .2, 20);
	const explosionsound = new SoundPool("sounds/rebound.wav", .2, 10);
	
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
			if(this.y > this.space + (this.length+this.space)*constants.blockpercol) {
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
	
	return Block;
});