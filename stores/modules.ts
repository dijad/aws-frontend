import { defineStore } from 'pinia';
import type { ModuleDto } from '~/types/api';

interface ModulesState {
  items: ModuleDto[];
  loaded: boolean;
}

export const useModulesStore = defineStore('modules', {
  state: (): ModulesState => ({ items: [], loaded: false }),
  getters: {
    active: (state) => state.items.filter((m) => m.isActive),
  },
  actions: {
    async ensureLoaded(force = false) {
      if (this.loaded && !force) return;
      const { apiFetch } = useApi();
      this.items = await apiFetch<ModuleDto[]>('/modules?includeInactive=true');
      this.loaded = true;
    },
  },
});
