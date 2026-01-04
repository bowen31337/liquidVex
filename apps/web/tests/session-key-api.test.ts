/**
 * Simple test for session key functionality
 */

import { describe, it, expect } from 'vitest';
import { createSessionKey, revokeSessionKey } from '@/lib/api';

describe('Session Key API', () => {
  it('should have createSessionKey function', () => {
    expect(createSessionKey).toBeDefined();
    expect(typeof createSessionKey).toBe('function');
  });

  it('should have revokeSessionKey function', () => {
    expect(revokeSessionKey).toBeDefined();
    expect(typeof revokeSessionKey).toBe('function');
  });
});