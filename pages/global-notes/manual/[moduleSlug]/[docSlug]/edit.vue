<script setup lang="ts">
import type { FeatureDocumentDto } from '~/types/api';

definePageMeta({
  permissions: ['MANUAL_EDIT'],
});

const route = useRoute();
const router = useRouter();
const { apiFetch } = useApi();
const { can } = usePermissions();
const moduleSlug = route.params.moduleSlug as string;
const docSlug = route.params.docSlug as string;

const doc = ref<FeatureDocumentDto | null>(null);
const loading = ref(false);
const title = ref('');
const editor = ref<{ json: Record<string, unknown> | null; text: string }>({
  json: null,
  text: '',
});
const saving = ref(false);

async function load() {
  loading.value = true;
  try {
    const d = await apiFetch<FeatureDocumentDto>(
      `/modules/${moduleSlug}/docs/${docSlug}`,
    );
    doc.value = d;
    title.value = d.title;
    editor.value = { json: d.contentJson, text: d.contentText };
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function save() {
  if (!doc.value) return;
  saving.value = true;
  try {
    await apiFetch(`/docs/${doc.value.id}`, {
      method: 'PATCH',
      body: {
        title: title.value,
        contentJson: editor.value.json ?? { type: 'doc', content: [] },
        contentText: editor.value.text,
      },
    });
    await router.push(`/global-notes/manual/${moduleSlug}/${docSlug}`);
  } finally {
    saving.value = false;
  }
}

async function publish() {
  if (!doc.value) return;
  await save();
  if (can('MANUAL_PUBLISH')) {
    await apiFetch(`/docs/${doc.value.id}/publish`, { method: 'POST' });
    await router.push(`/global-notes/manual/${moduleSlug}/${docSlug}`);
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-4">
    <NuxtLink
      :to="`/global-notes/manual/${moduleSlug}/${docSlug}`"
      class="text-sm text-brand-700 hover:underline"
    >
      ← Back
    </NuxtLink>

    <div v-if="loading" class="card p-6 text-center text-slate-500">
      {{ $t('app.loading') }}
    </div>
    <template v-else-if="doc">
      <div class="card space-y-4 p-6">
        <input
          v-model="title"
          class="w-full border-0 text-2xl font-semibold focus:outline-none focus:ring-0"
        />
        <ManualRichEditor v-model="editor" placeholder="Write the document..." />
        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button class="btn-secondary" :disabled="saving" @click="save">
            {{ $t('common.save') }} (draft)
          </button>
          <button
            v-if="can('MANUAL_PUBLISH')"
            class="btn-primary"
            :disabled="saving"
            @click="publish"
          >
            {{ $t('manual.publish') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
