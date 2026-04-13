import * as Speech from 'expo-speech';
import { speak, stop, isSpeaking } from '../services/ttsService';

// Reset module state between tests
beforeEach(() => {
  jest.clearAllMocks();
  stop(); // clear any queued state
});

describe('ttsService', () => {
  describe('speak', () => {
    it('calls Speech.speak with the given text', () => {
      speak('Hello rider');
      expect(Speech.speak).toHaveBeenCalledWith(
        'Hello rider',
        expect.objectContaining({
          language: 'en-US',
          rate: 0.95,
        }),
      );
    });

    it('queues multiple utterances', () => {
      speak('First');
      speak('Second');
      // First call should fire immediately
      expect(Speech.speak).toHaveBeenCalledTimes(1);
      expect(Speech.speak).toHaveBeenCalledWith('First', expect.any(Object));
    });
  });

  describe('stop', () => {
    it('calls Speech.stop', () => {
      stop();
      expect(Speech.stop).toHaveBeenCalled();
    });

    it('resets speaking state', () => {
      stop();
      expect(isSpeaking()).toBe(false);
    });
  });

  describe('isSpeaking', () => {
    it('returns false initially', () => {
      expect(isSpeaking()).toBe(false);
    });
  });
});
