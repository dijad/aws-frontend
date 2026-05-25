<template>
  <header class="page-header-bar">
    <div class="page-header-bar__main">
      <slot />
    </div>
    <div v-if="$slots.actions" class="page-header-bar__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  padding-top: 0.375rem;
  padding-right: 5.25rem;
}
.page-header-bar__main {
  flex: 1 1 12rem;
  min-width: 0;
}
.page-header-bar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-left: auto;
}
</style>
