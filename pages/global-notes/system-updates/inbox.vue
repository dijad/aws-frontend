<script setup lang="ts">
import type { SystemUpdateDto } from '~/types/api';

definePageMeta({
  permissions: ['SYSTEM_UPDATE_REVIEW_AS_DEV', 'SYSTEM_UPDATE_REVIEW_AS_ADMIN'],
});

const { apiFetch } = useApi();
const { can } = usePermissions();

const tab = ref<'inbox' | 'approved' | 'completed' | 'rejected' | 'all'>('inbox');
const items = ref<SystemUpdateDto[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    items.value = await apiFetch<SystemUpdateDto[]>(
      `/system-updates?scope=${tab.value}`,
    );
  } finally {
    loading.value = false;
  }
}
watch(tab, load, { immediate: true });
</script>

<template>
  <div class="space-y-4">
    <UiAppPageHeader>
      <h1 class="page-title">{{ $t('nav.inbox') }}</h1>
      <p class="page-subtitle">
        Review inbox for Developers and Admins. Approved, completed, and
        rejected items in one place.
      </p>
    </UiAppPageHeader>

    <div class="card flex flex-wrap gap-2 p-3">
      <button
        v-for="opt in (['inbox', 'approved', 'completed', 'rejected', 'all'] as const)"
        :key="opt"
        class="rounded-md px-3 py-1.5 text-sm font-medium"
        :class="
          tab === opt
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-600 hover:bg-slate-100'
        "
        @click="tab = opt"
      >
        <template v-if="opt === 'inbox'">
          {{ $t('systemUpdates.inboxTabs.toReview') }}
        </template>
        <template v-else-if="opt === 'approved'">
          {{ $t('systemUpdates.inboxTabs.readyToImplement') }}
        </template>
        <template v-else-if="opt === 'completed'">
          {{ $t('systemUpdates.inboxTabs.completed') }}
        </template>
        <template v-else-if="opt === 'rejected'">
          {{ $t('systemUpdates.inboxTabs.rejected') }}
        </template>
        <template v-else>
          {{ $t('systemUpdates.inboxTabs.all') }}
        </template>
      </button>
    </div>

    <div v-if="loading" class="card p-6 text-center text-slate-500">
      {{ $t('app.loading') }}
    </div>
    <div v-else-if="items.length === 0" class="card p-10 text-center text-slate-500">
      Nothing here yet.
    </div>
    <div v-else class="space-y-3">
      <SystemUpdatesRequestCard v-for="i in items" :key="i.id" :item="i" />
    </div>
  </div>
</template>
