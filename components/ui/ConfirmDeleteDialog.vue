<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false });

const props = withDefaults(
  defineProps<{
    title: string;
    itemName: string;
    hint?: string;
    loading?: boolean;
    confirmLabel?: string;
  }>(),
  {
    hint: undefined,
    loading: false,
    confirmLabel: undefined,
  },
);

const emit = defineEmits<{ confirm: [] }>();

const { t } = useI18n();

const hintText = computed(
  () => props.hint ?? t('confirmDelete.logicalDeleteHint'),
);
const confirmText = computed(
  () => props.confirmLabel ?? t('common.delete'),
);

function close() {
  if (props.loading) return;
  open.value = false;
}

function onConfirm() {
  emit('confirm');
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

watch(open, (isOpen) => {
  if (!import.meta.client) return;
  if (isOpen) {
    document.addEventListener('keydown', onKeydown);
    document.body.style.overflow = 'hidden';
  } else {
    document.removeEventListener('keydown', onKeydown);
    document.body.style.overflow = '';
  }
});

onUnmounted(() => {
  if (!import.meta.client) return;
  document.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="open"
        class="confirm-overlay"
        role="presentation"
        @click.self="close"
      >
        <div
          class="confirm-panel"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          @click.stop
        >
          <div class="confirm-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <h3 id="confirm-delete-title" class="confirm-title">
            {{ title }}
          </h3>

          <p class="confirm-message">
            {{ t('confirmDelete.aboutToDelete') }}
            <strong class="confirm-item-name">“{{ itemName }}”</strong>.
          </p>
          <p class="confirm-hint">{{ hintText }}</p>

          <div class="confirm-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="loading"
              @click="close"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="btn-danger confirm-delete-btn"
              :disabled="loading"
              @click="onConfirm"
            >
              <svg
                v-if="loading"
                class="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ loading ? t('app.loading') : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--modal-overlay);
  backdrop-filter: blur(4px);
}

.confirm-panel {
  width: 100%;
  max-width: 22rem;
  padding: 1.75rem 1.5rem 1.5rem;
  text-align: center;
  background: var(--modal-bg);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
}

.confirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  border-radius: 12px;
  background: var(--danger-soft);
  color: var(--danger);
}

.confirm-icon svg {
  width: 1.375rem;
  height: 1.375rem;
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink-strong);
}

.confirm-message {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink-soft);
}

.confirm-item-name {
  font-weight: 600;
  color: var(--ink);
}

.confirm-hint {
  margin-top: 0.625rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--ink-faint);
  background: var(--surface-card);
  border-radius: 8px;
}

.confirm-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.confirm-actions .btn-secondary,
.confirm-actions .confirm-delete-btn {
  flex: 1;
  justify-content: center;
}

.confirm-delete-btn:not(:disabled) {
  background: var(--danger);
  color: #fff;
}

.confirm-delete-btn:not(:disabled):hover {
  filter: brightness(1.05);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.18s ease;
}

.confirm-fade-enter-active .confirm-panel,
.confirm-fade-leave-active .confirm-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-panel,
.confirm-fade-leave-to .confirm-panel {
  transform: scale(0.96) translateY(4px);
  opacity: 0;
}
</style>
