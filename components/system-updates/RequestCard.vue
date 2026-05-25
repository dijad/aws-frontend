<script setup lang="ts">
import type { SystemUpdateDto } from '~/types/api';

defineProps<{ item: SystemUpdateDto }>();

function timeAgo(d: string) {
  const date = new Date(d);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'hace instantes';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}
</script>

<template>
  <NuxtLink :to="`/global-notes/system-updates/${item.id}`" class="card card-interactive su-card">
    <div class="su-head">
      <div class="su-tags">
        <span class="badge" :class="item.type === 'BUG_FIX' ? 'badge--danger' : 'badge--accent'">
          {{ item.type === 'BUG_FIX' ? 'Bug' : 'Enhancement' }}
        </span>
        <SystemUpdatesPriorityBadge :priority="item.priority" />
      </div>
      <SystemUpdatesStatusBadge :status="item.status" />
    </div>

    <h3 class="su-title">{{ item.title }}</h3>
    <p class="su-excerpt">{{ item.description }}</p>

    <div class="su-meta">
      <span class="su-author">{{ item.requester.name }}</span>
      <span class="su-dot">·</span>
      <span>{{ item.module.name }}</span>
      <span class="su-dot">·</span>
      <span>{{ timeAgo(item.createdAt) }}</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.su-card {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem;
  text-decoration: none;
  color: inherit;
}
.su-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.su-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }
.su-title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: var(--ink-strong);
}
.su-card:hover .su-title { color: var(--accent); }
.su-excerpt {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.su-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--ink-faint);
}
.su-author { font-weight: 500; color: var(--ink-soft); }
.su-dot { color: var(--ink-trace); }
</style>
