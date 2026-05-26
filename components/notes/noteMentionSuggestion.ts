import { VueRenderer } from '@tiptap/vue-3';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import NoteMentionList from './NoteMentionList.vue';
import type { CitableNoteLite } from '~/types/api';
import {
  insertNoteMention,
  type NoteMentionSuggestionItem,
} from './noteMentionExtension';

export default function noteMentionSuggestion(
  search: (query: string) => Promise<CitableNoteLite[]>,
) {
  return {
    items: async ({ query }: { query: string }): Promise<CitableNoteLite[]> => {
      try {
        return await search(query);
      } catch {
        return [];
      }
    },
    render: () => {
      let component: VueRenderer | null = null;
      let popup: TippyInstance | null = null;

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart: (props: any) => {
          component = new VueRenderer(NoteMentionList, {
            props,
            editor: props.editor,
          });
          if (!props.clientRect) return;
          const body = document.body;
          if (!body) return;
          popup = tippy(body, {
            getReferenceClientRect: props.clientRect,
            appendTo: () => body,
            content: component.element as Element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate(props: any) {
          component?.updateProps(props);
          popup?.setProps({ getReferenceClientRect: props.clientRect });
        },
        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === 'Escape') {
            popup?.hide();
            return true;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (component?.ref as any)?.onKeyDown?.(props.event) ?? false;
        },
        onExit() {
          popup?.destroy();
          component?.destroy();
          popup = null;
          component = null;
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    command: ({ editor, range, props }: any) => {
      insertNoteMention(editor, range, props as NoteMentionSuggestionItem);
    },
  };
}
