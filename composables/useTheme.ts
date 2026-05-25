export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'aws-theme';

export function useTheme() {
  const theme = useState<ThemeMode>('theme', () => 'light');

  function applyTheme(mode: ThemeMode) {
    theme.value = mode;
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  function setTheme(mode: ThemeMode) {
    applyTheme(mode);
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  function initTheme() {
    if (!import.meta.client) return;

    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const mode: ThemeMode =
      stored === 'light' || stored === 'dark' ? stored : 'light';

    applyTheme(mode);
  }

  const isDark = computed(() => theme.value === 'dark');

  return { theme, isDark, setTheme, toggleTheme, initTheme };
}
