<script setup lang="ts">
import type { NoteDto, NoteListScope } from '~/types/api';

definePageMeta({ permissions: ['NOTE_APPROVE_REJECT'] });

type ApprovalTab = 'pending' | 'approved' | 'rejected' | 'all';

const TABS: { id: ApprovalTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const { apiFetch } = useApi();
const notesRealtime = useNotesRealtimeStore();

const tab = ref<ApprovalTab>('pending');
const notes = ref<NoteDto[]>([]);
const loading = ref(false);
const displayNotes = useMergedNotesList(
  tab as Ref<NoteListScope>,
  notes,
);
const showRejectDialog = ref(false);
const rejectingId = ref<string | null>(null);
const rejectionReason = ref('');

async function load() {
  loading.value = true;
  try {
    notes.value = await apiFetch<NoteDto[]>(`/notes?scope=${tab.value}`);
    notesRealtime.syncFromApi(tab.value, notes.value);
  } finally {
    loading.value = false;
  }
}
watch(tab, (t) => {
  notesRealtime.clearScope(t);
  load();
}, { immediate: true });

async function approve(id: string) {
  await apiFetch(`/notes/${id}/approve`, { method: 'POST' });
  notesRealtime.removeFromScope('pending', id);
  await load();
}

function startReject(id: string) {
  rejectingId.value = id;
  rejectionReason.value = '';
  showRejectDialog.value = true;
}

async function rejectConfirm() {
  const id = rejectingId.value;
  if (!id || !rejectionReason.value.trim()) return;
  await apiFetch(`/notes/${id}/reject`, {
    method: 'POST',
    body: { reason: rejectionReason.value },
  });
  showRejectDialog.value = false;
  rejectingId.value = null;
  notesRealtime.removeFromScope('pending', id);
  await load();
}
</script>

<template>
  <div class="space-y-6">
    <UiAppPageHeader>
      <h1 class="page-title">Note approvals</h1>
      <p class="page-subtitle">Approving notifies tagged users and recipients.</p>
    </UiAppPageHeader>

    <div class="animate-reveal" data-delay="2">
      <div class="filter-tabs filter-tabs--wrap">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          class="filter-tab"
          :class="tab === t.id && 'filter-tab--active'"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="animate-reveal" data-delay="3">
      <div v-if="loading" class="state-block">Loading…</div>
      <div v-else-if="displayNotes.length === 0" class="state-block">Nothing here yet.</div>
      <NotesNoteList
        v-else
        :notes="displayNotes"
        show-actions-column
        @approve="approve"
        @reject="startReject"
      />
    </div>

    <Teleport to="body">
      <div v-if="showRejectDialog" class="modal-overlay fixed inset-0 z-40 flex items-center justify-center p-4">
        <div class="modal-panel w-full max-w-md p-6 space-y-4">
          <div>
            <h3 class="text-lg font-semibold" style="color: var(--ink-strong); letter-spacing: -0.02em">Reject note</h3>
            <p class="text-sm mt-1" style="color: var(--ink-soft)">Provide a reason. Only the author will see this message.</p>
          </div>
          <textarea v-model="rejectionReason" rows="4" class="input" placeholder="Rejection reason…" />
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="showRejectDialog = false">Cancel</button>
            <button class="btn-danger" :disabled="!rejectionReason.trim()" @click="rejectConfirm">Reject</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.filter-tabs--wrap {
  flex-wrap: wrap;
}
.state-block {
  padding: 4rem 1rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 12px;
  color: var(--ink-soft);
  font-size: 0.875rem;
}
</style>
