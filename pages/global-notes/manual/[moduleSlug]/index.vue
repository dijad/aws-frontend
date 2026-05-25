<script setup lang="ts">
import type {
  ChangelogEntryDto,
  FeatureDocumentDto,
  ModuleDto,
} from '~/types/api';

const route = useRoute();
const { apiFetch } = useApi();
const { can } = usePermissions();
const moduleSlug = route.params.moduleSlug as string;

const mod = ref<ModuleDto | null>(null);
const docs = ref<FeatureDocumentDto[]>([]);
const changelog = ref<ChangelogEntryDto[]>([]);
const loading = ref(false);

const includeDrafts = computed(() => can('MANUAL_EDIT'));

async function load() {
  loading.value = true;
  try {
    const [m, ds, cl] = await Promise.all([
      apiFetch<ModuleDto>(`/modules/${moduleSlug}`),
      apiFetch<FeatureDocumentDto[]>(
        `/modules/${moduleSlug}/docs${includeDrafts.value ? '?includeDrafts=true' : ''}`,
      ),
      apiFetch<ChangelogEntryDto[]>(`/modules/${moduleSlug}/changelog`),
    ]);
    mod.value = m;
    docs.value = ds;
    changelog.value = cl;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const newDoc = reactive({ title: '' });
const creating = ref(false);
const showCreate = ref(false);
const error = ref<string | null>(null);

async function createDoc() {
  if (!newDoc.title.trim()) return;
  creating.value = true;
  error.value = null;
  try {
    const created = await apiFetch<FeatureDocumentDto>(
      `/modules/${moduleSlug}/docs`,
      {
        method: 'POST',
        body: {
          title: newDoc.title,
          contentJson: { type: 'doc', content: [] },
          contentText: '',
        },
      },
    );
    newDoc.title = '';
    showCreate.value = false;
    await navigateTo(
      `/global-notes/manual/${moduleSlug}/${created.slug}/edit`,
    );
  } catch (e: unknown) {
    error.value = ((e as { data?: { message?: string } }).data?.message)
      ?? (e as Error).message
      ?? 'Error';
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <NuxtLink
      to="/global-notes/manual"
      class="text-sm text-brand-700 hover:underline"
    >
      ← {{ $t('manual.title') }}
    </NuxtLink>

    <div v-if="loading" class="card p-6 text-center text-slate-500">
      {{ $t('app.loading') }}
    </div>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">{{ mod?.name }}</h1>
          <p class="text-sm text-slate-500">{{ mod?.description }}</p>
        </div>
        <button
          v-if="can('MANUAL_EDIT')"
          class="btn-primary"
          @click="showCreate = !showCreate"
        >
          + {{ $t('manual.newDocument') }}
        </button>
      </div>

      <form
        v-if="showCreate"
        class="card flex gap-2 p-4"
        @submit.prevent="createDoc"
      >
        <input
          v-model="newDoc.title"
          required
          placeholder="Document title"
          class="input"
        />
        <button class="btn-primary" :disabled="creating">{{ $t('common.create') }}</button>
        <p v-if="error" class="self-center text-sm text-red-600">{{ error }}</p>
      </form>

      <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div class="space-y-3">
          <div
            v-if="docs.length === 0"
            class="card p-10 text-center text-slate-500"
          >
            No documents yet.
          </div>
          <NuxtLink
            v-for="d in docs"
            :key="d.id"
            :to="`/global-notes/manual/${moduleSlug}/${d.slug}`"
            class="card flex items-start justify-between p-5 transition hover:shadow-md"
          >
            <div>
              <h3 class="text-base font-semibold">{{ d.title }}</h3>
              <p class="mt-1 line-clamp-2 text-sm text-slate-500">{{ d.contentText }}</p>
              <p class="mt-2 text-xs text-slate-400">
                {{ d.author.name }} ·
                {{
                  d.publishedAt
                    ? new Date(d.publishedAt).toLocaleDateString()
                    : new Date(d.updatedAt).toLocaleDateString()
                }}
              </p>
            </div>
            <span
              class="badge"
              :class="
                d.status === 'PUBLISHED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-800'
              "
            >
              {{
                d.status === 'PUBLISHED' ? $t('manual.published') : $t('manual.draft')
              }}
            </span>
          </NuxtLink>
        </div>

        <aside class="card p-5">
          <h2 class="text-lg font-semibold">{{ $t('manual.changelog') }}</h2>
          <p class="mb-3 text-xs text-slate-500">
            Auto-generated when System Updates are completed.
          </p>
          <ul v-if="changelog.length" class="space-y-3">
            <li
              v-for="c in changelog"
              :key="c.id"
              class="border-l-2 border-brand-300 pl-3"
            >
              <p class="text-sm font-medium">{{ c.title }}</p>
              <p class="text-xs text-slate-500">{{ c.summary }}</p>
              <p class="text-xs text-slate-400">
                {{ new Date(c.releasedAt).toLocaleDateString() }}
              </p>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-500">No entries yet.</p>
        </aside>
      </div>
    </template>
  </div>
</template>
