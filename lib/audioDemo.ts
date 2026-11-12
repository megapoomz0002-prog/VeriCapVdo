/**
 * Generates an authentic Phuea Chiwit Acoustic Guitar Arpeggio loop (G - Em - C - D)
 * completely client-side via Web Audio API. Zero external dependencies!
 */
export function createAcousticDemoAudio(): Promise<string> {
  return new Promise((resolve) => {
    const sampleRate = 44100;
    const duration = 25; // 25 seconds of music
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    // Chords: G Major, E Minor, C Major, D Major (Classic Phuea Chiwit progression)
    // 78 BPM -> 1 beat = 60/78 ≈ 0.769s
    const beat = 60 / 78;
    const chords = [
      // G Major (G3, B3, D4, G4)
      [196.00, 246.94, 293.66, 392.00],
      // E Minor (E3, G3, B3, E4)
      [164.81, 196.00, 246.94, 329.63],
      // C Major (C3, E3, G3, C4)
      [130.81, 164.81, 196.00, 261.63],
      // D Major (D3, F#3, A3, D4)
      [146.83, 185.00, 220.00, 293.66],
    ];

    const pluck = (freq: number, startTime: number, volume: number = 0.2) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      const filter = offlineCtx.createBiquadFilter();

      // Warm acoustic guitar-like harmonics
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

    // Arpeggio pattern for 6 measures (approx 24 seconds)
    let t = 0.5;
    let measure = 0;
    while (t < duration - 1.5) {
      const chord = chords[measure % chords.length];
      // Fingerpicking: Bass note on beat 1, arpeggio on beats 2, 3, 4
      pluck(chord[0], t, 0.28);               // Root Bass
      pluck(chord[1], t + beat * 0.5, 0.15); // String 3
      pluck(chord[2], t + beat * 1.0, 0.18); // String 2
      pluck(chord[3], t + beat * 1.5, 0.22); // String 1
      pluck(chord[2], t + beat * 2.0, 0.16); // String 2
      pluck(chord[1], t + beat * 2.5, 0.14); // String 3
      pluck(chord[3], t + beat * 3.0, 0.20); // High string accent
      pluck(chord[2], t + beat * 3.5, 0.15); // Return

      t += beat * 4;
      measure++;
    }

    offlineCtx.startRendering().then((renderedBuffer) => {
      // Encode AudioBuffer to WAV
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      resolve(URL.createObjectURL(wavBlob));
    });
  });
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
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

  // RIFF identifier
  out.setUint32(0, 0x46464952, true); // "RIFF"
  out.setUint32(4, length - 8, true);
  out.setUint32(8, 0x45564157, true); // "WAVE"
  // FMT sub-chunk
  out.setUint32(12, 0x20746d66, true); // "fmt "
  setUint32(16); // SubChunk1Size
  setUint16(1);  // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);              // block align
  setUint16(16);                         // bits per sample
  // data sub-chunk
  out.setUint32(36, 0x61746164, true); // "data"
  setUint32(length - pos - 4);

  pos = 44;
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: "audio/wav" });
}
