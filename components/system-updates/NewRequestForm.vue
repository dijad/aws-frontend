<script setup lang="ts">
import type { SystemUpdatePriority, SystemUpdateType } from '~/types/api';

const props = defineProps<{
  saving?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const auth = useAuthStore();
const modules = useModulesStore();

const form = reactive({
  title: '',
  type: 'BUG_FIX' as SystemUpdateType,
  moduleId: '',
  priority: 'MEDIUM' as SystemUpdatePriority,
  description: '',
});

const titleLimit = 160;
const titleRemaining = computed(() => titleLimit - form.title.length);

const priorities: SystemUpdatePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const priorityTone: Record<SystemUpdatePriority, string> = {
  LOW: 'priority-chip--low',
  MEDIUM: 'priority-chip--medium',
  HIGH: 'priority-chip--high',
  CRITICAL: 'priority-chip--critical',
};

const typeOptions = [
  {
    value: 'BUG_FIX' as const,
    labelKey: 'systemUpdates.bugFix',
    hintKey: 'systemUpdates.form.bugHint',
    icon: 'bug',
    tone: 'type-card--bug',
  },
  {
    value: 'ENHANCEMENT' as const,
    labelKey: 'systemUpdates.enhancement',
    hintKey: 'systemUpdates.form.enhancementHint',
    icon: 'spark',
    tone: 'type-card--enhancement',
  },
];

function reset() {
  form.title = '';
  form.description = '';
  form.priority = 'MEDIUM';
  form.type = 'BUG_FIX';
  form.moduleId = '';
}

defineExpose({ form, reset });
</script>

<template>
  <form class="request-form animate-reveal" data-delay="2" @submit.prevent="emit('submit')">
    <header class="request-form__head">
      <div class="requester">
        <span class="requester__avatar">{{ auth.user?.name?.charAt(0) ?? '?' }}</span>
        <div class="requester__text">
          <span class="requester__label">{{ $t('systemUpdates.requester') }}</span>
          <span class="requester__name">{{ auth.user?.name }}</span>
        </div>
      </div>
      <div class="workflow" aria-hidden="true">
        <span class="workflow__step workflow__step--active">Dev</span>
        <span class="workflow__line" />
        <span class="workflow__step">Admin</span>
        <span class="workflow__line" />
        <span class="workflow__step">Done</span>
      </div>
    </header>

    <section class="request-section">
      <h2 class="request-section__title">{{ $t('systemUpdates.type') }}</h2>
      <div class="type-cards" role="group" :aria-label="$t('systemUpdates.type')">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          type="button"
          class="type-card"
          :class="[opt.tone, form.type === opt.value && 'type-card--selected']"
          :aria-pressed="form.type === opt.value"
          @click="form.type = opt.value"
        >
          <span class="type-card__icon" :class="`type-card__icon--${opt.icon}`">
            <svg v-if="opt.icon === 'bug'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M8 2v2M16 2v2M12 6V4M4 10h2M18 10h2M6 14H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h2M20 14h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-2" />
              <rect x="7" y="8" width="10" height="12" rx="2" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="m12 3-1.9 5.8H4l4.9 3.6-1.9 5.8L12 14.4l5 3.8-1.9-5.8L20 8.8h-6.1L12 3z" />
            </svg>
          </span>
          <span class="type-card__body">
            <span class="type-card__label">{{ $t(opt.labelKey) }}</span>
            <span class="type-card__hint">{{ $t(opt.hintKey) }}</span>
          </span>
          <span v-if="form.type === opt.value" class="type-card__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </button>
      </div>
    </section>

    <section class="request-section request-section--main">
      <div class="field field--title">
        <label class="label" for="su-title">Title</label>
        <input
          id="su-title"
          v-model="form.title"
          required
          :maxlength="titleLimit"
          class="input input--title"
          :placeholder="$t('systemUpdates.form.titlePlaceholder')"
        />
        <span class="field-hint" :class="titleRemaining < 20 && 'field-hint--warn'">
          {{ titleRemaining }} {{ $t('systemUpdates.form.charsLeft') }}
        </span>
      </div>

      <div class="meta-row">
        <div class="field">
          <label class="label" for="su-module">{{ $t('systemUpdates.module') }}</label>
          <div class="select-wrap">
            <select id="su-module" v-model="form.moduleId" required class="input select">
              <option value="" disabled>{{ $t('systemUpdates.selectModule') }}</option>
              <option v-for="m in modules.active" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
            <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <fieldset class="field field--priority">
          <legend class="label">{{ $t('systemUpdates.priority') }}</legend>
          <div class="priority-row">
            <button
              v-for="p in priorities"
              :key="p"
              type="button"
              class="priority-chip"
              :class="[priorityTone[p], form.priority === p && 'priority-chip--active']"
              :aria-pressed="form.priority === p"
              @click="form.priority = p"
            >
              <span class="priority-chip__dot" />
              {{ $t(`systemUpdates.priorities.${p}`) }}
            </button>
          </div>
        </fieldset>
      </div>

      <div class="field">
        <label class="label" for="su-desc">{{ $t('systemUpdates.description') }}</label>
        <textarea
          id="su-desc"
          v-model="form.description"
          required
          rows="7"
          class="input textarea"
          :placeholder="$t('systemUpdates.descriptionPlaceholder')"
        />
        <p class="field-foot">{{ $t('systemUpdates.form.descriptionHint') }}</p>
      </div>
    </section>

    <div v-if="props.error" class="form-error" role="alert">{{ props.error }}</div>

    <footer class="request-form__foot">
      <p class="foot-note">{{ $t('systemUpdates.form.reviewNote') }}</p>
      <div class="foot-actions">
        <button type="button" class="btn-secondary" @click="emit('cancel')">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn-primary" :disabled="props.saving">
          <svg v-if="!props.saving" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {{ props.saving ? $t('systemUpdates.form.creating') : $t('systemUpdates.form.submit') }}
        </button>
      </div>
    </footer>
  </form>
</template>

<style scoped>
.request-form {
  background: var(--surface-card);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.request-form__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  padding: 1.25rem 1.5rem;
  background: var(--bg-tint);
  border-bottom: 1px solid var(--rule-soft);
}

.requester {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.requester__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: var(--avatar-bg);
  color: var(--avatar-text);
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
}
.requester__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.requester__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.requester__name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink-strong);
}

