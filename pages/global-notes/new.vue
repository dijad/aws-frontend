<script setup lang="ts">
import type { CitableNoteLite, UserLite } from '~/types/api';

definePageMeta({
  permissions: ['NOTE_CREATE'],
});

const { apiFetch } = useApi();

async function searchCitableNotes(query: string) {
  const q = query.trim();
  const path = q
    ? `/notes/search/citable?q=${encodeURIComponent(q)}`
    : '/notes/search/citable';
  return apiFetch<CitableNoteLite[]>(path);
}
const router = useRouter();
const auth = useAuthStore();
const { can } = usePermissions();

const skipsApproval = computed(
  () => auth.user?.roleCode === 'ADMIN' || can('NOTE_SKIP_APPROVAL'),
);

const users = ref<UserLite[]>([]);
const candidates = computed(() => users.value.filter((u) => u.id !== auth.user?.id));

const title = ref('');
const editor = ref<{
  json: Record<string, unknown> | null;
  text: string;
  mentionedUserIds: string[];
}>({ json: null, text: '', mentionedUserIds: [] });
const recipientIds = ref<string[]>([]);
const error = ref<string | null>(null);
const saving = ref(false);
const loadingUsers = ref(true);

onMounted(async () => {
  loadingUsers.value = true;
  try {
    users.value = await apiFetch<UserLite[]>('/users/search/lite');
  } finally {
    loadingUsers.value = false;
  }
});

async function submit() {
  if (!editor.value.text.trim()) {
    error.value = 'Content cannot be empty';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await apiFetch('/notes', {
      method: 'POST',
      body: {
        title: title.value,
        contentJson: editor.value.json ?? { type: 'doc', content: [] },
        contentText: editor.value.text,
        mentionUserIds: editor.value.mentionedUserIds,
        recipientUserIds: recipientIds.value,
      },
    });
    await router.push('/global-notes');
  } catch (e: unknown) {
    error.value = (e as Error).message ?? 'Error';
  } finally {
    saving.value = false;
  }
}

</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <NuxtLink to="/global-notes" class="back-link">
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><polyline points="15 18 9 12 15 6" /></svg>
      Back
    </NuxtLink>
    <UiAppPageHeader>
      <h1 class="page-title">New note</h1>
      <p class="page-subtitle">
        Tag users with <span class="kbd">@</span>, cite notes with <span class="kbd">#</span>, and select recipients.
        <template v-if="skipsApproval">Your note will be published immediately.</template>
        <template v-else>The note stays pending until approved.</template>
      </p>
    </UiAppPageHeader>

    <form class="animate-reveal card-elevated form-card" data-delay="2" @submit.prevent="submit">
      <div>
        <label class="label">Title</label>
        <input v-model="title" required maxlength="160" class="input" placeholder="What is this note about?" />
      </div>

      <div>
        <label class="label">Content</label>
        <NotesNoteEditor
          v-model="editor"
          :users="candidates"
          :search-citable-notes="searchCitableNotes"
          :placeholder="$t('notes.writeNote')"
        />
      </div>

      <div>
        <label class="label">{{ $t('notes.recipients') }}</label>
        <p v-if="loadingUsers" class="text-sm text-slate-500">Loading users…</p>
        <UiUserMultiSelect
          v-else
          v-model="recipientIds"
          :users="candidates"
          :placeholder="$t('notes.recipientsPlaceholder')"
        />
      </div>

      <div v-if="error" class="form-error">{{ error }}</div>

      <div class="form-actions">
        <NuxtLink to="/global-notes" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Submitting…' : skipsApproval ? 'Publish note' : 'Submit for approval' }}
        </button>
      </div>
    </form>
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
.kbd {
  display: inline-block;
  padding: 1px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  background: var(--surface-card);
  color: var(--accent);
  border-radius: 4px;
}
.form-card {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.form-error {
  padding: 0.625rem 0.75rem;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8125rem;
  border-radius: 8px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--rule-soft);
}
</style>
