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

define(["./soundproperties"], function(soundProperties) {
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
			if(soundProperties.mute) {
				return;
			}
			if(this.pool[this.currSound].currentTime == 0 || this.pool[this.currSound].ended) {
				this.pool[this.currSound].play();
			}
			this.currSound = (this.currSound + 1) % this.pool.length;
		};
	}
	
	return SoundPool;
});
