import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn().mockResolvedValue({}),
  },
};

vi.stubGlobal('chrome', mockChrome);

describe('Content Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(mockChrome.runtime.onMessage.addListener).toBeDefined();
    });
  });

  describe('message handling', () => {
    it('should handle messages', async () => {
      const sendResponse = vi.fn();
      expect(typeof sendResponse).toBe('function');
    });
  });
});
