import { VueRenderer } from '@tiptap/vue-3';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import MentionList from './MentionList.vue';
import type { UserLite } from '~/types/api';

interface Item {
  id: string;
  label: string;
}

export default function suggestion(getUsers: () => UserLite[]) {
  return {
    items: ({ query }: { query: string }): UserLite[] => {
      const q = query.toLowerCase();
      return getUsers()
        .filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q),
        )
        .slice(0, 8);
    },
    render: () => {
      let component: VueRenderer | null = null;
      let popup: TippyInstance | null = null;

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart: (props: any) => {
          component = new VueRenderer(MentionList, {
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
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'mention',
            attrs: { id: (props as Item).id, label: (props as Item).label },
          },
          { type: 'text', text: ' ' },
        ])
        .run();
    },
  };
}
