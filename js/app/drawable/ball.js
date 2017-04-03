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

define(['./drawable'], function(Drawable) {
	class Ball extends Drawable {
	    constructor(ctx, canvasheight, starttime, x, y, radius, speedx, speedy) {
	    	super(ctx);
	    	this.canvasheight = canvasheight;
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
	        	let speedsquare = this.speedx*this.speedx + this.speedy*this.speedy;
	        	this.speedy = this.radius;
	        	if(this.speedx > 0) {
	        		this.speedx = Math.sqrt(speedsquare-this.radius*this.radius);
	        	} else {
	        		this.speedx = -Math.sqrt(speedsquare-this.radius*this.radius);
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
			if(newy > this.canvasheight - this.radius) {
				if(this.launched) {
					this.deleted = true;
				}
				return;
			}
			
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
	
	return Ball;
});