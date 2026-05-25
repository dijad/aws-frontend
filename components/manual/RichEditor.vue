<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const props = defineProps<{
  modelValue: { json: Record<string, unknown> | null; text: string };
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [
    value: { json: Record<string, unknown>; text: string },
  ];
}>();

const editor = useEditor({
  content: props.modelValue.json ?? '',
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder ?? '' }),
  ],
  onUpdate({ editor: e }) {
    emit('update:modelValue', {
      json: e.getJSON() as Record<string, unknown>,
      text: e.getText(),
    });
  },
});

watch(
  () => props.disabled,
  (v) => editor.value?.setEditable(!v),
);
onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <TiptapEditorContent :editor="editor" />
</template>
