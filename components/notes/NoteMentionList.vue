<script setup lang="ts">
import type { CitableNoteLite } from '~/types/api';

const props = defineProps<{
  items: CitableNoteLite[];
  command: (attrs: { id: string; label: string }) => void;
}>();

const selectedIndex = ref(0);

watch(
  () => props.items,
  () => (selectedIndex.value = 0),
);

function selectItem(index: number) {
  const item = props.items[index];
  if (item) props.command({ id: item.id, label: item.title });
}

function up() {
  selectedIndex.value =
    (selectedIndex.value + props.items.length - 1) % props.items.length;
}

function down() {
  selectedIndex.value = (selectedIndex.value + 1) % props.items.length;
}

function enter() {
  selectItem(selectedIndex.value);
}

defineExpose({
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      up();
      return true;
    }
    if (event.key === 'ArrowDown') {
      down();
      return true;
    }
    if (event.key === 'Enter') {
      enter();
      return true;
    }
    return false;
  },
});
</script>

<template>
  <div class="note-mention-list">
    <button
      v-for="(item, index) in items"
      :key="item.id"
      type="button"
      class="note-mention-list__item"
      :class="index === selectedIndex && 'note-mention-list__item--active'"
      @click="selectItem(index)"
    >
      <span class="note-mention-list__hash">#</span>
      <div class="note-mention-list__body">
        <p class="note-mention-list__title">{{ item.title }}</p>
        <p class="note-mention-list__meta">{{ item.status }}</p>
      </div>
    </button>
    <p v-if="items.length === 0" class="note-mention-list__empty">
      No notes found
    </p>
  </div>
</template>

<style scoped>
.note-mention-list {
  z-index: 50;
  max-height: 18rem;
  width: 16rem;
  overflow-y: auto;
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  padding: 0.25rem;
}

.note-mention-list__item {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 0.5rem;
  border-radius: 8px;
  padding: 0.5rem 0.625rem;
  text-align: left;
  font-size: 0.875rem;
  color: var(--ink);
  transition: background 0.12s;
}

.note-mention-list__item:hover,
.note-mention-list__item--active {
  background: var(--accent-soft);
  color: var(--accent-text);
}

.note-mention-list__hash {
  font-weight: 700;
  color: var(--accent-text);
  line-height: 1.25rem;
}

.note-mention-list__body {
  min-width: 0;
  flex: 1;
}

.note-mention-list__title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-mention-list__meta {
  margin-top: 1px;
  font-size: 0.6875rem;
  text-transform: capitalize;
  color: var(--ink-faint);
}

.note-mention-list__empty {
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  color: var(--ink-faint);
}
</style>
