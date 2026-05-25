<template>
  <div class="auth-layout">
    <header class="auth-header">
      <div class="brand">
        <span class="brand-mark">A</span>
        <span class="brand-name">AWS</span>
      </div>
      <div class="auth-toolbar">
        <UiThemeToggle />
      </div>
    </header>
    <main class="auth-main">
      <slot />
    </main>
    <footer class="auth-footer">© {{ new Date().getFullYear() }} · AWS Workspace</footer>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  transition: background 0.25s ease;
}
.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}
.auth-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.brand { display: flex; align-items: center; gap: 0.625rem; }
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.8125rem;
}
.brand-name {
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink-strong);
}
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}
.auth-footer {
  padding: 1rem 1.5rem 1.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--ink-faint);
}
</style>
