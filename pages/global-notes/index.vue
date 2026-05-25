<script setup lang="ts">
import type { NoteDto } from '~/types/api';

const { apiFetch } = useApi();
const { can } = usePermissions();
const auth = useAuthStore();

const scope = ref<'all' | 'mine' | 'mentions' | 'received'>('mine');
const notes = ref<NoteDto[]>([]);
const loading = ref(false);
const notesRealtime = useNotesRealtimeStore();
const displayNotes = useMergedNotesList(scope, notes);

async function load() {
  loading.value = true;
  try {
    const path = scope.value === 'all' ? '/notes' : `/notes?scope=${scope.value}`;
    notes.value = await apiFetch<NoteDto[]>(path);
    notesRealtime.syncFromApi(scope.value, notes.value);
  } finally {
    loading.value = false;
  }
}

watch(scope, (s) => {
  notesRealtime.clearScope(s);
  load();
}, { immediate: true });

const scopeLabels: Record<string, string> = {
  mine: 'My notes',
  mentions: 'Mentioned',
  received: 'Received',
  all: 'All',
};
</script>

<template>
  <div class="space-y-6">
    <UiAppPageHeader>
      <h1 class="page-title">My notes</h1>
      <p class="page-subtitle">
        Hi {{ auth.user?.name?.split(' ')[0] }} · {{ displayNotes.length }} {{ displayNotes.length === 1 ? 'note' : 'notes' }}
      </p>
      <template v-if="can('NOTE_CREATE') && !loading && displayNotes.length > 0" #actions>
        <NuxtLink to="/global-notes/new" class="btn-primary">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New note
        </NuxtLink>
      </template>
    </UiAppPageHeader>

    <div>
      <div class="filter-tabs">
        <button
          v-for="opt in ['mine', 'mentions', 'received', 'all']"
          :key="opt"
          type="button"
          class="filter-tab"
          :class="scope === opt && 'filter-tab--active'"
          @click="scope = opt as any"
        >
          {{ scopeLabels[opt] }}
        </button>
      </div>
    </div>

    <div>
      <div v-if="loading" class="state-block">Loading…</div>
      <div v-else-if="displayNotes.length === 0" class="state-block">
        <p class="state-title">Nothing here yet.</p>
        <p class="state-sub">Get started by creating your first note.</p>
        <NuxtLink v-if="can('NOTE_CREATE')" to="/global-notes/new" class="btn-primary state-cta">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New note
        </NuxtLink>
      </div>
      <NotesNoteList v-else :notes="displayNotes" />
    </div>
  </div>
</template>

<style scoped>
.state-block {
  padding: 3rem 1rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 12px;
  color: var(--ink-soft);
  font-size: 0.875rem;
}
.state-title { font-size: 1.125rem; font-weight: 600; color: var(--ink); }
.state-sub { margin-top: 0.25rem; margin-bottom: 0; color: var(--ink-faint); }
.state-cta {
  display: inline-flex;
  margin-top: 1.25rem;
}
</style>
