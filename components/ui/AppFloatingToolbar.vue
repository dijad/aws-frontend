<template>
  <div class="app-floating-toolbar" aria-label="App toolbar">
    <UiThemeToggle />
    <NotificationBell />
  </div>
</template>

<style scoped>
.app-floating-toolbar {
  position: fixed;
  top: 0.875rem;
  right: 1.25rem;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem;
  border-radius: 12px;
  background: var(--surface-card);
  border: 1px solid var(--rule-soft);
  box-shadow: var(--shadow-sm);
}
</style>
