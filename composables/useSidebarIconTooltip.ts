import tippy, { type Instance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

function resolveElement(el: Element | ComponentPublicInstance | null): HTMLElement | null {
  if (!el) return null;
  if (el instanceof HTMLElement) return el;
  const root = (el as ComponentPublicInstance).$el;
  return root instanceof HTMLElement ? root : null;
}

export function useSidebarIconTooltip(enabled: MaybeRefOrGetter<boolean>) {
  const instances = new Map<string, Instance>();
  const elements = new Map<string, HTMLElement>();

  function destroy(id: string) {
    instances.get(id)?.destroy();
    instances.delete(id);
    elements.delete(id);
  }

  function bind(
    id: string,
    el: Element | ComponentPublicInstance | null,
    label: MaybeRefOrGetter<string | undefined>,
  ) {
    if (!el) {
      destroy(id);
      return;
    }

    const target = resolveElement(el);
    if (!target) return;

    elements.set(id, target);

    if (!toValue(enabled)) {
      destroy(id);
      return;
    }

    const text = toValue(label);
    if (!text) {
      destroy(id);
      return;
    }

    let instance = instances.get(id);
    if (!instance) {
      instance = tippy(target, {
        content: text,
        placement: 'right',
        offset: [0, 10],
        delay: [200, 0],
        duration: [120, 80],
        animation: 'fade',
        appendTo: () => document.body,
        theme: 'sidebar',
      });
      instances.set(id, instance);
      return;
    }

    instance.setProps({ content: text });
  }

  watch(
    () => toValue(enabled),
    (on) => {
      if (!on) {
        for (const id of [...instances.keys()]) destroy(id);
      }
    },
  );

  onBeforeUnmount(() => {
    for (const id of [...instances.keys()]) destroy(id);
  });

  return { bind };
}
