import { describe, expect, test } from 'bun:test';
import { countUnreadPendingRequests } from './requestNotifications';

describe('request notification badges', () => {
  test('two unread pending requests display two', () => {
    expect(countUnreadPendingRequests([
      { read: false, request: { id: 'a', status: 'pending' } },
      { read: false, request: { id: 'b', status: 'pending' } },
    ])).toBe(2);
  });
  test('viewed requests no longer display a badge', () => {
    expect(countUnreadPendingRequests([{ read: true, request: { id: 'a', status: 'pending' } }])).toBe(0);
  });
  test('accepted and declined requests no longer display a badge even with old unread records', () => {
    expect(countUnreadPendingRequests([
      { read: false, request: { id: 'a', status: 'accepted' } },
      { read: false, request: { id: 'b', status: 'declined' } },
    ])).toBe(0);
  });
  test('deleted requests and duplicate notifications cannot inflate the badge', () => {
    expect(countUnreadPendingRequests([
      { read: false, request: null },
      { read: false, request: { id: 'a', status: 'pending' } },
      { read: false, request: { id: 'a', status: 'pending' } },
    ])).toBe(1);
  });
});