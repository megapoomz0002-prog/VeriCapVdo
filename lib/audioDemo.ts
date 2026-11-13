/**
 * Generates an authentic Phuea Chiwit Acoustic Guitar Arpeggio loop (G - Em - C - D)
 * completely client-side via Web Audio API. Zero external dependencies.
 */
export async function createAcousticDemoAudio(): Promise<string> {
  const AudioCtx =
    typeof window !== "undefined"
      ? window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
      : undefined;

  if (!AudioCtx) {
    throw new Error("เบราว์เซอร์นี้ไม่รองรับการสร้างเสียงจำลอง (OfflineAudioContext)");
  }

  const sampleRate = 44100;
  const duration = 25;
  const offlineCtx = new AudioCtx(2, sampleRate * duration, sampleRate);

  // Chords: G Major, E Minor, C Major, D Major (78 BPM)
  const beat = 60 / 78;
  const chords = [
    [196.0, 246.94, 293.66, 392.0],
    [164.81, 196.0, 246.94, 329.63],
    [130.81, 164.81, 196.0, 261.63],
    [146.83, 185.0, 220.0, 293.66],
  ];

  const pluck = (freq: number, startTime: number, volume = 0.2) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    const filter = offlineCtx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, startTime);
    filter.frequency.exponentialRampToValueAtTime(300, startTime + 1.2);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + 2.0);
  };

  let t = 0.5;
  let measure = 0;
  while (t < duration - 1.5) {
    const chord = chords[measure % chords.length];
    pluck(chord[0], t, 0.28);
    pluck(chord[1], t + beat * 0.5, 0.15);
    pluck(chord[2], t + beat * 1.0, 0.18);
    pluck(chord[3], t + beat * 1.5, 0.22);
    pluck(chord[2], t + beat * 2.0, 0.16);
    pluck(chord[1], t + beat * 2.5, 0.14);
    pluck(chord[3], t + beat * 3.0, 0.2);
    pluck(chord[2], t + beat * 3.5, 0.15);

    t += beat * 4;
    measure++;
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  return URL.createObjectURL(wavBlob);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  out.setUint32(0, 0x46464952, true); // "RIFF"
  out.setUint32(4, length - 8, true);
  out.setUint32(8, 0x45564157, true); // "WAVE"
  out.setUint32(12, 0x20746d66, true); // "fmt "
  pos = 16;
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  out.setUint32(36, 0x61746164, true); // "data"
  pos = 40;
  setUint32(length - 44);

  pos = 44;
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      const clamped = Math.max(-1, Math.min(1, channels[i][offset]));
      const int16 = Math.round(clamped < 0 ? clamped * 32768 : clamped * 32767);
      out.setInt16(pos, int16, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: "audio/wav" });
}
