<script setup lang="ts">
import type { UserLite } from '~/types/api';

const props = defineProps<{
  items: UserLite[];
  command: (attrs: { id: string; label: string }) => void;
}>();

const selectedIndex = ref(0);

watch(
  () => props.items,
  () => (selectedIndex.value = 0),
);

function selectItem(index: number) {
  const item = props.items[index];
  if (item) props.command({ id: item.id, label: item.name });
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
  <div
    class="z-50 max-h-72 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
  >
    <button
      v-for="(item, index) in items"
      :key="item.id"
      type="button"
      class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100"
      :class="index === selectedIndex && 'bg-brand-50 text-brand-700'"
      @click="selectItem(index)"
    >
      <div
        class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold uppercase text-brand-700"
      >
        {{ item.name.charAt(0) }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate font-medium">{{ item.name }}</p>
        <p class="truncate text-xs text-slate-500">{{ item.email }}</p>
      </div>
    </button>
    <p v-if="items.length === 0" class="px-2 py-1.5 text-xs text-slate-500">
      No results
    </p>
  </div>
</template>
