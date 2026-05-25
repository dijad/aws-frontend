<script setup lang="ts">
import { AUTH_DISABLED } from '~/config/auth-dev';

const auth = useAuthStore();
const { can, canAny } = usePermissions();
const route = useRoute();

type NavIcon =
  | 'notes'
  | 'manual'
  | 'note'
  | 'approve'
  | 'requests'
  | 'inbox'
  | 'users'
  | 'roles'
  | 'admin';

interface SubItem {
  to: string;
  label: string;
  featured?: boolean;
  icon?: NavIcon;
}

interface MenuGroup {
  id: string;
  label: string;
  children: SubItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  groups?: MenuGroup[];
  standalone?: SubItem[];
  children?: SubItem[];
}

function menuLinks(item: MenuItem): SubItem[] {
  const grouped = item.groups?.flatMap((g) => g.children) ?? [];
  const loose = item.standalone ?? [];
  if (grouped.length || loose.length) {
    return [...loose, ...grouped];
  }
  return item.children ?? [];
}

const menu = computed((): MenuItem[] => {
  const list: MenuItem[] = [];

  const gnGroups: MenuGroup[] = [
    {
      id: 'notes',
      label: 'Notes',
      children: [
        { to: '/global-notes', label: 'Notes', icon: 'note' },
        ...(can('NOTE_APPROVE_REJECT')
          ? [{ to: '/global-notes/approvals', label: 'Approve notes', icon: 'approve' }]
          : []),
      ],
    },
    {
      id: 'requests',
      label: 'Requests',
      children: [
        { to: '/global-notes/system-updates', label: 'System updates', icon: 'requests' },
        ...(canAny(['SYSTEM_UPDATE_REVIEW_AS_DEV', 'SYSTEM_UPDATE_REVIEW_AS_ADMIN'])
          ? [{ to: '/global-notes/system-updates/inbox', label: 'Review inbox', icon: 'inbox' }]
          : []),
      ],
    },
  ].filter((g) => g.children.length > 0);

  list.push({
    id: 'global-notes',
    label: 'Global Notes',
    icon: 'notes',
    standalone: [
      { to: '/global-notes/manual', label: 'User manual', featured: true, icon: 'manual' },
    ],
    groups: gnGroups,
  });

  const adminChildren: SubItem[] = [];
  if (can('USER_CREATE') || can('USER_UPDATE') || can('USER_DELETE')) {
    adminChildren.push({ to: '/admin/users', label: 'Users', icon: 'users' });
  }
  if (can('ROLE_MANAGE')) {
    adminChildren.push({
      to: '/admin/roles',
      label: 'Roles & permissions',
      icon: 'roles',
    });
  }
  if (adminChildren.length) {
    list.push({
      id: 'admin',
      label: 'Administration',
      icon: 'admin',
      children: adminChildren,
    });
  }

  return list;
});

function isChildActive(to: string) {
  if (to === '/global-notes') return route.path === '/global-notes' || route.path === '/';
  return route.path === to || route.path.startsWith(`${to}/`);
}

function isMenuActive(item: MenuItem) {
  return menuLinks(item).some((c) => isChildActive(c.to));
}

const open = ref<Record<string, boolean>>({});

watch(
  () => menu.value.map((m) => m.id).join(','),
  () => {
    for (const item of menu.value) {
      if (open.value[item.id] === undefined) {
        open.value[item.id] = isMenuActive(item);
      }
    }
  },
  { immediate: true },
);

watch(
  () => route.path,
  () => {
    for (const item of menu.value) {
      if (isMenuActive(item)) {
        open.value[item.id] = true;
      }
    }
  },
);

function toggle(id: string) {
  open.value[id] = !open.value[id];
}

const sidebarCollapsed = useLocalStorage('aws-sidebar-collapsed', false);
const { bind: bindSidebarTip } = useSidebarIconTooltip(() => sidebarCollapsed.value);

