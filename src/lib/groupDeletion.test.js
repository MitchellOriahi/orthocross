import { describe, expect, test } from 'bun:test';
import { canDeleteCreatedGroup } from './groupDeletion';

describe('creator group deletion', () => {
  test('creators can delete before three people join and after activation', () => {
    for (const member_count of [0, 1, 2, 3, 8]) {
      expect(canDeleteCreatedGroup('creator', { created_by: 'creator', member_count })).toBe(true);
    }
  });

  test('other members and signed-out users cannot delete a creator’s group', () => {
    expect(canDeleteCreatedGroup('member', { created_by: 'creator' })).toBe(false);
    expect(canDeleteCreatedGroup(undefined, { created_by: 'creator' })).toBe(false);
    expect(canDeleteCreatedGroup('creator', null)).toBe(false);
  });

  test('owner and admin membership never override the original creator', () => {
    for (const role of ['owner', 'admin', 'member']) {
      expect(canDeleteCreatedGroup('different-account', { created_by: 'creator', role })).toBe(false);
      expect(canDeleteCreatedGroup('creator', { created_by: 'creator', role })).toBe(true);
    }
  });
});