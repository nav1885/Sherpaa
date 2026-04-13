/**
 * Jest setup — mock native modules that aren't available in Node.
 */

// expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn((_text: string, opts?: { onDone?: () => void }) => {
    // Simulate async speech completion
    if (opts?.onDone) setTimeout(opts.onDone, 10);
  }),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  Accuracy: {
    BestForNavigation: 6,
    High: 4,
  },
}));

// expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// expo-sqlite — mock drizzle db
jest.mock('../db/client', () => {
  const mockRun = jest.fn().mockReturnValue({ changes: 0 });
  const mockAll = jest.fn().mockReturnValue([]);
  const mockGet = jest.fn().mockReturnValue(undefined);

  const chainable = () => {
    const chain: any = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.from = jest.fn().mockReturnValue(chain);
    chain.where = jest.fn().mockReturnValue(chain);
    chain.orderBy = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockReturnValue(chain);
    chain.insert = jest.fn().mockReturnValue(chain);
    chain.values = jest.fn().mockReturnValue(chain);
    chain.delete = jest.fn().mockReturnValue(chain);
    chain.update = jest.fn().mockReturnValue(chain);
    chain.set = jest.fn().mockReturnValue(chain);
    chain.onConflictDoUpdate = jest.fn().mockReturnValue(chain);
    chain.run = mockRun;
    chain.all = mockAll;
    chain.get = mockGet;
    return chain;
  };

  return {
    db: {
      select: jest.fn().mockImplementation(() => chainable()),
      insert: jest.fn().mockImplementation(() => chainable()),
      delete: jest.fn().mockImplementation(() => chainable()),
      update: jest.fn().mockImplementation(() => chainable()),
      run: mockRun,
    },
  };
});

// react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: (obj: any) => obj.android },
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
  RefreshControl: 'RefreshControl',
}));

// react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: 'SafeAreaProvider',
}));

// Silence console.log in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
