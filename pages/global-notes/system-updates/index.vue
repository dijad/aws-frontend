<script setup lang="ts">
import type {
  SystemUpdateDto,
  SystemUpdatePriority,
  SystemUpdateType,
} from '~/types/api';

const { apiFetch } = useApi();
const { can } = usePermissions();
const modules = useModulesStore();

const list = ref<SystemUpdateDto[]>([]);
const loading = ref(false);
const search = ref('');
const scope = ref<'mine' | 'all'>('all');
const showForm = ref(false);

async function load() {
  loading.value = true;
  try {
    const path = scope.value === 'mine' ? '/system-updates?scope=mine' : '/system-updates';
    list.value = await apiFetch<SystemUpdateDto[]>(path);
  } finally {
    loading.value = false;
  }
}
watch(scope, load, { immediate: true });
onMounted(() => modules.ensureLoaded());

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return list.value;
  return list.value.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.module.name.toLowerCase().includes(q) ||
      i.requester.name.toLowerCase().includes(q),
  );
});

const newRequestFormRef = ref<{
  form: {
    title: string;
    type: SystemUpdateType;
    moduleId: string;
    priority: SystemUpdatePriority;
    description: string;
  };
  reset: () => void;
} | null>(null);

const error = ref<string | null>(null);
const saving = ref(false);

function openForm() {
  error.value = null;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  error.value = null;
  newRequestFormRef.value?.reset();
}

async function submitForm() {
  const form = newRequestFormRef.value?.form;
  if (!form) return;
  if (!form.moduleId) {
    error.value = 'Select a module';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await apiFetch('/system-updates', { method: 'POST', body: form });
    newRequestFormRef.value?.reset();
    closeForm();
    await load();
  } catch (e: unknown) {
    error.value =
      ((e as { data?: { message?: string } }).data?.message) ??
      (e as Error).message ??
      'Error';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <UiAppPageHeader>
      <template v-if="showForm">
        <h1 class="page-title">{{ $t('systemUpdates.newRequest') }}</h1>
        <p class="page-subtitle">
          Describe the bug fix or enhancement. Your request will go through Dev and Admin review.
        </p>
      </template>
      <template v-else>
        <h1 class="page-title">System updates</h1>
        <p class="page-subtitle">
          Bug fixes and enhancements. Each ticket goes through Dev and Admin review.
        </p>
      </template>
      <template v-if="can('SYSTEM_UPDATE_CREATE')" #actions>
        <button
          v-if="showForm"
          type="button"
          class="btn-secondary"
          @click="closeForm"
        >
          Cancel
        </button>
        <button
          v-else-if="!loading"
          type="button"
          class="btn-primary"
          @click="openForm"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {{ $t('systemUpdates.newRequest') }}
        </button>
      </template>
    </UiAppPageHeader>

    <SystemUpdatesNewRequestForm
      v-if="showForm && can('SYSTEM_UPDATE_CREATE')"
      ref="newRequestFormRef"
      :saving="saving"
      :error="error"
      @submit="submitForm"
      @cancel="closeForm"
    />

    <template v-else>
      <div class="toolbar animate-reveal" data-delay="1">
        <div class="search-box">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input v-model="search" :placeholder="$t('systemUpdates.search')" class="search-input" />
        </div>
        <div class="filter-tabs">
          <button
            v-for="opt in (['all', 'mine'] as const)"
            :key="opt"
            type="button"
            class="filter-tab"
            :class="scope === opt && 'filter-tab--active'"
            @click="scope = opt"
          >
            {{ opt === 'all' ? 'All' : 'Mine' }}
          </button>
        </div>
      </div>

      <div class="animate-reveal" data-delay="2">
        <div v-if="loading" class="state-block">Loading…</div>
        <div v-else-if="list.length === 0" class="state-block">
          <p class="state-title">No requests yet.</p>
          <p class="state-sub">Get started by creating your first request.</p>
          <button
            v-if="can('SYSTEM_UPDATE_CREATE')"
            type="button"
            class="btn-primary state-cta"
            @click="openForm"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {{ $t('systemUpdates.newRequest') }}
          </button>
        </div>
        <div v-else-if="filtered.length === 0" class="state-block">
          <p class="state-title">No matches.</p>
          <p class="state-sub">Try a different search or filter.</p>
        </div>
        <div v-else class="request-grid">
          <SystemUpdatesRequestCard v-for="i in filtered" :key="i.id" :item="i" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.search-box {
  flex: 1;
  min-width: min(100%, 280px);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-card);
  color: var(--ink-faint);
  border-radius: 8px;
}
.search-input {
  width: 100%;
  background: transparent;
  border: 0;
  font-size: 0.875rem;
  color: var(--ink);
}
.search-input::placeholder {
  color: var(--ink-faint);
}
.search-input:focus {
  outline: none;
}

.state-block {
  padding: 3rem 1rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 12px;
  color: var(--ink-soft);
  font-size: 0.875rem;
}
.state-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ink);
}
.state-sub {
  margin-top: 0.25rem;
  margin-bottom: 0;
  color: var(--ink-faint);
}
.state-cta {
  display: inline-flex;
  margin-top: 1.25rem;
}

.request-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
}

</style>
