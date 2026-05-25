<script setup lang="ts">
import type { NoteDto } from '~/types/api';

defineProps<{
  note: NoteDto;
  showActions?: boolean;
}>();

const emit = defineEmits<{
  approve: [id: string];
  reject: [id: string];
}>();

function timeAgo(d: string) {
  const date = new Date(d);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en', { day: '2-digit', month: 'short' });
}
</script>

<template>
  <NuxtLink :to="`/global-notes/${note.id}`" class="card card-interactive note-card">
    <div class="note-head">
      <div class="note-author">
        <div class="note-avatar">{{ note.author.name.charAt(0) }}</div>
        <div>
          <p class="note-author-name">{{ note.author.name }}</p>
          <p class="note-time">{{ timeAgo(note.createdAt) }}</p>
        </div>
      </div>
      <NotesNoteStatusBadge :status="note.status" />
    </div>

    <h3 class="note-title">{{ note.title }}</h3>
    <p class="note-excerpt">{{ note.contentText }}</p>

    <div v-if="note.mentions.length || note.recipients.length" class="note-tags">
      <span v-if="note.mentions.length" class="tag">
        @{{ note.mentions.slice(0, 2).map(m => m.user.name).join(', @') }}
        <span v-if="note.mentions.length > 2"> +{{ note.mentions.length - 2 }}</span>
      </span>
      <span v-if="note.recipients.length" class="tag">
        → {{ note.recipients.slice(0, 2).map(r => r.user.name).join(', ') }}
        <span v-if="note.recipients.length > 2"> +{{ note.recipients.length - 2 }}</span>
      </span>
    </div>

    <div v-if="showActions" class="note-actions" @click.prevent.stop>
      <button class="btn-secondary text-xs" style="padding: 0.375rem 0.75rem" @click.prevent="emit('reject', note.id)">Reject</button>
      <button class="btn-primary text-xs" style="padding: 0.375rem 0.75rem" @click.prevent="emit('approve', note.id)">Approve</button>
    </div>
  </NuxtLink>
</template>

<style scoped>
.note-card {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem;
  text-decoration: none;
  color: inherit;
}
.note-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.note-author { display: flex; align-items: center; gap: 0.625rem; }
.note-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
}
.note-author-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
}
.note-time {
  margin-top: 1px;
  font-size: 0.6875rem;
  color: var(--ink-faint);
}
.note-title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: var(--ink-strong);
}
.note-card:hover .note-title { color: var(--accent); }
.note-excerpt {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--ink-soft);
  background: var(--surface);
  border-radius: 6px;
}
.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--rule-soft);
}
</style>
