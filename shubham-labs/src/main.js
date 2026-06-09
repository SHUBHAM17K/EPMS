import './style.css';
import { initCursor } from './cursor.js';
import { initAudio } from './audio.js';
import { initPreloader } from './preload.js';
import { initSpiral } from './spiral.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize custom inertia cursor
  const cursorEngine = initCursor();

  // 2. Initialize Web Audio API synthesizer
  const audioEngine = initAudio();

  // 3. Initialize circular progress preloader page transition
  initPreloader(() => {
    // 4. Initialize Three.js scene when the user clicks 'Enter Experience'
    initSpiral(audioEngine, cursorEngine);
  });
});
