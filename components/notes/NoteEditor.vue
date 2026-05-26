<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import suggestion from './mentionSuggestion';
import noteMentionSuggestion from './noteMentionSuggestion';
import { createNoteMentionExtension } from './noteMentionExtension';
import type { UserLite, CitableNoteLite } from '~/types/api';
import { collectUserMentionIds } from '~/utils/note-content';

const props = defineProps<{
  modelValue: { json: Record<string, unknown> | null; text: string; mentionedUserIds: string[] };
  users: UserLite[];
  searchCitableNotes: (query: string) => Promise<CitableNoteLite[]>;
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
      renderText({ node }) {
        const label =
          (node.attrs as { id: string; label?: string }).label ?? node.attrs.id;
        return `@${label}`;
      },
      suggestion: suggestion(() => props.users),
    }),
    createNoteMentionExtension(noteMentionSuggestion(props.searchCitableNotes)),
  ],
  onUpdate({ editor: e }) {
    const json = e.getJSON();
    const text = e.getText();
    const mentioned = collectUserMentionIds(json);
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
</script>

<template>
  <TiptapEditorContent :editor="editor" />
</template>
