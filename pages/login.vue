<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const auth = useAuthStore();
const route = useRoute();
const { t } = useI18n();

const email = ref('admin@example.com');
const password = ref('Admin123!');
const loading = ref(false);
const error = ref<string | null>(null);

async function submit() {
  loading.value = true;
  error.value = null;
  try {
    await auth.login(email.value, password.value);
    const redirect = (route.query.redirect as string | undefined) ?? '/';
    await navigateTo(redirect);
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    error.value =
      status === 401
        ? t('auth.errors.invalidCredentials')
        : (e as Error).message ?? 'Error';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-card animate-reveal" data-delay="1">
    <div class="login-head">
      <h1 class="login-title">Welcome</h1>
      <p class="login-sub">Sign in to access your workspace.</p>
    </div>

    <form class="login-form" @submit.prevent="submit">
      <div>
        <label class="label" for="email">{{ $t('auth.email') }}</label>
        <input id="email" v-model="email" type="email" required autocomplete="email" class="input" />
      </div>

      <div>
        <label class="label" for="password">{{ $t('auth.password') }}</label>
        <UiPasswordInput id="password" v-model="password" required autocomplete="current-password" />
      </div>

      <div v-if="error" class="login-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        <span>{{ error }}</span>
      </div>

      <button class="btn-primary w-full justify-center" type="submit" :disabled="loading" style="padding: 0.625rem 1rem; font-weight: 600">
        <svg v-if="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ loading ? $t('app.loading') : $t('auth.signIn') }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-card {
  width: 100%;
  max-width: 24rem;
  background: var(--surface);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 2rem;
}
.login-head { margin-bottom: 1.75rem; text-align: center; }
.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--ink-strong);
}
.login-sub {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  color: var(--ink-soft);
}
.login-form { display: flex; flex-direction: column; gap: 1rem; }
.login-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8125rem;
  border-radius: 8px;
}
</style>