const collapsedNav = computed(() =>
  menu.value.flatMap((item) =>
    menuLinks(item).map((link) => ({
      ...link,
      icon: (link.icon ?? 'note') as NavIcon,
    })),
  ),
);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <div class="app-shell" :class="sidebarCollapsed && 'app-shell--collapsed'">
    <aside class="app-sidebar" :class="sidebarCollapsed && 'app-sidebar--collapsed'">
      <div class="sidebar-head">
        <NuxtLink
          to="/global-notes"
          class="brand"
          :class="sidebarCollapsed && 'brand--collapsed'"
          :ref="(el) => bindSidebarTip('brand', el, 'Global Notes')"
        >
          <span class="brand-mark">A</span>
          <div v-if="!sidebarCollapsed" class="brand-text">
            <span class="brand-name">AWS</span>
            <span class="brand-tag">Workspace</span>
          </div>
        </NuxtLink>
        <button
          type="button"
          class="sidebar-toggle"
          :ref="(el) => bindSidebarTip('toggle', el, sidebarCollapsed ? 'Expand sidebar' : undefined)"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleSidebar"
        >
          <LayoutSidebarNavIcon :name="sidebarCollapsed ? 'expand' : 'collapse'" />
        </button>
      </div>

      <nav v-if="sidebarCollapsed" class="menu menu--collapsed">
        <NuxtLink
          v-for="link in collapsedNav"
          :key="link.to"
          :to="link.to"
          class="collapsed-link"
          :class="{
            'collapsed-link--active': isChildActive(link.to),
            'collapsed-link--featured': link.featured,
          }"
          :ref="(el) => bindSidebarTip(`nav-${link.to}`, el, link.label)"
          :aria-label="link.label"
        >
          <LayoutSidebarNavIcon :name="link.icon" />
        </NuxtLink>
      </nav>

      <nav v-else class="menu">
        <div v-for="item in menu" :key="item.id" class="menu-item">
          <button
            type="button"
            class="menu-row"
            :class="{ 'menu-row--active': isMenuActive(item) }"
            @click="toggle(item.id)"
          >
            <span class="menu-icon">
              <LayoutSidebarNavIcon :name="item.icon === 'notes' ? 'notes' : 'admin'" />
            </span>
            <span class="menu-label">{{ item.label }}</span>
            <svg
              class="menu-chevron"
              :class="open[item.id] && 'menu-chevron--open'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <transition name="expand">
            <ul v-if="open[item.id]" class="submenu">
              <template v-if="item.standalone?.length">
                <li v-for="child in item.standalone" :key="child.to">
                  <NuxtLink
                    :to="child.to"
                    class="submenu-link"
                    :class="{
                      'submenu-link--active': isChildActive(child.to),
                      'submenu-link--featured': child.featured,
                    }"
                  >
                    <span class="submenu-dot" />
                    {{ child.label }}
                  </NuxtLink>
                </li>
              </template>
              <template v-if="item.groups?.length">
                <template v-for="(group, gi) in item.groups" :key="group.id">
                  <li
                    class="submenu-group-label"
                    :class="(gi > 0 || item.standalone?.length) && 'submenu-group-label--spaced'"
                  >
                    {{ group.label }}
                  </li>
                  <li v-for="child in group.children" :key="child.to">
                    <NuxtLink
                      :to="child.to"
                      class="submenu-link"
                      :class="{ 'submenu-link--active': isChildActive(child.to) }"
                    >
                      <span class="submenu-dot" />
                      {{ child.label }}
                    </NuxtLink>
                  </li>
                </template>
              </template>
              <template v-else>
                <li v-for="child in item.children" :key="child.to">
                  <NuxtLink
                    :to="child.to"
                    class="submenu-link"
                    :class="{ 'submenu-link--active': isChildActive(child.to) }"
                  >
                    <span class="submenu-dot" />
                    {{ child.label }}
                  </NuxtLink>
                </li>
              </template>
            </ul>
          </transition>
        </div>
      </nav>

      <div class="user-block" :class="sidebarCollapsed && 'user-block--collapsed'">
        <div class="user-row" :class="sidebarCollapsed && 'user-row--collapsed'">
          <div
            class="user-avatar"
            :ref="(el) => bindSidebarTip('avatar', el, sidebarCollapsed ? (auth.user?.name ?? 'User') : undefined)"
          >
            {{ auth.user?.name?.charAt(0) ?? '?' }}
          </div>
          <div v-if="!sidebarCollapsed" class="user-info">
            <p class="user-name">{{ auth.user?.name ?? 'User' }}</p>
            <p class="user-role">{{ auth.user?.roleName ?? auth.user?.roleCode ?? '—' }}</p>
          </div>
          <button
            class="user-logout"
            :ref="(el) => bindSidebarTip('logout', el, sidebarCollapsed ? 'Sign out' : undefined)"
            :title="sidebarCollapsed ? undefined : 'Sign out'"
            :aria-label="'Sign out'"
            @click="auth.logout()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <main class="app-content">
      <UiAppFloatingToolbar />
      <div v-if="AUTH_DISABLED" class="dev-banner mb-4 flex items-center gap-2 px-3 py-2 text-xs">
        <span class="font-semibold">DEV</span>
        <span class="opacity-60">·</span>
        <span>authentication and permissions disabled</span>
      </div>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.sidebar-head {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  padding: 1rem 0.5rem 0.75rem 0.625rem;
}
.app-sidebar--collapsed .sidebar-head {
  flex-direction: column;
  align-items: center;
  padding: 0.875rem 0.375rem 0.5rem;
  gap: 0.5rem;
}
.sidebar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-faint);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.sidebar-toggle svg {
  width: 1.125rem;
  height: 1.125rem;
}
.sidebar-toggle:hover {
  background: var(--surface-hover);
  color: var(--ink);
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0.5rem;
  text-decoration: none;
  color: var(--ink);
  border-radius: 8px;
}
.brand--collapsed {
  flex: 0;
  justify-content: center;
  padding: 0.25rem;
}
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--ink-strong);
  letter-spacing: -0.01em;
}
.brand-tag {
  margin-top: 1px;
  font-size: 0.6875rem;
  color: var(--ink-faint);
  font-weight: 500;
}

