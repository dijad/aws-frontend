import { io, type Socket } from 'socket.io-client';
import type { NoteSyncPayload, NotificationDto } from '~/types/api';
import { syncFromNotificationType } from '~/utils/note-notification-sync';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const auth = useAuthStore();
  const notifications = useNotificationsStore();
  const notesRealtime = useNotesRealtimeStore();

  let socket: Socket | null = null;

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  function connect() {
    if (!auth.accessToken || socket) return;
    socket = io(`${config.public.wsBase}/ws`, {
      transports: ['websocket'],
      auth: { token: auth.accessToken },
      reconnection: true,
    });
    socket.on('notification:new', (n: NotificationDto) => {
      notifications.addRealtime(n);
      if (n.referenceType !== 'NOTE') return;
      const sync = syncFromNotificationType(n.type);
      if (sync) void notesRealtime.fetchAndSync(n.referenceId, sync);
    });
    socket.on('note:sync', (payload: NoteSyncPayload) => {
      notesRealtime.applySync(payload);
    });
    socket.on('connect_error', () => {
      // silently fail; refresh handler will re-auth on REST first
    });
  }

  watch(
    () => auth.accessToken,
    (val, oldVal) => {
      if (val && val !== oldVal) {
        disconnect();
        connect();
      }
      if (!val) disconnect();
    },
    { immediate: true },
  );

  return {
    provide: {
      socket: () => socket,
    },
  };
});
