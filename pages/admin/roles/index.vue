<script setup lang="ts">
import type { PermissionDto, RoleDto } from '~/types/api';
import { groupPermissions } from '~/utils/permission-groups';

definePageMeta({
  permissions: ['ROLE_MANAGE'],
});

const { apiFetch } = useApi();
const { t } = useI18n();

const roles = ref<RoleDto[]>([]);
const permissions = ref<PermissionDto[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const roleSearch = ref('');
const permSearch = ref('');
const selectedRoleId = ref<string | null>(null);
const collapsedGroups = ref<Set<string>>(new Set());
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteDialog = ref(false);
const creating = ref(false);
const updating = ref(false);
const deleting = ref(false);
const newRole = reactive({
  name: '',
  description: '',
});
const editRoleForm = reactive({
  name: '',
  description: '',
});

/** Permisos editados del rol seleccionado (copia local hasta guardar). */
const draft = ref<Set<string>>(new Set());
const savedSnapshot = ref<Set<string>>(new Set());

const filteredRoles = computed(() => {
  const q = roleSearch.value.trim().toLowerCase();
  if (!q) return roles.value;
  return roles.value.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false),
  );
});

const selectedRole = computed(() =>
  roles.value.find((r) => r.id === selectedRoleId.value) ?? null,
);

const permissionGroups = computed(() => groupPermissions(permissions.value));

