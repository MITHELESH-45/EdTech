/**
 * Buzzer Audio Utility - Web Audio API singleton for buzzer sound
 * 
 * Uses a square wave oscillator at 800Hz to simulate a real piezo buzzer.
 * Sound plays ONLY when electrically powered and sound is enabled.
 */

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;

const BUZZER_FREQUENCY = 800; // Hz - typical piezo buzzer frequency
const MAX_GAIN = 0.2; // Keep volume reasonable

/**
 * Initialize AudioContext lazily (must be called after user interaction)
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Resume AudioContext if suspended (browser autoplay policy)
 * Call this on user interaction (e.g., toggle click)
 */
export function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

/**
 * Start buzzer sound with given intensity
 * @param intensity - Normalized value 0-1 derived from voltage drop
 */
export function startBuzzerSound(intensity: number): void {
  const ctx = getAudioContext();
  
  // Clamp intensity
  const normalizedIntensity = Math.max(0, Math.min(1, intensity));
  
  if (normalizedIntensity === 0) {
    stopBuzzerSound();
    return;
  }

  // If already playing, just update gain
  if (isPlaying && gainNode) {
    gainNode.gain.setValueAtTime(normalizedIntensity * MAX_GAIN, ctx.currentTime);
    return;
  }

  // Create new oscillator (oscillators are one-time use)
  oscillator = ctx.createOscillator();
  gainNode = ctx.createGain();

  oscillator.type = 'square'; // Closest to real buzzer sound
  oscillator.frequency.setValueAtTime(BUZZER_FREQUENCY, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(normalizedIntensity * MAX_GAIN, ctx.currentTime);

  // Connect: oscillator -> gain -> output
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  isPlaying = true;
}

/**
 * Stop buzzer sound immediately
 */
export function stopBuzzerSound(): void {
  if (oscillator && isPlaying) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch (e) {
      // Oscillator may already be stopped
    }
    oscillator = null;
  }
  
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch (e) {
      // GainNode may already be disconnected
    }
    gainNode = null;
  }
  
  isPlaying = false;
}

/**
 * Check if sound is currently playing
 */
export function isBuzzerPlaying(): boolean {
  return isPlaying;
}

/**
 * Cleanup audio context (call on page unmount)
 */
export function cleanupAudio(): void {
  stopBuzzerSound();
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}















