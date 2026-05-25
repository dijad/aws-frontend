<script setup lang="ts">
const store = useNotificationsStore();
onMounted(() => store.fetch());

async function open(id: string, refType: string, refId: string) {
  await store.markRead(id);
  if (refType === 'NOTE') await navigateTo(`/global-notes/${refId}`);
  else await navigateTo(`/global-notes/system-updates/${refId}`);
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <UiAppPageHeader>
      <h1 class="page-title">Notifications</h1>
      <p class="page-subtitle">{{ store.unreadCount }} unread.</p>
      <template #actions>
        <button class="btn-secondary text-sm" :disabled="store.unreadCount === 0" @click="store.markAllRead()">
          Mark all read
        </button>
      </template>
    </UiAppPageHeader>

    <div v-if="store.items.length === 0" class="state-block">No notifications.</div>
    <ul v-else class="card animate-reveal notif-list" data-delay="2">
      <li
        v-for="n in store.items"
        :key="n.id"
        class="notif-item"
        :class="!n.isRead && 'notif-item--unread'"
        @click="open(n.id, n.referenceType, n.referenceId)"
      >
        <div v-if="!n.isRead" class="dot" />
        <div v-else class="dot-spacer" />
        <div class="min-w-0 flex-1">
          <p class="notif-msg">{{ n.message }}</p>
          <p class="notif-time">{{ new Date(n.createdAt).toLocaleString('en') }}</p>
        </div>
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-faint)">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.state-block {
  padding: 4rem 1rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 12px;
  color: var(--ink-soft);
  font-size: 0.875rem;
}
.notif-list { list-style: none; padding: 0.5rem; display: flex; flex-direction: column; gap: 2px; }
.notif-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
}
.notif-item:hover { background: var(--surface-hover); }
.notif-item--unread { background: var(--accent-soft); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.dot-spacer { width: 8px; }
.notif-msg { font-size: 0.875rem; line-height: 1.4; color: var(--ink); }
.notif-time { margin-top: 2px; font-size: 0.6875rem; color: var(--ink-faint); }
</style>