.workflow {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.workflow__step {
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink-faint);
  background: var(--surface-card);
  border-radius: 999px;
  border: 1px solid var(--rule-soft);
}
.workflow__step--active {
  color: var(--accent-text);
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 35%, transparent);
}
.workflow__line {
  width: 1rem;
  height: 1px;
  background: var(--rule);
}

.request-section {
  padding: 1.5rem;
}
.request-section + .request-section {
  padding-top: 0;
}
.request-section--main {
  padding-top: 0.25rem;
}
.request-section__title {
  margin: 0 0 0.875rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.type-cards {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}
@media (min-width: 520px) {
  .type-cards {
    grid-template-columns: 1fr 1fr;
  }
}

.type-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  text-align: left;
  background: var(--surface);
  border: 1.5px solid var(--rule-soft);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.type-card:hover {
  border-color: var(--rule);
  background: var(--surface-hover);
}
.type-card--selected {
  box-shadow: var(--shadow-xs);
}
.type-card--bug.type-card--selected {
  border-color: color-mix(in srgb, var(--danger) 45%, transparent);
  background: var(--danger-soft);
}
.type-card--enhancement.type-card--selected {
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  background: var(--accent-soft);
}

.type-card__icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: var(--input-bg);
  color: var(--ink-soft);
}
.type-card__icon svg {
  width: 1.25rem;
  height: 1.25rem;
}
.type-card--bug.type-card--selected .type-card__icon {
  background: color-mix(in srgb, var(--danger) 18%, transparent);
  color: var(--danger);
}
.type-card--enhancement.type-card--selected .type-card__icon {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
}

.type-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.type-card__label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--ink-strong);
}
.type-card__hint {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--ink-faint);
}
.type-card__check {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: inline-flex;
  width: 1.125rem;
  height: 1.125rem;
  color: var(--accent);
}
.type-card--bug.type-card--selected .type-card__check {
  color: var(--danger);
}
.type-card__check svg {
  width: 100%;
  height: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.field + .field {
  margin-top: 1.25rem;
}
.field--title {
  margin-bottom: 0;
}
.field--priority {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}
.field--priority .label {
  margin-bottom: 0.5rem;
}

.input--title {
  font-size: 1.0625rem;
  font-weight: 500;
  padding: 0.75rem 1rem;
}
.field-hint {
  align-self: flex-end;
  font-size: 0.75rem;
  color: var(--ink-faint);
}
.field-hint--warn {
  color: var(--caution);
}
.field-foot {
  margin: 0.375rem 0 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--ink-faint);
}

.meta-row {
  display: grid;
  gap: 1.25rem;
  margin-top: 1.25rem;
}
@media (min-width: 768px) {
  .meta-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    align-items: end;
  }
}

.select-wrap {
  position: relative;
}
.select-wrap .select {
  appearance: none;
  padding-right: 2.25rem;
  width: 100%;
}
.select-chevron {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  width: 1rem;
  height: 1rem;
  color: var(--ink-faint);
  pointer-events: none;
  transform: translateY(-50%);
}

.priority-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.priority-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink-soft);
  background: var(--input-bg);
  border: 1.5px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s;
}
.priority-chip:hover {
  color: var(--ink);
  background: var(--surface-hover);
}
.priority-chip--active {
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}
.priority-chip--low.priority-chip--active {
  color: var(--ink);
  background: var(--surface);
  border-color: var(--rule);
}
.priority-chip--medium.priority-chip--active {
  color: var(--accent-text);
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}
.priority-chip--high.priority-chip--active {
  color: var(--caution);
  background: var(--caution-soft);
  border-color: color-mix(in srgb, var(--caution) 40%, transparent);
}
.priority-chip--critical.priority-chip--active {
  color: var(--danger);
  background: var(--danger-soft);
  border-color: color-mix(in srgb, var(--danger) 40%, transparent);
}
.priority-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink-trace);
}
.priority-chip--medium .priority-chip__dot { background: var(--accent); }
.priority-chip--high .priority-chip__dot { background: var(--caution); }
.priority-chip--critical .priority-chip__dot { background: var(--danger); }

.textarea {
  resize: vertical;
  min-height: 9.5rem;
  line-height: 1.55;
}

.form-error {
  margin: 0 1.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8125rem;
  border-radius: 8px;
}

.request-form__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.125rem 1.5rem;
  background: var(--bg-tint);
  border-top: 1px solid var(--rule-soft);
}
.foot-note {
  margin: 0;
  max-width: 36ch;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--ink-faint);
}
.foot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: auto;
}
.foot-actions .btn-primary {
  gap: 0.375rem;
}
</style>
