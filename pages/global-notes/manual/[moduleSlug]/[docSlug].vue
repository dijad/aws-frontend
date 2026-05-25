<script setup lang="ts">
import type { FeatureDocumentDto } from '~/types/api';

const route = useRoute();
const { apiFetch } = useApi();
const { can } = usePermissions();
const moduleSlug = route.params.moduleSlug as string;
const docSlug = route.params.docSlug as string;

const doc = ref<FeatureDocumentDto | null>(null);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    doc.value = await apiFetch<FeatureDocumentDto>(
      `/modules/${moduleSlug}/docs/${docSlug}`,
    );
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function publish() {
  if (!doc.value) return;
  doc.value = await apiFetch<FeatureDocumentDto>(
    `/docs/${doc.value.id}/publish`,
    { method: 'POST' },
  );
}
async function unpublish() {
  if (!doc.value) return;
  doc.value = await apiFetch<FeatureDocumentDto>(
    `/docs/${doc.value.id}/unpublish`,
    { method: 'POST' },
  );
}
</script>

<template>
  <div class="max-w-3xl space-y-4">
    <NuxtLink
      :to="`/global-notes/manual/${moduleSlug}`"
      class="text-sm text-brand-700 hover:underline"
    >
      ← {{ doc?.module.name ?? '...' }}
    </NuxtLink>

    <div v-if="loading" class="card p-6 text-center text-slate-500">
      {{ $t('app.loading') }}
    </div>
    <template v-else-if="doc">
      <div class="card p-6">
        <div class="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 class="text-2xl font-semibold">{{ doc.title }}</h1>
            <p class="text-xs text-slate-500">
              {{ doc.author.name }} ·
              {{
                doc.publishedAt
                  ? new Date(doc.publishedAt).toLocaleDateString()
                  : new Date(doc.updatedAt).toLocaleDateString()
              }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              class="badge"
              :class="
                doc.status === 'PUBLISHED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-800'
              "
            >{{ doc.status === 'PUBLISHED' ? $t('manual.published') : $t('manual.draft') }}</span>
            <NuxtLink
              v-if="can('MANUAL_EDIT')"
              :to="`/global-notes/manual/${moduleSlug}/${docSlug}/edit`"
              class="btn-secondary text-xs"
            >
              {{ $t('common.edit') }}
            </NuxtLink>
            <button
              v-if="can('MANUAL_PUBLISH') && doc.status === 'DRAFT'"
              class="btn-primary text-xs"
              @click="publish"
            >
              {{ $t('manual.publish') }}
            </button>
            <button
              v-if="can('MANUAL_PUBLISH') && doc.status === 'PUBLISHED'"
              class="btn-secondary text-xs"
              @click="unpublish"
            >
              Despublicar
            </button>
          </div>
        </div>

        <NotesNoteContentViewer :content="doc.contentJson" />
      </div>
    </template>
  </div>
</template>
