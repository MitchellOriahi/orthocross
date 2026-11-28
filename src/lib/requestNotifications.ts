export interface RequestNotification {
  read: boolean;
  request: { id: string; status: string } | null;
}

export interface ReceivedRequestRpcRow {
  request_id: string;
  sender_id: string;
  username: string | null;
  profile_picture_url: string | null;
  created_at: string;
}

export interface DirectFriendRequestRow {
  id: string;
  sender_id: string;
  created_at: string;
}

export interface FriendProfileSummary {
  id: string;
  username: string | null;
  display_name?: string | null;
  profile_picture_url: string | null;
}

export interface NormalizedReceivedRequest {
  id: string;
  sender_id: string;
  username: string;
  profile_picture_url: string | null;
  created_at: string;
}

export function countUnreadPendingRequests(notifications: RequestNotification[]): number {
  return new Set(notifications.flatMap(({ read, request }) =>
    !read && request?.status === 'pending' ? [request.id] : []
  )).size;
}

export function resolveReceivedRequests(
  rpcRows: ReceivedRequestRpcRow[] | null,
  directRows: DirectFriendRequestRow[] | null,
  profiles: FriendProfileSummary[] | null = null,
): NormalizedReceivedRequest[] {
  if (rpcRows) {
    return rpcRows.map((req) => ({
      id: req.request_id,
      sender_id: req.sender_id,
      username: req.username?.trim() || 'User',
      profile_picture_url: req.profile_picture_url || null,
      created_at: req.created_at,
    }));
  }

  if (!directRows || directRows.length === 0) return [];
  const profileById = new Map((profiles || []).map((p) => [p.id, p]));
  return directRows.map((req) => {
    const profile = profileById.get(req.sender_id);
    const name = profile?.username?.trim() || profile?.display_name?.trim() || 'User';
    return {
      id: req.id,
      sender_id: req.sender_id,
      username: name,
      profile_picture_url: profile?.profile_picture_url || null,
      created_at: req.created_at,
    };
  });
}

export function resolveUnreadRequestCount(
  notifications: RequestNotification[] | null,
  notificationsFailed: boolean,
  pendingRequestCount: number,
): number {
  if (notificationsFailed) return pendingRequestCount;
  return countUnreadPendingRequests(notifications || []);
}