.menu { flex: 1; padding: 0.5rem 0.625rem 1rem; overflow-y: auto; min-height: 0; }
.menu--collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.375rem 1rem;
  overflow-y: auto;
  overflow-x: visible;
}
.collapsed-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  color: var(--ink-soft);
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}
.collapsed-link svg {
  width: 1.25rem;
  height: 1.25rem;
}
.collapsed-link:hover {
  background: var(--surface-hover);
  color: var(--ink);
}
.collapsed-link--active {
  background: var(--accent-soft);
  color: var(--accent-text);
}
.collapsed-link--featured {
  color: var(--accent-text);
}
.collapsed-link--featured:hover {
  color: var(--accent-hover);
}
.menu-item + .menu-item { margin-top: 2px; }
.menu-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: var(--ink-soft);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.menu-row:hover { background: var(--surface-hover); color: var(--ink); }
.menu-row--active { color: var(--ink-strong); }
.menu-icon {
  display: inline-flex;
  width: 1.125rem;
  height: 1.125rem;
}
.menu-icon svg { width: 100%; height: 100%; }
.menu-label {
  flex: 1;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
}
.menu-chevron {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--ink-faint);
  transform: rotate(0deg);
  transition: transform 0.2s ease;
}
.menu-chevron--open { transform: rotate(90deg); }

.submenu {
  list-style: none;
  margin: 4px 0 6px 0;
  padding: 0 0 0 0.625rem;
  position: relative;
}
.submenu::before {
  content: '';
  position: absolute;
  left: 1.125rem;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: var(--rule);
}
.submenu-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.4375rem 0.625rem 0.4375rem 1.625rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: var(--ink-soft);
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}
.submenu-link:hover { background: var(--surface-hover); color: var(--ink); }
.submenu-dot {
  position: absolute;
  left: 1rem;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ink-trace);
  transition: background 0.12s, transform 0.12s;
}
.submenu-link:hover .submenu-dot { background: var(--ink-faint); }
.submenu-link--active {
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 500;
}
.submenu-link--active .submenu-dot {
  background: var(--accent);
  transform: scale(1.4);
}
.submenu-link--featured {
  color: var(--accent-text);
}
.submenu-link--featured:hover {
  color: var(--accent-hover);
}
.submenu-group-label {
  padding: 0.25rem 0.625rem 0.125rem 1.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-faint);
  list-style: none;
}
.submenu-group-label--spaced {
  margin-top: 0.5rem;
  padding-top: 0.625rem;
}

.expand-enter-active,
.expand-leave-active {
  overflow: hidden;
  transition: opacity 0.18s ease, max-height 0.25s ease;
}
.expand-enter-from,
.expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to,
.expand-leave-from { opacity: 1; max-height: 400px; }

.user-block {
  flex-shrink: 0;
  padding: 0.75rem 0.625rem 1rem;
  border-top: 1px solid var(--rule-soft);
}
.user-block--collapsed {
  padding: 0.75rem 0.375rem 1rem;
  overflow: visible;
}
.user-row--collapsed {
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem;
  border-radius: 10px;
  transition: background 0.12s;
}
.user-row:hover { background: var(--surface-hover); }
.user-avatar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--avatar-bg);
  color: var(--avatar-text);
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
}
.user-info { flex: 1; min-width: 0; }
.user-name {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-role {
  margin-top: 1px;
  font-size: 0.6875rem;
  color: var(--ink-faint);
}
.user-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 6px;
  background: transparent;
  border: 0;
  color: var(--ink-faint);
  transition: background 0.12s, color 0.12s;
}
.user-logout:hover { background: var(--surface-hover); color: var(--danger); }
</style>
