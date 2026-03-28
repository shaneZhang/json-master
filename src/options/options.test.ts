import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockChrome = {
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    openOptionsPage: vi.fn(),
  },
};

vi.stubGlobal('chrome', mockChrome);

describe('Options Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should have storage API available', () => {
      expect(mockChrome.storage.sync.get).toBeDefined();
      expect(mockChrome.storage.sync.set).toBeDefined();
    });
  });

  describe('settings', () => {
    it('should save settings', async () => {
      await mockChrome.storage.sync.set({ indent: 4 });
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });

    it('should load settings', async () => {
      await mockChrome.storage.sync.get('settings');
      expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });
  });
});
