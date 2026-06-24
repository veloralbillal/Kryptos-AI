export function playPcm(base64Data: string, sampleRate: number = 24000, playbackRate: number = 1.0) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const pcmData = new Int16Array(bytes.buffer);
  const floatData = new Float32Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    floatData[i] = pcmData[i] / 0x8000;
  }

  const buffer = audioContext.createBuffer(1, floatData.length, sampleRate);
  buffer.getChannelData(0).set(floatData);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  source.connect(audioContext.destination);
  source.start();
  
  source.onended = () => {
    audioContext.close();
  };
}
