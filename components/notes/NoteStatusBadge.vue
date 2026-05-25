<script setup lang="ts">
import type { NoteStatus } from '~/types/api';

const props = defineProps<{ status: NoteStatus }>();

const modifierByStatus: Record<NoteStatus, string> = {
  PENDING: 'badge--caution',
  APPROVED: 'badge--positive',
  REJECTED: 'badge--danger',
};
</script>

<template>
  <span class="badge" :class="modifierByStatus[props.status]">
    <span class="badge-dot" />
    {{ $t(`notes.status.${props.status}`) }}
  </span>
</template>
