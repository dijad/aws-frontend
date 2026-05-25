import type { NoteDto, NoteListScope } from '~/types/api';
import { mergeNoteLists } from '~/utils/merge-notes';

/** API notes merged with the realtime bucket for the active scope. */
export function useMergedNotesList(
  scope: Ref<NoteListScope>,
  apiNotes: Ref<NoteDto[]>,
) {
  const realtime = useNotesRealtimeStore();

  return computed(() =>
    mergeNoteLists(apiNotes.value, realtime.listFor(scope.value)),
  );
}
