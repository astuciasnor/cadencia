export function createPhaseEndSound() {
  let audioContext = null;

  return {
    prime,
    play,
    destroy
  };

  async function prime() {
    const context = ensureContext();
    if (!context) {
      return false;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch (error) {
        return false;
      }
    }

    return context.state === "running";
  }

  async function play() {
    const context = ensureContext();
    if (!context) {
      return false;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch (error) {
        return false;
      }
    }

    if (context.state !== "running") {
      return false;
    }

    const startAt = context.currentTime + 0.01;
    playTone(context, startAt, 659.25, 0.2, 0.015);
    playTone(context, startAt + 0.12, 523.25, 0.24, 0.010);
    return true;
  }

  function destroy() {
    if (!audioContext) {
      return;
    }

    if (audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
    }
    audioContext = null;
  }

  function ensureContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextCtor();
    }

    return audioContext;
  }
}

function playTone(context, startAt, frequency, durationSeconds, peakGain) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + durationSeconds + 0.03);
}
