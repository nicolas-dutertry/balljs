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

define(['./drawable'], function(Drawable) {
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
	
	return Obstacle;
});