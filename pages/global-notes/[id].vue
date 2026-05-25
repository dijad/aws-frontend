<script setup lang="ts">
import type { NoteDto } from '~/types/api';

const { apiFetch } = useApi();
const { can } = usePermissions();
const route = useRoute();
const auth = useAuthStore();
const id = route.params.id as string;

const note = ref<NoteDto | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showRejectDialog = ref(false);
const rejectionReason = ref('');
const acting = ref(false);
const newComment = ref('');

async function load() {
  loading.value = true;
  error.value = null;
  try {
    note.value = await apiFetch<NoteDto>(`/notes/${id}`);
  } catch (e: unknown) {
    error.value = ((e as { data?: { message?: string } }).data?.message) ?? (e as Error).message ?? 'Error';
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const canApprove = computed(() => note.value?.status === 'PENDING' && can('NOTE_APPROVE_REJECT'));
const isOwn = computed(() => note.value?.authorId === auth.user?.id);

async function approve() {
  if (!note.value) return;
  acting.value = true;
  try {
    await apiFetch(`/notes/${note.value.id}/approve`, { method: 'POST' });
    await load();
  } finally {
    acting.value = false;
  }
}

async function rejectSubmit() {
  if (!note.value || !rejectionReason.value.trim()) return;
  acting.value = true;
  try {
    await apiFetch(`/notes/${note.value.id}/reject`, { method: 'POST', body: { reason: rejectionReason.value } });
    showRejectDialog.value = false;
    rejectionReason.value = '';
    await load();
  } finally {
    acting.value = false;
  }
}

async function addComment() {
  if (!note.value || !newComment.value.trim()) return;
  await apiFetch(`/notes/${note.value.id}/sub-notes`, { method: 'POST', body: { content: newComment.value } });
  newComment.value = '';
  await load();
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <NuxtLink to="/global-notes" class="back-link">
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><polyline points="15 18 9 12 15 6" /></svg>
      My notes
    </NuxtLink>

    <div v-if="loading" class="state-block">Loading…</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <template v-else-if="note">
      <article class="animate-reveal card-elevated note-article" data-delay="1">
        <header class="note-head">
          <div class="note-author">
            <div class="note-avatar">{{ note.author.name.charAt(0) }}</div>
            <div>
              <p class="note-author-name">{{ note.author.name }}</p>
              <p class="note-time">{{ new Date(note.createdAt).toLocaleString('en') }}</p>
            </div>
          </div>
          <NotesNoteStatusBadge :status="note.status" />
        </header>

        <h1 class="note-title">{{ note.title }}</h1>

        <div v-if="note.mentions.length || note.recipients.length" class="note-tags">
          <span v-if="note.mentions.length" class="tag">
            @{{ note.mentions.map((m) => m.user.name).join(', @') }}
          </span>
          <span v-if="note.recipients.length" class="tag">
            → {{ note.recipients.map((r) => r.user.name).join(', ') }}
          </span>
        </div>

        <div class="note-body">
          <NotesNoteContentViewer :content="note.contentJson" />
        </div>

        <div v-if="canApprove" class="note-actions">
          <button class="btn-secondary" :disabled="acting" @click="showRejectDialog = true">Reject</button>
          <button class="btn-primary" :disabled="acting" @click="approve">Approve</button>
        </div>
      </article>

      <section v-if="note.subNotes.length" class="animate-reveal" data-delay="2">
        <p class="section-label">Comments · {{ note.subNotes.length }}</p>
        <ul class="comments">
          <li v-for="s in note.subNotes" :key="s.id" class="comment" :class="s.type === 'REJECTION_REASON' && 'comment--rejection'">
            <div class="comment-head">
              <span class="comment-author">{{ s.author.name }}</span>
              <span class="comment-time">{{ new Date(s.createdAt).toLocaleString('en') }}</span>
            </div>
            <p v-if="s.type === 'REJECTION_REASON'" class="comment-tag">Rejection reason</p>
            <p class="comment-body">{{ s.content }}</p>
          </li>
        </ul>
      </section>

      <form v-if="isOwn || can('NOTE_APPROVE_REJECT')" class="animate-reveal card comment-form" data-delay="3" @submit.prevent="addComment">
        <textarea v-model="newComment" rows="2" class="input" placeholder="Add a comment…" />
        <div class="flex justify-end">
          <button type="submit" class="btn-primary text-xs" style="padding: 0.375rem 0.75rem">Comment</button>
        </div>
      </form>
    </template>

    <Teleport to="body">
      <div v-if="showRejectDialog" class="modal-overlay fixed inset-0 z-40 flex items-center justify-center p-4">
        <div class="modal-panel w-full max-w-md p-6 space-y-4">
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--ink-strong); letter-spacing:-0.02em">Reject note</h3>
            <p class="text-sm mt-1" style="color: var(--ink-soft)">Provide a reason. Only the author will see this message.</p>
          </div>
          <textarea v-model="rejectionReason" rows="4" class="input" placeholder="Rejection reason…" />
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-secondary" @click="showRejectDialog = false">Cancel</button>
            <button class="btn-danger" :disabled="acting || !rejectionReason.trim()" @click="rejectSubmit">Reject</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  margin-left: -0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink-soft);
  border-radius: 6px;
}
.back-link:hover { color: var(--ink); background: var(--surface-hover); }
.note-article {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
}
.note-author-name { font-size: 0.875rem; font-weight: 600; color: var(--ink); }
.note-time { margin-top: 1px; font-size: 0.75rem; color: var(--ink-faint); }
.note-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink-strong);
  line-height: 1.25;
}
.note-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.tag {
  display: inline-flex;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ink-soft);
  background: var(--surface-card);
  border-radius: 6px;
}
.note-body {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--ink);
}
.note-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--rule-soft);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 0.625rem;
}
.comments { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.comment {
  padding: 1rem 1.125rem;
  background: var(--surface-card);
  border-radius: 10px;
}
.comment--rejection {
  background: var(--danger-soft);
  color: var(--danger);
}
.comment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.comment-author { font-size: 0.8125rem; font-weight: 600; color: var(--ink); }
.comment-time { font-size: 0.6875rem; color: var(--ink-faint); }
.comment-tag {
  margin-top: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--danger);
}
.comment-body {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink-soft);
  white-space: pre-line;
}
.comment-form {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.state-block {
  padding: 4rem 1rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 12px;
  color: var(--ink-soft);
  font-size: 0.875rem;
}
.form-error {
  padding: 0.75rem 1rem;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.875rem;
  border-radius: 8px;
}
</style>
