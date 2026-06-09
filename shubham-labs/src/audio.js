export function initAudio() {
  const audioToggle = document.getElementById('audio-toggle');
  const soundWave = document.getElementById('sound-wave');
  const statusText = document.getElementById('audio-status-text');

  let audioCtx = null;
  let ambientOsc = null;
  let ambientGain = null;
  let isPlaying = false;

  const initCtx = () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  };

  const startAmbient = () => {
    if (!audioCtx) initCtx();

    ambientOsc = audioCtx.createOscillator();
    ambientGain = audioCtx.createGain();

    ambientOsc.type = 'triangle';
    // Base frequency is 110Hz (A2)
    ambientOsc.frequency.setValueAtTime(110, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime); // Open filter slightly for brightness

    ambientOsc.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);

    ambientGain.gain.setValueAtTime(0, audioCtx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 1.5);

    ambientOsc.start();
  };

  const stopAmbient = () => {
    if (ambientGain) {
      ambientGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        if (ambientOsc) {
          ambientOsc.stop();
          ambientOsc.disconnect();
          ambientOsc = null;
        }
      }, 350);
    }
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAmbient();
      soundWave.classList.remove('playing');
      statusText.textContent = 'SOUND OFF';
      isPlaying = false;
    } else {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      startAmbient();
      soundWave.classList.add('playing');
      statusText.textContent = 'SOUND ON';
      isPlaying = true;
    }
  };

  audioToggle.addEventListener('click', toggleSound);

  const playHoverTick = () => {
    if (!isPlaying || !audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // Shorter, crispier tick
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  };

  // Modulate oscillator frequency dynamically based on velocity
  const setPitchVelocity = (velocity) => {
    if (!isPlaying || !audioCtx || !ambientOsc) return;
    // Map velocity smoothly between 110Hz and 300Hz
    const targetFreq = 110 + Math.min(190, velocity * 400);
    ambientOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.15);
  };

  return {
    playTick: playHoverTick,
    setPitchVelocity: setPitchVelocity,
    ensureContext: () => {
      if (isPlaying && audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
  };
}
