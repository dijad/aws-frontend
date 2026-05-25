<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import suggestion from './mentionSuggestion';
import type { UserLite } from '~/types/api';

const props = defineProps<{
  modelValue: { json: Record<string, unknown> | null; text: string; mentionedUserIds: string[] };
  users: UserLite[];
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [
    value: {
      json: Record<string, unknown>;
      text: string;
      mentionedUserIds: string[];
    },
  ];
}>();

const editor = useEditor({
  content: props.modelValue.json ?? '',
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder ?? '',
    }),
    Mention.configure({
      HTMLAttributes: { class: 'mention' },
      renderText({ options, node }) {
        return `${options.suggestion.char}${(node.attrs as { id: string; label?: string }).label ?? node.attrs.id}`;
      },
      suggestion: suggestion(() => props.users),
    }),
  ],
  onUpdate({ editor: e }) {
    const json = e.getJSON();
    const text = e.getText();
    const mentioned = collectMentionIds(json);
    emit('update:modelValue', {
      json: json as Record<string, unknown>,
      text,
      mentionedUserIds: mentioned,
    });
  },
});

watch(
  () => props.disabled,
  (val) => editor.value?.setEditable(!val),
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function collectMentionIds(node: unknown, acc: Set<string> = new Set()): string[] {
  if (!node || typeof node !== 'object') return Array.from(acc);
  const n = node as { type?: string; attrs?: { id?: string }; content?: unknown[] };
  if (n.type === 'mention' && n.attrs?.id) acc.add(n.attrs.id);
  if (Array.isArray(n.content)) n.content.forEach((c) => collectMentionIds(c, acc));
  return Array.from(acc);
}
</script>

<template>
  <TiptapEditorContent :editor="editor" />
</template>
