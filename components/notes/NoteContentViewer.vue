<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { createNoteMentionReadonlyExtension } from './noteMentionExtension';

const props = defineProps<{
  content: Record<string, unknown> | string | null | undefined;
}>();

const editor = useEditor({
  editable: false,
  content: props.content ?? '',
  extensions: [
    StarterKit,
    Mention.configure({
      HTMLAttributes: { class: 'mention' },
      renderText({ options, node }) {
        return `${options.suggestion.char}${(node.attrs as { id: string; label?: string }).label ?? node.attrs.id}`;
      },
    }),
    createNoteMentionReadonlyExtension(),
  ],
});

watch(
  () => props.content,
  (val) => {
    if (val) editor.value?.commands.setContent(val);
  },
);

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="note-content-viewer prose prose-sm max-w-none">
    <TiptapEditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.note-content-viewer :deep(.note-mention) {
  cursor: pointer;
  text-decoration: none;
}
.note-content-viewer :deep(.note-mention:hover) {
  text-decoration: underline;
}
</style>
