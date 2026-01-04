/**
 * Session Key Store Test
 */

import { describe, it, expect } from 'vitest';
import { useSessionKeyStore } from '@/stores/sessionKeyStore';
import type { SessionKey } from '@/types';

describe('Session Key Store', () => {
  it('should have session key store', () => {
    expect(useSessionKeyStore).toBeDefined();
    expect(typeof useSessionKeyStore).toBe('function');
  });

  it('should have correct SessionKey type', () => {
    const mockSessionKey: SessionKey = {
      id: 'test-id',
      name: 'Test Session Key',
      address: '0x1234567890abcdef',
      created_at: '2024-01-01T00:00:00Z',
      last_used: '2024-01-01T00:00:00Z',
      is_active: true,
      permissions: ['trade', 'view']
    };

    expect(mockSessionKey).toBeDefined();
    expect(mockSessionKey.id).toBe('test-id');
    expect(mockSessionKey.name).toBe('Test Session Key');
    expect(mockSessionKey.is_active).toBe(true);
    expect(mockSessionKey.permissions).toEqual(['trade', 'view']);
  });
});