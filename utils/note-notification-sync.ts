import type { NotificationDto, NoteListScope } from '~/types/api';

/** Fallback scopes when only notification:new arrives (no note payload). */
export function syncFromNotificationType(
  type: NotificationDto['type'],
): { add: NoteListScope[]; remove: NoteListScope[] } | null {
  switch (type) {
    case 'NOTE_PENDING':
      return { add: ['pending'], remove: [] };
    case 'NOTE_MENTION':
      return { add: ['mentions'], remove: [] };
    case 'NOTE_RECEIVED':
      return { add: ['received'], remove: [] };
    case 'NOTE_APPROVED':
      return { add: ['mine'], remove: [] };
    case 'NOTE_REJECTED':
      return { add: ['mine'], remove: [] };
    default:
      return null;
  }
}
