import { describe, expect, test } from 'bun:test';
import {
  countUnreadPendingRequests,
  resolveReceivedRequests,
  resolveUnreadRequestCount,
} from './requestNotifications';

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

  test('falls back to direct friend_requests rows and display_name when RPC fails', () => {
    const requests = resolveReceivedRequests(
      null,
      [{ id: 'req-1', sender_id: 'user-2', created_at: '2026-11-28T00:00:00Z' }],
      [{ id: 'user-2', username: null, display_name: 'Maria', profile_picture_url: 'https://example.com/m.jpg' }],
    );
    expect(requests).toEqual([
      {
        id: 'req-1',
        sender_id: 'user-2',
        username: 'Maria',
        profile_picture_url: 'https://example.com/m.jpg',
        created_at: '2026-11-28T00:00:00Z',
      },
    ]);
  });

  test('keeps received requests visible and falls back to pending count when notifications query fails', () => {
    expect(resolveUnreadRequestCount(null, true, 2)).toBe(2);
    expect(resolveUnreadRequestCount([{ read: true, request: { id: 'a', status: 'pending' } }], false, 2)).toBe(0);
  });
});