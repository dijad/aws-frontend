<script setup lang="ts">
import type { RoleDto } from '~/types/api';

definePageMeta({
  permissions: ['USER_CREATE'],
});

const { apiFetch } = useApi();
const router = useRouter();

const roles = ref<RoleDto[]>([]);
const form = reactive({
  name: '',
  email: '',
  password: '',
  roleCode: 'PROJECT_MANAGER',
});
const error = ref<string | null>(null);
const saving = ref(false);

onMounted(async () => {
  roles.value = await apiFetch<RoleDto[]>('/roles');
});

async function submit() {
  error.value = null;
  saving.value = true;
  try {
    await apiFetch('/users', { method: 'POST', body: form });
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
      <h1 class="page-title">New user</h1>
      <p class="page-subtitle">Create a user and assign a role.</p>
    </UiAppPageHeader>

    <form class="animate-reveal card-elevated form-card" data-delay="2" @submit.prevent="submit">
      <div><label class="label">Name</label><input v-model="form.name" required class="input" /></div>
      <div><label class="label">Email</label><input v-model="form.email" type="email" required class="input" /></div>
      <div><label class="label">Password</label><UiPasswordInput v-model="form.password" :minlength="8" required autocomplete="new-password" /></div>
      <div>
        <label class="label">Role</label>
        <select v-model="form.roleCode" class="input">
          <option v-for="r in roles" :key="r.code" :value="r.code">{{ r.name }}</option>
        </select>
      </div>
      <div v-if="error" class="form-error">{{ error }}</div>
      <div class="form-actions">
        <NuxtLink to="/admin/users" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
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
</style>
