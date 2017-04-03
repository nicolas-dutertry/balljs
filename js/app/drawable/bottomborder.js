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

define(['./obstacle'], function(Obstacle) {
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
	
	return BottomBorder;
});