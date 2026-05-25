<script setup lang="ts">
import type { SystemUpdatePriority } from '~/types/api';

const props = defineProps<{ priority: SystemUpdatePriority }>();

const modifierBy: Record<SystemUpdatePriority, string> = {
  LOW: '',
  MEDIUM: 'badge--accent',
  HIGH: 'badge--caution',
  CRITICAL: 'badge--danger',
};
</script>

<template>
  <span class="badge" :class="modifierBy[props.priority]">
    {{ $t(`systemUpdates.priorities.${props.priority}`) }}
  </span>
</template>
