/** Collect user IDs from TipTap `mention` nodes. */
export function collectUserMentionIds(
  node: unknown,
  acc: Set<string> = new Set(),
): string[] {
  if (!node || typeof node !== 'object') return Array.from(acc);
  const n = node as {
    type?: string;
    attrs?: { id?: string };
    content?: unknown[];
  };
  if (n.type === 'mention' && n.attrs?.id) acc.add(n.attrs.id);
  if (Array.isArray(n.content)) n.content.forEach((c) => collectUserMentionIds(c, acc));
  return Array.from(acc);
}

/** Collect note IDs from TipTap `noteMention` nodes. */
export function collectNoteMentionIds(
  node: unknown,
  acc: Set<string> = new Set(),
): string[] {
  if (!node || typeof node !== 'object') return Array.from(acc);
  const n = node as {
    type?: string;
    attrs?: { id?: string };
    content?: unknown[];
  };
  if (n.type === 'noteMention' && n.attrs?.id) acc.add(n.attrs.id);
  if (Array.isArray(n.content)) n.content.forEach((c) => collectNoteMentionIds(c, acc));
  return Array.from(acc);
}
