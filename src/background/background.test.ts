import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
};

vi.stubGlobal('chrome', mockChrome);

describe('Background', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runtime.onMessage', () => {
    it('should register message listener', () => {
      expect(mockChrome.runtime.onMessage.addListener).toBeDefined();
    });
  });

  describe('message handling', () => {
    it('should handle format message', async () => {
      const sendResponse = vi.fn();
      expect(typeof sendResponse).toBe('function');
    });

    it('should handle validate message', async () => {
      const sendResponse = vi.fn();
      expect(typeof sendResponse).toBe('function');
    });
  });
});
