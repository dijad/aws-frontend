<script setup lang="ts">
import type { SystemUpdateDto } from '~/types/api';

const { apiFetch } = useApi();
const { can } = usePermissions();
const route = useRoute();
const id = route.params.id as string;

const item = ref<SystemUpdateDto | null>(null);
const loading = ref(false);
const acting = ref(false);
const showRejectDialog = ref(false);
const rejectAs = ref<'dev' | 'admin'>('admin');
const reason = ref('');
const newComment = ref('');

async function load() {
  loading.value = true;
  try {
    item.value = await apiFetch<SystemUpdateDto>(`/system-updates/${id}`);
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const canDevReview = computed(
  () =>
    item.value?.status === 'PENDING' &&
    can('SYSTEM_UPDATE_REVIEW_AS_DEV') &&
    !can('SYSTEM_UPDATE_REVIEW_AS_ADMIN'),
);
const canAdminReview = computed(
  () =>
    item.value &&
    ['PENDING', 'DEV_APPROVED'].includes(item.value.status) &&
    can('SYSTEM_UPDATE_REVIEW_AS_ADMIN'),
);
const canComplete = computed(
  () =>
    item.value?.status === 'ADMIN_APPROVED' &&
    can('SYSTEM_UPDATE_REVIEW_AS_DEV'),
);

async function devApprove() {
  if (!item.value) return;
  acting.value = true;
  try {
    await apiFetch(`/system-updates/${item.value.id}/dev-review`, {
      method: 'POST',
      body: { approve: true },
    });
    await load();
  } finally {
    acting.value = false;
  }
}

async function adminApprove() {
  if (!item.value) return;
  acting.value = true;
  try {
    await apiFetch(`/system-updates/${item.value.id}/admin-review`, {
      method: 'POST',
      body: { approve: true },
    });
    await load();
  } finally {
    acting.value = false;
  }
}

function startReject(as: 'dev' | 'admin') {
  rejectAs.value = as;
  reason.value = '';
  showRejectDialog.value = true;
}

async function confirmReject() {
  if (!item.value || !reason.value.trim()) return;
  acting.value = true;
  try {
    const path =
      rejectAs.value === 'dev' ? 'dev-review' : 'admin-review';
    await apiFetch(`/system-updates/${item.value.id}/${path}`, {
      method: 'POST',
      body: { approve: false, reason: reason.value },
    });
    showRejectDialog.value = false;
    await load();
  } finally {
    acting.value = false;
  }
}

async function complete() {
  if (!item.value) return;
  acting.value = true;
  try {
    await apiFetch(`/system-updates/${item.value.id}/complete`, {
      method: 'POST',
    });
    await load();
  } finally {
    acting.value = false;
  }
}

async function addComment() {
  if (!item.value || !newComment.value.trim()) return;
  await apiFetch(`/system-updates/${item.value.id}/comments`, {
    method: 'POST',
    body: { content: newComment.value },
  });
  newComment.value = '';
  await load();
}
</script>

<template>
  <div class="max-w-3xl space-y-4">
    <NuxtLink to="/global-notes/system-updates" class="text-sm text-brand-700 hover:underline">
      ← {{ $t('nav.systemUpdates') }}
    </NuxtLink>

    <div v-if="loading" class="card p-6 text-center text-slate-500">
      {{ $t('app.loading') }}
    </div>
    <template v-else-if="item">
      <div class="card p-6">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 class="text-2xl font-semibold">{{ item.title }}</h1>
            <p class="mt-1 text-xs text-slate-500">
              {{ item.requester.name }} · Module: {{ item.module.name }} ·
              {{ new Date(item.createdAt).toLocaleString() }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              class="badge"
              :class="
                item.type === 'BUG_FIX'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-sky-50 text-sky-700'
              "
            >
              {{ item.type === 'BUG_FIX' ? $t('systemUpdates.bugFix') : $t('systemUpdates.enhancement') }}
            </span>
            <SystemUpdatesPriorityBadge :priority="item.priority" />
            <SystemUpdatesStatusBadge :status="item.status" />
          </div>
        </div>

        <p class="mt-4 whitespace-pre-line text-sm text-slate-700">
          {{ item.description }}
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            v-if="canDevReview"
            class="btn-secondary"
            :disabled="acting"
            @click="startReject('dev')"
          >
            Reject
          </button>
          <button
            v-if="canDevReview"
            class="btn-primary"
            :disabled="acting"
            @click="devApprove"
          >
            Approve
          </button>

          <button
            v-if="canAdminReview"
            class="btn-secondary"
            :disabled="acting"
            @click="startReject('admin')"
          >
            Reject
          </button>
          <button
            v-if="canAdminReview"
            class="btn-primary"
            :disabled="acting"
            @click="adminApprove"
          >
            Approve
          </button>

          <button
            v-if="canComplete"
            class="btn-primary"
            :disabled="acting"
            @click="complete"
          >
            {{ $t('systemUpdates.complete') }}
          </button>
        </div>
      </div>

      <div v-if="item.comments.length" class="card p-6">
        <h2 class="text-sm font-semibold text-slate-700">Comments & reviews</h2>
        <ul class="mt-3 space-y-3">
          <li
            v-for="c in item.comments"
            :key="c.id"
            class="rounded-lg border border-slate-100 bg-slate-50 p-3"
            :class="c.type === 'REJECTION_REASON' && 'border-red-200 bg-red-50'"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">{{ c.author.name }}</p>
              <span class="text-xs text-slate-500">{{ new Date(c.createdAt).toLocaleString() }}</span>
            </div>
            <p
              v-if="c.type === 'REJECTION_REASON'"
              class="mt-1 text-xs font-medium uppercase text-red-600"
            >
              Rejection reason
            </p>
            <p class="mt-1 whitespace-pre-line text-sm">{{ c.content }}</p>
          </li>
        </ul>
      </div>

      <form class="card space-y-2 p-4" @submit.prevent="addComment">
        <textarea
          v-model="newComment"
          rows="2"
          class="input"
          placeholder="Add a comment..."
        />
        <div class="flex justify-end">
          <button type="submit" class="btn-secondary text-xs">Comment</button>
        </div>
      </form>

      <Teleport to="body">
        <div
          v-if="showRejectDialog"
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
        >
          <div class="card w-full max-w-md p-6">
            <h3 class="text-lg font-semibold">Reject request</h3>
            <textarea v-model="reason" rows="4" class="input mt-3" />
            <div class="mt-4 flex justify-end gap-2">
              <button class="btn-secondary" @click="showRejectDialog = false">
                {{ $t('common.cancel') }}
              </button>
              <button
                class="btn-danger"
                :disabled="acting || !reason.trim()"
                @click="confirmReject"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>
