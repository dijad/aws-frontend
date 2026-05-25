<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';

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
  <div class="prose prose-sm max-w-none">
    <TiptapEditorContent :editor="editor" />
  </div>
</template>
