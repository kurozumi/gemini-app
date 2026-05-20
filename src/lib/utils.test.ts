import { describe, it, expect } from 'vitest';
import { generateUserId, formatIdentity } from './utils';

describe('utils', () => {
  describe('generateUserId', () => {
    it('should generate a user ID starting with "user-"', () => {
      const id = generateUserId();
      expect(id).toMatch(/^user-/);
    });

    it('should be unique on multiple calls', () => {
      const id1 = generateUserId();
      const id2 = generateUserId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatIdentity', () => {
    it('should append role to username', () => {
      const username = 'testuser';
      const role = 'host';
      expect(formatIdentity(username, role)).toBe('testuser-host');
    });

    it('should handle different roles', () => {
      const username = 'testuser';
      expect(formatIdentity(username, 'listener')).toBe('testuser-listener');
    });
  });
});
