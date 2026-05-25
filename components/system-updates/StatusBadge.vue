<script setup lang="ts">
import type { SystemUpdateStatus } from '~/types/api';

const props = defineProps<{ status: SystemUpdateStatus }>();

const modifierByStatus: Record<SystemUpdateStatus, string> = {
  PENDING: 'badge--caution',
  DEV_APPROVED: 'badge--accent',
  DEV_REJECTED: 'badge--danger',
  ADMIN_APPROVED: 'badge--positive',
  ADMIN_REJECTED: 'badge--danger',
  COMPLETED: '',
};
</script>

<template>
  <span class="badge" :class="modifierByStatus[props.status]">
    <span class="badge-dot" />
    {{ $t(`systemUpdates.status.${props.status}`) }}
  </span>
</template>
