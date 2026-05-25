<script setup lang="ts">
import type {
  SystemUpdateDto,
  SystemUpdatePriority,
  SystemUpdateType,
} from '~/types/api';

const { apiFetch } = useApi();
const { can } = usePermissions();
const auth = useAuthStore();
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

const form = reactive({
  title: '',
  type: 'BUG_FIX' as SystemUpdateType,
  moduleId: '',
  priority: 'MEDIUM' as SystemUpdatePriority,
  description: '',
});
const error = ref<string | null>(null);
const saving = ref(false);

async function submitForm() {
  if (!form.moduleId) { error.value = 'Select a module'; return; }
  saving.value = true;
  error.value = null;
  try {
    await apiFetch('/system-updates', { method: 'POST', body: form });
    form.title = '';
    form.description = '';
    form.priority = 'MEDIUM';
    form.type = 'BUG_FIX';
    form.moduleId = '';
    showForm.value = false;
    await load();
  } catch (e: unknown) {
    error.value = ((e as { data?: { message?: string } }).data?.message) ?? (e as Error).message ?? 'Error';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <UiAppPageHeader>
      <h1 class="page-title">System updates</h1>
      <p class="page-subtitle">Bug fixes and enhancements. Each ticket goes through Dev and Admin review.</p>
      <template v-if="can('SYSTEM_UPDATE_CREATE') && !loading && list.length > 0" #actions>
        <button class="btn-primary" @click="showForm = !showForm">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New request
        </button>
      </template>
    </UiAppPageHeader>

    <div class="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div class="space-y-4 animate-reveal" data-delay="2">
        <div class="flex flex-wrap items-center gap-3">
          <div class="search-box">
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input v-model="search" placeholder="Search..." class="search-input" />
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

        <div v-if="loading" class="state-block">Loading…</div>
        <div v-else-if="list.length === 0" class="state-block">
          <p class="state-title">No requests yet.</p>
          <p class="state-sub">Get started by creating your first request.</p>
          <button
            v-if="can('SYSTEM_UPDATE_CREATE')"
            type="button"
            class="btn-primary state-cta"
            @click="showForm = true"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New request
          </button>
        </div>
        <div v-else-if="filtered.length === 0" class="state-block">
          <p class="state-title">No matches.</p>
          <p class="state-sub">Try a different search or filter.</p>
        </div>
        <div v-else class="grid gap-4 md:grid-cols-2">
          <SystemUpdatesRequestCard v-for="i in filtered" :key="i.id" :item="i" />
        </div>
      </div>

      <aside v-if="showForm && can('SYSTEM_UPDATE_CREATE')" class="animate-reveal card-elevated form-panel" data-delay="2">
        <div class="flex items-center justify-between">
          <h2 class="form-title">New request</h2>
          <button class="btn-icon" @click="showForm = false" title="Close">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form class="form-body" @submit.prevent="submitForm">
          <div>
            <label class="label">Requester</label>
            <input :value="auth.user?.name" disabled class="input opacity-60" />
          </div>

          <div>
            <label class="label">Type</label>
            <div class="type-toggle">
              <button type="button" class="type-toggle-btn" :class="form.type === 'BUG_FIX' && 'type-toggle-btn--active'" @click="form.type = 'BUG_FIX'">Bug fix</button>
              <button type="button" class="type-toggle-btn" :class="form.type === 'ENHANCEMENT' && 'type-toggle-btn--active'" @click="form.type = 'ENHANCEMENT'">Enhancement</button>
            </div>
          </div>

          <div>
            <label class="label">Module</label>
            <select v-model="form.moduleId" required class="input">
              <option value="" disabled>Select…</option>
              <option v-for="m in modules.active" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>

          <div>
            <label class="label">Title</label>
            <input v-model="form.title" required maxlength="160" class="input" />
          </div>

          <div>
            <label class="label">Priority</label>
            <select v-model="form.priority" class="input">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label class="label">Description</label>
            <textarea v-model="form.description" required rows="4" class="input" placeholder="Details..." />
          </div>

          <div v-if="error" class="form-error">{{ error }}</div>

          <button class="btn-primary w-full justify-center" :disabled="saving" style="padding: 0.625rem 1rem; font-weight: 600">
            {{ saving ? 'Creating…' : 'Create request' }}
          </button>
        </form>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.search-box {
  flex: 1;
  min-width: 200px;
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
.search-input::placeholder { color: var(--ink-faint); }
.search-input:focus { outline: none; }

.state-block {
  padding: 4rem 1rem;
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

.form-panel { padding: 1.5rem; }
.form-title {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink-strong);
}
.form-body {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--input-bg);
  padding: 0.25rem;
  border-radius: 10px;
  gap: 0.25rem;
  border: 1px solid var(--rule-soft);
}
.type-toggle-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink-soft);
  transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.type-toggle-btn:hover:not(.type-toggle-btn--active) {
  color: var(--ink);
  background: var(--surface-hover);
}
.type-toggle-btn--active {
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 600;
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  box-shadow: var(--shadow-xs);
}
.form-error {
  padding: 0.625rem 0.75rem;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8125rem;
  border-radius: 8px;
}
</style>
