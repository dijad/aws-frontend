import { defineStore } from 'pinia';
import type { NotificationDto } from '~/types/api';

interface NotificationState {
  items: NotificationDto[];
  unreadCount: number;
  loaded: boolean;
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationState => ({
    items: [],
    unreadCount: 0,
    loaded: false,
  }),
  actions: {
    async fetch() {
      const { apiFetch } = useApi();
      const items = await apiFetch<NotificationDto[]>('/notifications?take=50');
      this.items = items;
      this.unreadCount = items.filter((n) => !n.isRead).length;
      this.loaded = true;
    },
    async fetchUnreadCount() {
      const { apiFetch } = useApi();
      const { count } = await apiFetch<{ count: number }>(
        '/notifications/unread-count',
      );
      this.unreadCount = count;
    },
    async markRead(id: string) {
      const { apiFetch } = useApi();
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      const item = this.items.find((n) => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    },
    async markAllRead() {
      const { apiFetch } = useApi();
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      this.items.forEach((n) => (n.isRead = true));
      this.unreadCount = 0;
    },
    addRealtime(notification: NotificationDto) {
      this.items.unshift(notification);
      if (!notification.isRead) this.unreadCount += 1;
    },
  },
});
