<script setup lang="ts">
import type { NoteDto } from '~/types/api';

defineProps<{
  notes: NoteDto[];
  showActionsColumn?: boolean;
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

function excerpt(text: string, max = 72) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function showActions(note: NoteDto, showActionsColumn?: boolean) {
  return Boolean(showActionsColumn) && note.status === 'PENDING';
}
</script>

<template>
  <div class="card overflow-hidden">
    <div class="table-scroll">
      <table class="data-table w-full notes-table">
        <thead>
          <tr>
            <th>Title</th>
            <th class="col-author">Author</th>
            <th class="col-status">Status</th>
            <th class="col-date">Created</th>
            <th v-if="showActionsColumn" class="text-right col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="note in notes" :key="note.id">
            <td>
              <NuxtLink :to="`/global-notes/${note.id}`" class="note-title-link">
                <span class="note-title-text">{{ note.title }}</span>
                <span v-if="note.contentText" class="note-excerpt">{{ excerpt(note.contentText) }}</span>
              </NuxtLink>
            </td>
            <td class="col-author">
              <div class="author-cell">
                <span class="author-avatar">{{ note.author.name.charAt(0) }}</span>
                <span class="author-name">{{ note.author.name }}</span>
              </div>
            </td>
            <td class="col-status">
              <NotesNoteStatusBadge :status="note.status" />
            </td>
            <td class="col-date">
              <span class="date-text">{{ timeAgo(note.createdAt) }}</span>
            </td>
            <td v-if="showActionsColumn" class="text-right col-actions">
              <div
                v-if="showActions(note, showActionsColumn)"
                class="row-actions"
                @click.stop
              >
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  @click="emit('reject', note.id)"
                >
                  Reject
                </button>
                <button
                  type="button"
                  class="btn-primary btn-sm"
                  @click="emit('approve', note.id)"
                >
                  Approve
                </button>
              </div>
              <span v-else class="date-text">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-scroll {
  overflow-x: auto;
}
.notes-table tbody td {
  vertical-align: middle;
}
.note-title-link {
  display: block;
  text-decoration: none;
  color: inherit;
  max-width: 28rem;
}
.note-title-link:hover .note-title-text {
  color: var(--accent-text);
}
.note-title-text {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink-strong);
  line-height: 1.3;
}
.note-excerpt {
  display: block;
  margin-top: 0.125rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--ink-faint);
}
.author-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}
.author-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}
.author-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink);
}
.date-text {
  font-size: 0.8125rem;
  color: var(--ink-soft);
  white-space: nowrap;
}
.col-author {
  width: 11rem;
}
.col-status {
  width: 7.5rem;
}
.col-date {
  width: 6.5rem;
}
.col-actions {
  width: 11rem;
}
.row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.375rem;
}
.btn-sm {
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
}
@media (max-width: 767px) {
  .col-date {
    display: none;
  }
  .notes-table thead th.col-date,
  .notes-table tbody td.col-date {
    display: none;
  }
}
</style>
