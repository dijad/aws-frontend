<script setup lang="ts">
import type { NotificationDto } from '~/types/api';

const store = useNotificationsStore();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

onClickOutside(root, () => (open.value = false));

onMounted(async () => {
  await store.fetch();
});

async function toggle() {
  open.value = !open.value;
  if (open.value && !store.loaded) await store.fetch();
}

function formatTime(d: string) {
  const date = new Date(d);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

async function handleClick(n: NotificationDto) {
  await store.markRead(n.id);
  if (n.referenceType === 'NOTE') {
    await navigateTo(`/global-notes/${n.referenceId}`);
  } else {
    await navigateTo(`/global-notes/system-updates/${n.referenceId}`);
  }
  open.value = false;
}
</script>

<template>
  <div ref="root" class="relative">
    <button type="button" class="btn-icon notif-trigger" :aria-label="$t('nav.notifications')" @click="toggle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px]">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span v-if="store.unreadCount > 0" class="notif-badge">
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <div v-if="open" class="notif-panel">
      <div class="notif-panel-header">
        <p class="notif-panel-title">Notifications</p>
        <button
          type="button"
          class="notif-mark-all"
          :disabled="store.unreadCount === 0"
          @click="store.markAllRead()"
        >
          Mark read
        </button>
      </div>
      <div class="notif-panel-body">
        <p v-if="store.items.length === 0" class="notif-empty">No notifications</p>
        <button
          v-for="n in store.items"
          :key="n.id"
          type="button"
          class="notif-item"
          :class="{ 'notif-item--unread': !n.isRead }"
          @click="handleClick(n)"
        >
          <div v-if="!n.isRead" class="notif-dot" />
          <div v-else class="notif-dot-spacer" />
          <div class="min-w-0 flex-1">
            <p class="notif-msg">{{ n.message }}</p>
            <p class="notif-time">{{ formatTime(n.createdAt) }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-trigger { position: relative; }
.notif-badge {
  position: absolute;
  right: 4px;
  top: 4px;
  display: inline-flex;
  min-width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  background: var(--accent);
  border-radius: 999px;
  border: 2px solid var(--surface-card);
}
.notif-panel {
  position: absolute;
  right: 0;
  z-index: 30;
  margin-top: 0.5rem;
  width: 22rem;
  max-width: calc(100vw - 1rem);
  background: var(--dropdown-bg);
  border-radius: 12px;
  box-shadow: var(--dropdown-shadow);
  overflow: hidden;
  animation: panelFade 0.18s ease forwards;
  transform-origin: top right;
}
@keyframes panelFade {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--rule-soft);
}
.notif-panel-title { font-size: 0.875rem; font-weight: 600; color: var(--ink-strong); }
.notif-mark-all {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--accent);
  background: transparent;
  border: 0;
}
.notif-mark-all:disabled { opacity: 0.4; }
.notif-panel-body {
  max-height: 24rem;
  overflow-y: auto;
  padding: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.notif-empty {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--ink-faint);
}
.notif-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition: background 0.12s;
}
.notif-item:hover { background: var(--surface-hover); }
.notif-item--unread { background: var(--accent-soft); }
.notif-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.notif-dot-spacer { width: 6px; flex-shrink: 0; }
.notif-msg { font-size: 0.8125rem; line-height: 1.35; color: var(--ink); }
.notif-time { margin-top: 2px; font-size: 0.6875rem; color: var(--ink-faint); }
</style>
