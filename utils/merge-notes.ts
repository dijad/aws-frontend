import type { NoteDto } from '~/types/api';

/** Merge API list with realtime rows (newer socket data wins on id clash). */
export function mergeNoteLists(
  apiNotes: NoteDto[],
  realtimeNotes: NoteDto[],
): NoteDto[] {
  const byId = new Map<string, NoteDto>();
  for (const n of apiNotes) byId.set(n.id, n);
  for (const n of realtimeNotes) byId.set(n.id, n);
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
