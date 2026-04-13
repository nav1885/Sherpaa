/**
 * Queue-based TTS using expo-speech.
 * Speaks one utterance at a time; queued utterances play in order.
 */
import * as Speech from 'expo-speech';

const _queue: string[] = [];
let _speaking = false;

async function _processQueue(): Promise<void> {
  if (_speaking || _queue.length === 0) return;
  _speaking = true;
  const text = _queue.shift()!;

  return new Promise<void>((resolve) => {
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.95,
      onDone: () => {
        _speaking = false;
        resolve();
        _processQueue();
      },
      onError: () => {
        _speaking = false;
        resolve();
        _processQueue();
      },
      onStopped: () => {
        _speaking = false;
        resolve();
      },
    });
  });
}

/** Queue a text utterance. Plays immediately if nothing else is speaking. */
export function speak(text: string): void {
  _queue.push(text);
  _processQueue();
}

/** Stop current speech and clear the queue. */
export function stop(): void {
  _queue.length = 0;
  _speaking = false;
  Speech.stop();
}

/** Whether TTS is currently speaking. */
export function isSpeaking(): boolean {
  return _speaking;
}
