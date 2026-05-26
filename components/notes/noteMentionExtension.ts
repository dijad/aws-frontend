import Mention from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export function createNoteMentionExtension(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestion: Record<string, any>,
) {
  return Mention.extend({
    name: 'noteMention',
    renderHTML({ node, HTMLAttributes }) {
      const id = node.attrs.id as string;
      const label = (node.attrs.label as string | undefined) ?? id;
      return [
        'a',
        mergeAttributes(HTMLAttributes, {
          class: 'note-mention',
          href: `/global-notes/${id}`,
          'data-note-id': id,
        }),
        `#${label}`,
      ];
    },
    renderText({ node }) {
      const label = (node.attrs.label as string | undefined) ?? node.attrs.id;
      return `#${label}`;
    },
  }).configure({
    HTMLAttributes: { class: 'note-mention' },
    suggestion: {
      char: '#',
      allowSpaces: false,
      ...suggestion,
    },
  });
}

/** Read-only extension: clickable links without autocomplete. */
export function createNoteMentionReadonlyExtension() {
  return Mention.extend({
    name: 'noteMention',
    renderHTML({ node, HTMLAttributes }) {
      const id = node.attrs.id as string;
      const label = (node.attrs.label as string | undefined) ?? id;
      return [
        'a',
        mergeAttributes(HTMLAttributes, {
          class: 'note-mention',
          href: `/global-notes/${id}`,
          'data-note-id': id,
        }),
        `#${label}`,
      ];
    },
    renderText({ node }) {
      const label = (node.attrs.label as string | undefined) ?? node.attrs.id;
      return `#${label}`;
    },
  }).configure({
    HTMLAttributes: { class: 'note-mention' },
  });
}

export type NoteMentionSuggestionItem = {
  id: string;
  label: string;
};

export function insertNoteMention(
  editor: Editor,
  range: { from: number; to: number },
  item: NoteMentionSuggestionItem,
) {
  editor
    .chain()
    .focus()
    .insertContentAt(range, [
      {
        type: 'noteMention',
        attrs: { id: item.id, label: item.label },
      },
      { type: 'text', text: ' ' },
    ])
    .run();
}
