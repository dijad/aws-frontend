<script setup lang="ts">
import type { RoleDto, UserSummary } from '~/types/api';

definePageMeta({
  permissions: ['USER_UPDATE'],
});

const { apiFetch } = useApi();
const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const user = ref<UserSummary | null>(null);
const roles = ref<RoleDto[]>([]);
const form = reactive({
  name: '',
  password: '',
  roleCode: '',
  isActive: true,
});
const error = ref<string | null>(null);
const saving = ref(false);

onMounted(async () => {
  const [u, rs] = await Promise.all([
    apiFetch<UserSummary>(`/users/${id}`),
    apiFetch<RoleDto[]>('/roles'),
  ]);
  user.value = u;
  roles.value = rs;
  form.name = u.name;
  form.roleCode = u.role.code;
  form.isActive = u.isActive;
});

async function submit() {
  error.value = null;
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      name: form.name,
      roleCode: form.roleCode,
      isActive: form.isActive,
    };
    if (form.password) payload.password = form.password;
    await apiFetch(`/users/${id}`, { method: 'PATCH', body: payload });
    await router.push('/admin/users');
  } catch (e: unknown) {
    error.value = ((e as { data?: { message?: string } }).data?.message)
      ?? (e as Error).message
      ?? 'Error';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <NuxtLink to="/admin/users" class="back-link">
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><polyline points="15 18 9 12 15 6" /></svg>
      Users
    </NuxtLink>
    <UiAppPageHeader>
      <h1 class="page-title">{{ user?.name ?? '…' }}</h1>
      <p class="page-subtitle email-mono">{{ user?.email }}</p>
    </UiAppPageHeader>

    <form v-if="user" class="animate-reveal card-elevated form-card" data-delay="2" @submit.prevent="submit">
      <div><label class="label">Name</label><input v-model="form.name" required class="input" /></div>
      <div>
        <label class="label">Password <span style="color: var(--ink-faint); font-weight: 400">(optional)</span></label>
        <UiPasswordInput v-model="form.password" :minlength="8" autocomplete="new-password" />
      </div>
      <div>
        <label class="label">Role</label>
        <select v-model="form.roleCode" class="input">
          <option v-for="r in roles" :key="r.code" :value="r.code">{{ r.name }}</option>
        </select>
      </div>
      <label class="check-row">
        <input v-model="form.isActive" type="checkbox" />
        <span>Active user</span>
      </label>
      <div v-if="error" class="form-error">{{ error }}</div>
      <div class="form-actions">
        <NuxtLink to="/admin/users" class="btn-secondary">Cancel</NuxtLink>
        <button class="btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  margin-left: -0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink-soft);
  border-radius: 6px;
}
.back-link:hover { color: var(--ink); background: var(--surface-hover); }
.email-mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem; }
.form-card {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-error {
  padding: 0.625rem 0.75rem;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8125rem;
  border-radius: 8px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--rule-soft);
}
.check-row {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--ink);
}
.check-row input { width: 1rem; height: 1rem; accent-color: var(--accent); }
</style>
