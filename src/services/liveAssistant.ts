import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export class LiveAssistantService {
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private audioQueue: Int16Array[] = [];
  private playbackRate = 1.0;
  private nextStartTime = 0;

  constructor(private apiKey: string) {}

  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
  }

  async connect(callbacks: {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: any) => void;
    onMessage?: (text: string) => void;
  }) {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    this.session = await ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      callbacks: {
        onopen: () => {
          this.startMic();
          callbacks.onOpen?.();
        },
        onclose: () => callbacks.onClose?.(),
        onerror: (err) => callbacks.onError?.(err),
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
            this.handleAudioOutput(base64Audio);
          }
          if (message.serverContent?.modelTurn?.parts[0]?.text) {
            callbacks.onMessage?.(message.serverContent.modelTurn.parts[0].text);
          }
          if (message.serverContent?.interrupted) {
            this.audioQueue = [];
            this.nextStartTime = 0;
          }
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: "You are Kryptos, a cybersecurity mentor building the next generation of national digital guardians. Be friendly, conversational, and encouraging. Teach hacking skills for defense and national security. Always emphasize ethics and discourage unethical behavior. Keep your responses concise and to the point. End every response with a follow-up question to deepen their defensive knowledge.",
      },
    });
  }

  private async startMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.processor = this.audioContext.createScriptProcessor(1024, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64Data = this.arrayBufferToBase64(pcmData.buffer);
        
        if (this.session) {
          this.session.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error("Mic access error:", err);
    }
  }

  private handleAudioOutput(base64Data: string) {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcmData = new Int16Array(bytes.buffer);
    this.audioQueue.push(pcmData);
    this.playChunks();
  }

  private async playChunks() {
    if (this.audioQueue.length === 0) return;

    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }

    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.05;
    }

    while (this.audioQueue.length > 0) {
      const pcmData = this.audioQueue.shift()!;
      const floatData = this.pcmToFloat(pcmData);
      const buffer = this.audioContext.createBuffer(1, floatData.length, 24000);
      buffer.getChannelData(0).set(floatData);

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = this.playbackRate;
      source.connect(this.audioContext.destination);
      
      source.start(this.nextStartTime);
      this.nextStartTime += (buffer.duration / this.playbackRate);
    }
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  private pcmToFloat(input: Int16Array): Float32Array {
    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      output[i] = input[i] / 0x8000;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioQueue = [];
    this.nextStartTime = 0;
  }
}
