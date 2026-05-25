<script setup lang="ts">
import type { ModuleDto } from '~/types/api';

const modules = useModulesStore();
const search = ref('');
const { apiFetch } = useApi();
const searchResults = ref<{ id: string; title: string; slug?: string; module: ModuleDto }[]>([]);
const searching = ref(false);

onMounted(() => modules.ensureLoaded());

watchDebounced(
  search,
  async (q) => {
    if (!q || q.length < 2) {
      searchResults.value = [];
      return;
    }
    searching.value = true;
    try {
      searchResults.value = await apiFetch(`/manual/search?q=${encodeURIComponent(q)}`);
    } finally {
      searching.value = false;
    }
  },
  { debounce: 300 },
);
</script>

<template>
  <div class="space-y-6">
    <UiAppPageHeader>
      <h1 class="page-title">User manual</h1>
      <p class="page-subtitle">
        Complete guide to Global Notes — notes, approvals, requests, reviews, and roles.
      </p>
    </UiAppPageHeader>

    <div class="search-box animate-reveal" data-delay="2">
      <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
      <input v-model="search" placeholder="Search the manual..." class="search-input" />
    </div>

    <div v-if="searchResults.length" class="animate-reveal" data-delay="2">
      <ul class="results">
        <li v-for="r in searchResults" :key="r.id">
          <NuxtLink :to="`/global-notes/manual/${r.module.slug}/${r.slug}`" class="result-row">
            <div>
              <p class="result-title">{{ r.title }}</p>
              <p class="result-module">{{ r.module.name }}</p>
            </div>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ink-faint)"><polyline points="9 18 15 12 9 6" /></svg>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="modules-grid animate-reveal" data-delay="3">
      <NuxtLink v-for="m in modules.active" :key="m.id" :to="`/global-notes/manual/${m.slug}`" class="card card-interactive module-card">
        <div class="module-icon">{{ m.name.charAt(0) }}</div>
        <h3 class="module-title">{{ m.name }}</h3>
        <p class="module-desc">{{ m.description ?? 'Module documentation' }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--surface-card);
  color: var(--ink-faint);
  border-radius: 10px;
}
.search-input {
  width: 100%;
  background: transparent;
  border: 0;
  font-size: 0.9375rem;
  color: var(--ink);
}
.search-input::placeholder { color: var(--ink-faint); }
.search-input:focus { outline: none; }

.results {
  list-style: none;
  padding: 0.5rem;
  margin: 0;
  background: var(--surface-card);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background 0.12s;
}
.result-row:hover { background: var(--surface); }
.result-title { font-size: 0.875rem; font-weight: 500; color: var(--ink); }
.result-module { margin-top: 1px; font-size: 0.75rem; color: var(--ink-faint); }

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.module-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}
.module-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9px;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 700;
  text-transform: uppercase;
}
.module-title {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink-strong);
}
.module-card:hover .module-title { color: var(--accent); }
.module-desc {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
