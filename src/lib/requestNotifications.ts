export interface RequestNotification {
  read: boolean;
  request: { id: string; status: string } | null;
}

export function countUnreadPendingRequests(notifications: RequestNotification[]): number {
  return new Set(notifications.flatMap(({ read, request }) =>
    !read && request?.status === 'pending' ? [request.id] : []
  )).size;
}