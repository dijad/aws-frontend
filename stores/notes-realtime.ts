import { defineStore } from 'pinia';
import type { NoteDto, NoteListScope, NoteSyncPayload } from '~/types/api';

const INBOX_SCOPES: NoteListScope[] = ['mine', 'mentions', 'received'];
const APPROVAL_SCOPES: NoteListScope[] = ['pending', 'approved', 'rejected'];

function expandScopes(scopes: NoteListScope[]): NoteListScope[] {
  const set = new Set(scopes);
  if (INBOX_SCOPES.some((s) => set.has(s))) set.add('all');
  if (APPROVAL_SCOPES.some((s) => set.has(s))) set.add('all');
  return [...set];
}

/** Real-time note rows per list scope (WebSocket note:sync). */
export const useNotesRealtimeStore = defineStore('notesRealtime', {
  state: () => ({
    buckets: {} as Partial<Record<NoteListScope, Record<string, NoteDto>>>,
  }),

  actions: {
    applySync({ note, add, remove }: NoteSyncPayload) {
      for (const scope of expandScopes(remove)) {
        const bucket = this.buckets[scope];
        if (bucket) delete bucket[note.id];
      }
      for (const scope of expandScopes(add)) {
        if (!this.buckets[scope]) this.buckets[scope] = {};
        this.buckets[scope]![note.id] = note;
      }
    },

    listFor(scope: NoteListScope): NoteDto[] {
      return Object.values(this.buckets[scope] ?? {});
    },

    removeFromScope(scope: NoteListScope, id: string) {
      const bucket = this.buckets[scope];
      if (bucket) delete bucket[id];
      if (scope !== 'all') this.removeFromScope('all', id);
    },

    clearScope(scope: NoteListScope) {
      delete this.buckets[scope];
    },

    syncFromApi(scope: NoteListScope, notes: NoteDto[]) {
      if (!this.buckets[scope]) this.buckets[scope] = {};
      const bucket = this.buckets[scope]!;
      for (const note of notes) {
        bucket[note.id] = note;
      }
    },

    async fetchAndSync(
      noteId: string,
      sync: Pick<NoteSyncPayload, 'add' | 'remove'>,
    ) {
      const { apiFetch } = useApi();
      try {
        const note = await apiFetch<NoteDto>(`/notes/${noteId}`);
        this.applySync({ note, add: sync.add, remove: sync.remove });
      } catch {
        /* not visible to this user or already handled */
      }
    },
  },
});
