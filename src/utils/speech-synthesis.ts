/**
 * Speech synthesis utility class for handling text-to-speech functionality
 */
class SpeechSynthesisUtil {
  private static instance: SpeechSynthesisUtil;
  private speaking: boolean = false;
  private spokenMessages: Set<string> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
        };
      }
    }
  }

  static getInstance(): SpeechSynthesisUtil {
    if (!SpeechSynthesisUtil.instance) {
      SpeechSynthesisUtil.instance = new SpeechSynthesisUtil();
    }
    return SpeechSynthesisUtil.instance;
  }
  async speak(text: string, messageId: string): Promise<void> {
    // Don't resynthesize messages we've already spoken
    if (this.hasSpoken(messageId)) {
      return;
    }

    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        this.spokenMessages.add(messageId);
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Get available voices
        let voices = window.speechSynthesis.getVoices();
        
        // If voices aren't loaded yet, wait for them
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            this.setupUtterance(utterance, voices);
          };
        } else {
          this.setupUtterance(utterance, voices);
        }        utterance.onend = () => {
          this.speaking = false;
          this.spokenMessages.add(messageId);
          resolve();
        };

        utterance.onerror = (event) => {
          this.speaking = false;
          this.spokenMessages.add(messageId);
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        this.speaking = true;
        window.speechSynthesis.speak(utterance);

      } catch (error) {
        this.speaking = false;
        reject(error);
      }
    });
  }  private setupUtterance(utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[]): void {
    try {
      // First try to find a female English voice
      const femaleVoices = voices.filter(voice => 
        voice.lang.startsWith('en-') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('google'))
      );

      // Fall back to any English voice
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
      
      // Use the best available voice
      if (femaleVoices.length > 0) {
        utterance.voice = femaleVoices[0];
      } else if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }

      // Set other properties
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    } catch (error) {
      console.error('Error setting up utterance:', error);
      // Continue with default voice if there's an error
    }
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  hasSpoken(messageId: string): boolean {
    return this.spokenMessages.has(messageId);
  }

  stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.speaking = false;
    }
  }
}

export const speechSynthesis = SpeechSynthesisUtil.getInstance();
