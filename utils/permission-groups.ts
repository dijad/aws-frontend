import type { PermissionDto } from '~/types/api';

export interface PermissionGroup {
  id: string;
  label: string;
  permissions: PermissionDto[];
}

const GROUP_LABELS: Record<string, string> = {
  users: 'Users',
  roles: 'Roles & permissions',
  modules: 'Modules',
  notes: 'Notes',
  systemUpdates: 'System updates',
  manual: 'User manual',
  other: 'Other',
};

const GROUP_ORDER = [
  'users',
  'roles',
  'modules',
  'notes',
  'systemUpdates',
  'manual',
  'other',
];

export function permissionGroupId(code: string): string {
  if (code.startsWith('USER_')) return 'users';
  if (code.startsWith('ROLE_')) return 'roles';
  if (code.startsWith('MODULE_')) return 'modules';
  if (code.startsWith('NOTE_')) return 'notes';
  if (code.startsWith('SYSTEM_UPDATE_')) return 'systemUpdates';
  if (code.startsWith('MANUAL_')) return 'manual';
  return 'other';
}

export function groupPermissions(permissions: PermissionDto[]): PermissionGroup[] {
  const buckets = new Map<string, PermissionDto[]>();
  for (const p of permissions) {
    const id = permissionGroupId(p.code);
    const list = buckets.get(id) ?? [];
    list.push(p);
    buckets.set(id, list);
  }

  return GROUP_ORDER.filter((id) => buckets.has(id)).map((id) => ({
    id,
    label: GROUP_LABELS[id] ?? id,
    permissions: (buckets.get(id) ?? []).sort((a, b) =>
      a.code.localeCompare(b.code),
    ),
  }));
}