const filteredGroups = computed(() => {
  const q = permSearch.value.trim().toLowerCase();
  if (!q) return permissionGroups.value;
  return permissionGroups.value
    .map((g) => ({
      ...g,
      permissions: g.permissions.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.permissions.length > 0);
});

const dirty = computed(() => {
  if (draft.value.size !== savedSnapshot.value.size) return true;
  for (const code of draft.value) {
    if (!savedSnapshot.value.has(code)) return true;
  }
  return false;
});

const draftCount = computed(() => draft.value.size);
const totalCount = computed(() => permissions.value.length);

function openCreateModal() {
  if (dirty.value) {
    const ok = confirm(
      'This role has unsaved permission changes. Discard them and create a new role?',
    );
    if (!ok) return;
  }
  newRole.name = '';
  newRole.description = '';
  error.value = null;
  showCreateModal.value = true;
}

function closeCreateModal() {
  if (creating.value) return;
  showCreateModal.value = false;
}

async function createRole() {
  const name = newRole.name.trim();
  if (!name) {
    error.value = 'Name is required.';
    return;
  }
  creating.value = true;
  error.value = null;
  try {
    const created = await apiFetch<RoleDto>('/roles', {
      method: 'POST',
      body: {
        name,
        description: newRole.description.trim() || undefined,
      },
    });
    roles.value = [...roles.value, created].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    showCreateModal.value = false;
    selectRole(created);
    success.value = `Role “${created.name}” created. Assign permissions below.`;
  } catch (e: unknown) {
    error.value =
      ((e as { data?: { message?: string } }).data?.message) ??
      (e as Error).message ??
      'Failed to create role';
  } finally {
    creating.value = false;
  }
}

function selectRole(role: RoleDto) {
  if (dirty.value && selectedRoleId.value !== role.id) {
    const ok = confirm(
      'This role has unsaved changes. Discard them and switch roles?',
    );
    if (!ok) return;
  }
  selectedRoleId.value = role.id;
  draft.value = new Set(role.permissions);
  savedSnapshot.value = new Set(role.permissions);
  error.value = null;
  success.value = null;
}

function isChecked(code: string) {
  return draft.value.has(code);
}

function toggle(code: string) {
  const next = new Set(draft.value);
  if (next.has(code)) next.delete(code);
  else next.add(code);
  draft.value = next;
  success.value = null;
}

function setGroup(groupId: string, enabled: boolean) {
  const group = permissionGroups.value.find((g) => g.id === groupId);
  if (!group) return;
  const next = new Set(draft.value);
  for (const p of group.permissions) {
    if (enabled) next.add(p.code);
    else next.delete(p.code);
  }
  draft.value = next;
  success.value = null;
}

function groupCheckedCount(groupId: string) {
  const group = permissionGroups.value.find((g) => g.id === groupId);
  if (!group) return { on: 0, total: 0 };
  const on = group.permissions.filter((p) => draft.value.has(p.code)).length;
  return { on, total: group.permissions.length };
}

function setAll(enabled: boolean) {
  draft.value = enabled
    ? new Set(permissions.value.map((p) => p.code))
    : new Set();
  success.value = null;
}

function resetDraft() {
  draft.value = new Set(savedSnapshot.value);
  success.value = null;
  error.value = null;
}

function toggleGroupCollapse(groupId: string) {
  const next = new Set(collapsedGroups.value);
  if (next.has(groupId)) next.delete(groupId);
  else next.add(groupId);
  collapsedGroups.value = next;
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [rs, ps] = await Promise.all([
      apiFetch<RoleDto[]>('/roles'),
      apiFetch<PermissionDto[]>('/permissions'),
    ]);
    roles.value = rs;
    permissions.value = ps;

    if (!selectedRoleId.value && rs.length > 0) {
      selectRole(rs[0]);
    } else if (selectedRoleId.value) {
      const current = rs.find((r) => r.id === selectedRoleId.value);
      if (current) selectRole(current);
      else if (rs[0]) selectRole(rs[0]);
    }
  } catch (e: unknown) {
    error.value =
      ((e as { data?: { message?: string } }).data?.message) ??
      (e as Error).message ??
      'Could not load data';
  } finally {
    loading.value = false;
  }
}

function openEditModal() {
  const role = selectedRole.value;
  if (!role) return;
  if (dirty.value) {
    const ok = confirm(
      'This role has unsaved permission changes. Discard them and edit the role?',
    );
    if (!ok) return;
  }
  editRoleForm.name = role.name;
  editRoleForm.description = role.description ?? '';
  error.value = null;
  showEditModal.value = true;
}

function closeEditModal() {
  if (updating.value) return;
  showEditModal.value = false;
}

async function saveRoleDetails() {
  const role = selectedRole.value;
  if (!role) return;
  const name = editRoleForm.name.trim();
  if (!name) {
    error.value = 'Name is required.';
    return;
  }
  updating.value = true;
  error.value = null;
  try {
    const updated = await apiFetch<RoleDto>(`/roles/${role.id}`, {
      method: 'PATCH',
      body: {
        name,
        description: editRoleForm.description.trim() || null,
      },
    });
    const idx = roles.value.findIndex((r) => r.id === role.id);
    if (idx !== -1) roles.value[idx] = updated;
    roles.value = [...roles.value].sort((a, b) => a.name.localeCompare(b.name));
    showEditModal.value = false;
    success.value = `Role “${updated.name}” updated.`;
  } catch (e: unknown) {
    error.value =
      ((e as { data?: { message?: string } }).data?.message) ??
      (e as Error).message ??
      'Failed to update role';
  } finally {
    updating.value = false;
  }
}

function askDeleteRole() {
  const role = selectedRole.value;
  if (!role || role.isSystem) return;
  if (dirty.value) {
    const ok = confirm(
      'This role has unsaved permission changes. Discard them and delete the role?',
    );
    if (!ok) return;
  }
  error.value = null;
  showDeleteDialog.value = true;
}

async function confirmDeleteRole() {
  const role = selectedRole.value;
  if (!role) return;
  deleting.value = true;
  error.value = null;
  try {
    await apiFetch(`/roles/${role.id}`, { method: 'DELETE' });
    roles.value = roles.value.filter((r) => r.id !== role.id);
    showDeleteDialog.value = false;
    selectedRoleId.value = null;
    draft.value = new Set();
    savedSnapshot.value = new Set();
    success.value = `Role “${role.name}” deleted.`;
    if (roles.value.length > 0) selectRole(roles.value[0]);
  } catch (e: unknown) {
    error.value =
      ((e as { data?: { message?: string } }).data?.message) ??
      (e as Error).message ??
      'Failed to delete role';
    showDeleteDialog.value = false;
  } finally {
    deleting.value = false;
  }
}

async function save() {
  const role = selectedRole.value;
  if (!role || !dirty.value) return;
  saving.value = true;
  error.value = null;
  success.value = null;
  try {
    const updated = await apiFetch<RoleDto>(`/roles/${role.id}/permissions`, {
      method: 'PUT',
      body: { permissionCodes: Array.from(draft.value) },
    });
    const idx = roles.value.findIndex((r) => r.id === role.id);
    if (idx !== -1) roles.value[idx] = updated;
    savedSnapshot.value = new Set(draft.value);
    success.value = `Permissions for “${role.name}” saved.`;
  } catch (e: unknown) {
    error.value =
      ((e as { data?: { message?: string } }).data?.message) ??
      (e as Error).message ??
      'Failed to save';
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="roles-page">
    <UiAppPageHeader>
      <h1 class="page-title">Roles & permissions</h1>
      <p class="page-subtitle">
        Pick a role and assign permissions by section. Scales better than a matrix when you have many roles.
      </p>
    </UiAppPageHeader>

    <div v-if="loading" class="state-block">
      Loading roles and permissions…
    </div>

    <div v-else class="roles-layout">
      <aside class="roles-sidebar card">
        <div class="sidebar-head">
          <h2 class="sidebar-title">Roles</h2>
          <div class="sidebar-head__actions">
            <span class="badge">{{ roles.length }}</span>
            <button type="button" class="btn-primary text-xs" @click="openCreateModal">
              New role
            </button>
          </div>
        </div>
        <div class="search-box sidebar-search">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            v-model="roleSearch"
            type="search"
            class="search-input"
            placeholder="Search role…"
            autocomplete="off"
          />
        </div>
        <ul class="role-list" role="listbox" aria-label="Roles">
          <li v-for="r in filteredRoles" :key="r.id">
            <button
              type="button"
              class="role-item"
              :class="selectedRoleId === r.id && 'role-item--active'"
              role="option"
              :aria-selected="selectedRoleId === r.id"
              @click="selectRole(r)"
            >
              <span class="role-item__main">
                <span class="role-item__name">{{ r.name }}</span>
                <span class="role-item__code">{{ r.code }}</span>
              </span>
              <span class="role-item__badge">
                {{ r.permissions.length }}/{{ totalCount }}
              </span>
            </button>
          </li>
          <li v-if="filteredRoles.length === 0" class="role-empty">
            No matching roles
          </li>
        </ul>
      </aside>

      <section class="perms-panel card">
        <template v-if="selectedRole">
          <div class="perms-toolbar">
            <div class="perms-toolbar__info">
              <h2 class="perms-title">{{ selectedRole.name }}</h2>
              <p v-if="selectedRole.description" class="perms-desc">
                {{ selectedRole.description }}
              </p>
              <p class="perms-meta">
                <span class="font-mono text-xs">{{ selectedRole.code }}</span>
                <span v-if="selectedRole.isSystem" class="badge badge--caution">System</span>
                <span class="badge badge--accent">
                  {{ draftCount }} / {{ totalCount }} permissions
                </span>
              </p>
            </div>
            <div class="perms-toolbar__actions">
              <button
                type="button"
                class="btn-secondary text-xs"
                title="Edit name and description"
                @click="openEditModal"
              >
                {{ t('common.edit') }}
              </button>
              <button
                v-if="!selectedRole.isSystem"
                type="button"
                class="btn-secondary text-xs btn-secondary--danger"
                title="Delete role"
                :disabled="deleting"
                @click="askDeleteRole"
              >
                {{ t('common.delete') }}
              </button>
              <button
                type="button"
                class="btn-secondary text-xs"
                :disabled="!dirty || saving"
                @click="resetDraft"
              >
                Discard
              </button>
              <button
                type="button"
                class="btn-primary text-xs"
                :disabled="!dirty || saving"
                @click="save"
              >
                {{ saving ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </div>

          <div v-if="error" class="alert alert--error">{{ error }}</div>
          <div v-if="success" class="alert alert--success">{{ success }}</div>

          <div class="perms-filters">
            <div class="search-box perms-search">
              <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                v-model="permSearch"
                type="search"
                class="search-input"
                placeholder="Search permission…"
                autocomplete="off"
              />
            </div>
            <div class="perms-bulk">
              <button type="button" class="chip" @click="setAll(true)">
                All
              </button>
              <button type="button" class="chip" @click="setAll(false)">
                None
              </button>
            </div>
          </div>

          <div v-if="filteredGroups.length === 0" class="state-block state-block--compact">
            No permissions match your search.
          </div>

          <div v-else class="perm-groups">
            <div
              v-for="group in filteredGroups"
              :key="group.id"
              class="perm-group"
            >
              <div class="perm-group__head">
                <button
                  type="button"
                  class="perm-group__toggle"
                  :aria-expanded="!collapsedGroups.has(group.id)"
                  @click="toggleGroupCollapse(group.id)"
                >
                  <svg
                    class="perm-group__chevron"
                    :class="collapsedGroups.has(group.id) && 'perm-group__chevron--closed'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span class="perm-group__label">{{ group.label }}</span>
                  <span class="perm-group__count">
                    {{ groupCheckedCount(group.id).on }}/{{ groupCheckedCount(group.id).total }}
                  </span>
                </button>
                <div class="perm-group__actions">
                  <button
                    type="button"
                    class="chip text-xs"
                    @click="setGroup(group.id, true)"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    class="chip text-xs"
                    @click="setGroup(group.id, false)"
                  >
                    None
                  </button>
                </div>
              </div>

              <ul
                v-show="!collapsedGroups.has(group.id)"
                class="perm-list"
              >
                <li
                  v-for="p in group.permissions"
                  :key="p.code"
                  class="perm-row"
                >
                  <label class="perm-row__label">
                    <input
                      type="checkbox"
                      class="perm-check"
                      :checked="isChecked(p.code)"
                      @change="toggle(p.code)"
                    />
                    <span class="perm-row__text">
                      <span class="perm-code">{{ p.code }}</span>
                      <span class="perm-desc">{{ p.description }}</span>
                    </span>
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <div v-else class="state-block">
          Select a role from the list.
        </div>
      </section>
    </div>

    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="modal-overlay fixed inset-0 z-40 flex items-center justify-center p-4"
        @click.self="closeCreateModal"
      >
        <div class="modal-panel w-full max-w-md p-6 space-y-4" role="dialog" aria-labelledby="create-role-title">
          <div>
            <h3 id="create-role-title" class="text-lg font-semibold" style="color: var(--ink-strong); letter-spacing: -0.02em">
              New role
            </h3>
            <p class="text-sm mt-1" style="color: var(--ink-soft)">
              Enter a name only — the system code is generated automatically. Assign permissions after creating.
            </p>
          </div>
          <div>
            <label class="label" for="new-role-name">Name</label>
            <input
              id="new-role-name"
              v-model="newRole.name"
              required
              maxlength="80"
              class="input"
              placeholder="e.g. Quality Analyst"
              autocomplete="off"
            />
          </div>
          <div>
            <label class="label" for="new-role-desc">Description (optional)</label>
            <textarea
              id="new-role-desc"
              v-model="newRole.description"
              rows="2"
              maxlength="280"
              class="input"
              placeholder="What is this role for?"
            />
          </div>
          <div v-if="error && showCreateModal" class="alert alert--error">{{ error }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-secondary" :disabled="creating" @click="closeCreateModal">
              Cancel
            </button>
            <button type="button" class="btn-primary" :disabled="creating || !newRole.name.trim()" @click="createRole">
              {{ creating ? 'Creating…' : 'Create role' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showEditModal && selectedRole"
        class="modal-overlay fixed inset-0 z-40 flex items-center justify-center p-4"
        @click.self="closeEditModal"
      >
        <div class="modal-panel w-full max-w-md p-6 space-y-4" role="dialog" aria-labelledby="edit-role-title">
          <div>
            <h3 id="edit-role-title" class="text-lg font-semibold" style="color: var(--ink-strong); letter-spacing: -0.02em">
              {{ t('roles.editRole') }}
            </h3>
            <p class="text-sm mt-1" style="color: var(--ink-soft)">
              {{ t('roles.editHint') }}
            </p>
          </div>
          <div>
            <label class="label" for="edit-role-name">Name</label>
            <input
              id="edit-role-name"
              v-model="editRoleForm.name"
              required
              maxlength="80"
              class="input"
              autocomplete="off"
            />
          </div>
          <div>
            <label class="label" for="edit-role-desc">Description (optional)</label>
            <textarea
              id="edit-role-desc"
              v-model="editRoleForm.description"
              rows="2"
              maxlength="280"
              class="input"
            />
          </div>
          <p v-if="selectedRole.isSystem" class="text-xs" style="color: var(--ink-faint)">
            System role: code <span class="font-mono">{{ selectedRole.code }}</span> cannot change.
          </p>
          <div v-if="error && showEditModal" class="alert alert--error">{{ error }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-secondary" :disabled="updating" @click="closeEditModal">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="btn-primary"
              :disabled="updating || !editRoleForm.name.trim()"
              @click="saveRoleDetails"
            >
              {{ updating ? t('app.loading') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <UiConfirmDeleteDialog
      v-if="selectedRole && !selectedRole.isSystem"
      v-model:open="showDeleteDialog"
      :title="t('confirmDelete.titleRole')"
      :item-name="selectedRole.name"
      :loading="deleting"
      @confirm="confirmDeleteRole"
    />
  </div>
</template>

<style scoped>
.roles-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.roles-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
}
.roles-sidebar {
  flex: 0 0 260px;
  width: 260px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  max-height: calc(100vh - 9rem);
  position: sticky;
  top: 0.5rem;
  overflow: hidden;
}
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.sidebar-head__actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}
.sidebar-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink-strong);
}
.sidebar-search {
  width: 100%;
}
.role-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  text-align: left;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: background 0.12s;
}
.role-item:hover {
  background: var(--surface-hover);
}
.role-item--active {
  background: var(--accent-soft);
}
.role-item__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.role-item__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.role-item__code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  color: var(--ink-faint);
}
.role-item__badge {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ink-soft);
  padding: 0.125rem 0.375rem;
  background: var(--surface-card);
  border-radius: 6px;
}
.role-item--active .role-item__badge {
  background: var(--surface);
  color: var(--accent-text);
}
.role-empty {
  padding: 0.75rem;
  font-size: 0.8125rem;
  color: var(--ink-faint);
  text-align: center;
}
.perms-panel {
  flex: 1 1 320px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}
.perms-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--rule-soft);
}
.perms-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink-strong);
  letter-spacing: -0.02em;
}
.perms-desc {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--ink-soft);
}
.perms-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.perms-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.btn-secondary--danger {
  color: var(--danger);
}
.btn-secondary--danger:hover:not(:disabled) {
  background: var(--danger-soft);
}
.perms-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.perms-search {
  flex: 1 1 12rem;
  min-width: 0;
}
.perms-bulk {
  display: flex;
  gap: 0.25rem;
}
.alert {
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: 8px;
}
.alert--error {
  background: var(--danger-soft);
  color: var(--danger);
}
.alert--success {
  background: var(--positive-soft);
  color: var(--positive);
}
.perm-groups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.perm-group {
  border-radius: 10px;
  background: var(--surface-card);
  overflow: hidden;
}
.perm-group__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-hover);
}
.perm-group__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--ink);
  font-weight: 600;
  font-size: 0.8125rem;
}
.perm-group__chevron {
  width: 1rem;
  height: 1rem;
  transition: transform 0.15s;
}
.perm-group__chevron--closed {
  transform: rotate(-90deg);
}
.perm-group__count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ink-soft);
}
.perm-group__actions {
  display: flex;
  gap: 0.25rem;
}
.perm-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
}
.perm-row {
  border-top: 1px solid var(--rule-soft);
}
.perm-row:first-child {
  border-top: 0;
}
.perm-row__label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  transition: background 0.1s;
}
.perm-row__label:hover {
  background: var(--surface-hover);
}
.perm-check {
  margin-top: 0.2rem;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  accent-color: var(--accent);
}
.perm-row__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.perm-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  color: var(--ink);
}
.perm-desc {
  font-size: 0.75rem;
  color: var(--ink-faint);
  line-height: 1.4;
}
.state-block--compact {
  padding: 2rem 1rem;
}
.state-block {
  padding: 3rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--ink-soft);
  background: var(--surface-card);
  border-radius: 10px;
}
.search-box {
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

@media (max-width: 900px) {
  .roles-layout {
    flex-direction: column;
  }
  .roles-sidebar {
    flex: 1 1 auto;
    width: 100%;
    max-height: none;
    position: static;
    overflow: visible;
  }
  .role-list {
    max-height: 14rem;
  }
  .perms-panel {
    flex: 1 1 auto;
    width: 100%;
  }
}
</style>
