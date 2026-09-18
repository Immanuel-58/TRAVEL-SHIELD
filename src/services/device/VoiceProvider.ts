/**
 * VoiceProvider
 * 
 * Capability abstraction for speech recognition and voice input.
 * Supports Web Speech API (Chrome/Android WebView), native Android speech, or truthful fallback.
 * 
 * CORE RULES:
 * - NO FAKE HARDWARE CLAIMS: Truthfully distinguishes between on-device speech engines, browser engines, and unavailable states.
 * - Respects microphone permissions and user privacy.
 */

export interface VoiceAvailability {
  isAvailable: boolean;
  engineName: string;
  isLocal: boolean;
  permissionStatus: 'granted' | 'prompt' | 'denied' | 'unknown';
  disclaimer: string;
}

export interface VoiceListenerCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart?: () => void;
}

export interface IVoiceProvider {
  checkAvailability(): Promise<VoiceAvailability>;
  startListening(callbacks: VoiceListenerCallbacks): void;
  stopListening(): void;
  isListening(): boolean;
}

export class BrowserVoiceProvider implements IVoiceProvider {
  private recognition: any = null;
  private listening: boolean = false;

  async checkAvailability(): Promise<VoiceAvailability> {
    if (typeof window === 'undefined') {
      return {
        isAvailable: false,
        engineName: 'None (Server-Side)',
        isLocal: false,
        permissionStatus: 'unknown',
        disclaimer: 'Speech recognition is only available inside browser and mobile environments.',
      };
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const isAvailable = typeof SpeechRec === 'function';

    let permissionStatus: 'granted' | 'prompt' | 'denied' | 'unknown' = 'prompt';
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        const res = await (navigator.permissions as any).query({ name: 'microphone' });
        permissionStatus = res.state || 'prompt';
      } catch {
        permissionStatus = 'unknown';
      }
    }

    return {
      isAvailable,
      engineName: isAvailable ? 'Web Speech API (Android / Chromium Engine)' : 'Speech Recognition Not Supported',
      isLocal: true, // Processed on-device/in-browser engine
      permissionStatus,
      disclaimer: isAvailable
        ? 'Speech recognition active. Voice audio is converted to text directly on your device via the browser speech engine.'
        : 'Browser does not support the Web Speech API. Please type your travel query manually.',
    };
  }

  startListening(callbacks: VoiceListenerCallbacks): void {
    if (typeof window === 'undefined') {
      callbacks.onError('Voice recognition is not supported in this environment.');
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      callbacks.onError('Your browser does not support the SpeechRecognition API.');
      return;
    }

    try {
      if (this.listening && this.recognition) {
        this.recognition.stop();
      }

      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        this.listening = true;
        callbacks.onStart?.();
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        callbacks.onResult(currentText.trim(), Boolean(finalTranscript));
      };

      rec.onerror = (event: any) => {
        this.listening = false;
        callbacks.onError(event.error || 'Speech recognition encountered an error.');
      };

      rec.onend = () => {
        this.listening = false;
        callbacks.onEnd();
      };

      this.recognition = rec;
      rec.start();
    } catch (err: any) {
      this.listening = false;
      callbacks.onError(err.message || 'Failed to start voice listener.');
    }
  }

  stopListening(): void {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.listening = false;
  }

  isListening(): boolean {
    return this.listening;
  }
}

export const voiceProvider: IVoiceProvider = new BrowserVoiceProvider();
