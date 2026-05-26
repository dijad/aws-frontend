<script setup lang="ts">
import type { UserSummary } from '~/types/api';

definePageMeta({
  permissions: ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE'],
});

const { apiFetch } = useApi();
const { can } = usePermissions();

const { t } = useI18n();

const users = ref<UserSummary[]>([]);
const loading = ref(false);
const showDeleteDialog = ref(false);
const userToDelete = ref<UserSummary | null>(null);
const deleting = ref(false);

async function load() {
  loading.value = true;
  try {
    users.value = await apiFetch<UserSummary[]>('/users?includeDeleted=true');
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function askDelete(u: UserSummary) {
  userToDelete.value = u;
  showDeleteDialog.value = true;
}

async function confirmDeleteUser() {
  if (!userToDelete.value) return;
  deleting.value = true;
  try {
    await apiFetch(`/users/${userToDelete.value.id}`, { method: 'DELETE' });
    showDeleteDialog.value = false;
    userToDelete.value = null;
    await load();
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <UiAppPageHeader>
      <h1 class="page-title">Users</h1>
      <p class="page-subtitle">Manage users and their roles. Deletion is soft (logical).</p>
    </UiAppPageHeader>

    <div v-if="loading" class="state-block card">Loading…</div>

    <div v-else-if="users.length === 0" class="state-block card">
      <p class="state-title">No users yet.</p>
      <p class="state-sub">Add someone to the workspace to get started.</p>
      <NuxtLink v-if="can('USER_CREATE')" to="/admin/users/new" class="btn-primary state-cta">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        New user
      </NuxtLink>
    </div>

    <template v-else>
      <div class="card overflow-hidden">
      <table class="data-table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>
              <div class="user-cell">
                <div class="user-avatar-small">{{ u.name.charAt(0) }}</div>
                <span class="font-medium">{{ u.name }}</span>
              </div>
            </td>
            <td><span class="email-mono">{{ u.email }}</span></td>
            <td><span class="badge">{{ u.role.name }}</span></td>
            <td>
              <span v-if="u.deletedAt" class="badge badge--danger">Deleted</span>
              <span v-else-if="u.isActive" class="badge badge--positive"><span class="badge-dot" /> Active</span>
              <span v-else class="badge">Inactive</span>
            </td>
            <td class="text-right">
              <div class="row-actions">
                <NuxtLink
                  v-if="!u.deletedAt && can('USER_UPDATE')"
                  :to="`/admin/users/${u.id}`"
                  class="btn-icon"
                  title="Edit"
                  :aria-label="`Edit ${u.name}`"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </NuxtLink>
                <button
                  v-if="!u.deletedAt && can('USER_DELETE')"
                  type="button"
                  class="btn-icon btn-icon--danger"
                  title="Delete"
                  :aria-label="`Delete ${u.name}`"
                  @click="askDelete(u)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="can('USER_CREATE')" class="users-add-row">
            <td colspan="5">
              <NuxtLink to="/admin/users/new" class="users-add-link">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                New user
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </template>

    <UiConfirmDeleteDialog
      v-if="userToDelete"
      v-model:open="showDeleteDialog"
      :title="t('confirmDelete.titleUser')"
      :item-name="userToDelete.name"
      :loading="deleting"
      @confirm="confirmDeleteUser"
    />
  </div>
</template>

<style scoped>
.state-block {
  padding: 3rem 1rem;
  text-align: center;
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
.users-add-row:hover {
  background: transparent;
}
.users-add-row td {
  padding-top: 0.75rem;
  padding-bottom: 1rem;
  border-top: 1px solid var(--rule-soft);
}
.users-add-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent-text);
  text-decoration: none;
}
.users-add-link:hover {
  color: var(--accent);
}
.user-cell { display: flex; align-items: center; gap: 0.625rem; }
.user-avatar-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.email-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  color: var(--ink-soft);
}
.row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.125rem;
}
.row-actions :deep(.btn-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  color: var(--ink-soft);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.row-actions :deep(.btn-icon svg) {
  pointer-events: none;
}
.row-actions :deep(.btn-icon:not(.btn-icon--danger):hover) {
  background: var(--accent-soft);
  color: var(--accent-text);
}
.row-actions :deep(.btn-icon--danger) {
  color: var(--danger);
}
.row-actions :deep(.btn-icon--danger:hover) {
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 14%, transparent);
}
</style>
