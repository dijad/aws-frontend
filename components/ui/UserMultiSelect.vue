<script setup lang="ts">
import type { UserLite } from '~/types/api';

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    users: UserLite[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'Search and select users…',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const root = ref<HTMLElement | null>(null);
const query = ref('');
const open = ref(false);
const highlightIndex = ref(0);

const selectedUsers = computed(() =>
  props.modelValue
    .map((id) => props.users.find((u) => u.id === id))
    .filter((u): u is UserLite => Boolean(u)),
);

const availableUsers = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.users
    .filter((u) => !props.modelValue.includes(u.id))
    .filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    )
    .slice(0, 12);
});

watch(availableUsers, () => {
  highlightIndex.value = 0;
});

onClickOutside(root, () => {
  open.value = false;
});

function addUser(id: string) {
  if (props.disabled || props.modelValue.includes(id)) return;
  emit('update:modelValue', [...props.modelValue, id]);
  query.value = '';
  open.value = true;
}

function removeUser(id: string) {
  if (props.disabled) return;
  emit(
    'update:modelValue',
    props.modelValue.filter((uid) => uid !== id),
  );
}

function selectHighlighted() {
  const user = availableUsers.value[highlightIndex.value];
  if (user) addUser(user.id);
}

function onInputKeydown(event: KeyboardEvent) {
  if (!open.value && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    open.value = true;
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    highlightIndex.value =
      (highlightIndex.value + 1) % Math.max(availableUsers.value.length, 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const len = availableUsers.value.length;
    highlightIndex.value = len ? (highlightIndex.value + len - 1) % len : 0;
  } else if (event.key === 'Enter') {
    event.preventDefault();
    selectHighlighted();
  } else if (event.key === 'Escape') {
    open.value = false;
  } else if (event.key === 'Backspace' && !query.value && props.modelValue.length) {
    const last = props.modelValue[props.modelValue.length - 1];
    if (last) removeUser(last);
  }
}
</script>

<template>
  <div ref="root" class="user-multi-select" :class="disabled && 'user-multi-select--disabled'">
    <div
      class="user-multi-select__control"
      :class="open && 'user-multi-select__control--open'"
      @click="!disabled && (open = true)"
    >
      <div v-if="selectedUsers.length" class="user-multi-select__tags">
        <span
          v-for="user in selectedUsers"
          :key="user.id"
          class="user-multi-select__tag"
        >
          <span
            class="user-multi-select__avatar"
            :aria-label="user.name"
          >
            {{ user.name.charAt(0) }}
          </span>
          <span class="user-multi-select__tag-label">{{ user.name }}</span>
          <button
            type="button"
            class="user-multi-select__tag-remove"
            :disabled="disabled"
            :aria-label="`Remove ${user.name}`"
            @click.stop="removeUser(user.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
      <input
        v-model="query"
        type="text"
        class="user-multi-select__input"
        :placeholder="selectedUsers.length ? '' : placeholder"
        :disabled="disabled"
        @focus="open = true"
        @input="open = true"
        @keydown="onInputKeydown"
      />
    </div>

    <div v-if="open && !disabled" class="user-multi-select__dropdown">
      <button
        v-for="(user, index) in availableUsers"
        :key="user.id"
        type="button"
        class="user-multi-select__option"
        :class="index === highlightIndex && 'user-multi-select__option--active'"
        @mousedown.prevent
        @click="addUser(user.id)"
      >
        <span class="user-multi-select__avatar user-multi-select__avatar--option">
          {{ user.name.charAt(0) }}
        </span>
        <span class="user-multi-select__option-text">
          <span class="user-multi-select__option-name">{{ user.name }}</span>
          <span class="user-multi-select__option-email">{{ user.email }}</span>
        </span>
      </button>
      <p v-if="availableUsers.length === 0" class="user-multi-select__empty">
        {{ users.length === 0 ? 'No users available' : 'No results' }}
      </p>
    </div>

    <p v-if="selectedUsers.length" class="user-multi-select__hint">
      {{ selectedUsers.length }} recipient{{ selectedUsers.length === 1 ? '' : 's' }} selected
    </p>
  </div>
</template>

<style scoped>
.user-multi-select {
  position: relative;
}
.user-multi-select--disabled {
  opacity: 0.6;
  pointer-events: none;
}
.user-multi-select__control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.75rem;
  padding: 0.375rem 0.5rem 0.375rem 0.625rem;
  background: var(--surface-card);
  border-radius: 8px;
  cursor: text;
  transition: box-shadow 0.15s, background 0.15s;
}
.user-multi-select__control--open,
.user-multi-select__control:focus-within {
  background: var(--surface);
  box-shadow: 0 0 0 2px var(--accent);
}
.user-multi-select__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.user-multi-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.35rem 0.2rem 0.2rem;
  background: var(--accent-soft, rgba(0, 107, 68, 0.12));
  color: var(--ink);
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
}
.user-multi-select__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}
.user-multi-select__avatar--option {
  width: 1.75rem;
  height: 1.75rem;
  font-size: 0.75rem;
}
.user-multi-select__tag-label {
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-multi-select__tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
}
.user-multi-select__tag-remove:hover {
  color: var(--ink);
  background: rgba(0, 0, 0, 0.06);
}
.user-multi-select__tag-remove svg {
  width: 0.75rem;
  height: 0.75rem;
}
.user-multi-select__input {
  flex: 1 1 8rem;
  min-width: 6rem;
  border: 0;
  background: transparent;
  padding: 0.25rem 0.375rem;
  font-size: 0.9375rem;
  color: var(--ink);
  outline: none;
}
.user-multi-select__input::placeholder {
  color: var(--ink-faint);
}
.user-multi-select__dropdown {
  position: absolute;
  z-index: 40;
  top: calc(100% + 0.375rem);
  left: 0;
  right: 0;
  max-height: 16rem;
  overflow-y: auto;
  padding: 0.25rem;
  background: var(--surface);
  border-radius: 10px;
  box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.12));
}
.user-multi-select__option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
}
.user-multi-select__option:hover,
.user-multi-select__option--active {
  background: var(--surface-hover);
}
.user-multi-select__option-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.user-multi-select__option-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-multi-select__option-email {
  font-size: 0.75rem;
  color: var(--ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-multi-select__empty {
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--ink-soft);
}
.user-multi-select__hint {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--ink-faint);
}
</style>
