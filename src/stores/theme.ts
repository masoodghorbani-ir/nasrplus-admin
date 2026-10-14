import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemePreference = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false);
  const themePreference = ref<ThemePreference>('light');
  const sidebarCollapsed = ref(false);
  const mobileSidebarOpen = ref(false);

  function applyTheme(dark: boolean): void {
    isDark.value = dark;
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function setTheme(preference: ThemePreference): void {
    themePreference.value = preference;
    localStorage.setItem('nasrplus_theme', preference);

    if (preference === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
    } else {
      applyTheme(preference === 'dark');
    }
  }

  function toggleTheme(): void {
    if (isDark.value) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('nasrplus_sidebar_collapsed', String(sidebarCollapsed.value));
  }

  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed;
    localStorage.setItem('nasrplus_sidebar_collapsed', String(collapsed));
  }

  function toggleMobileSidebar(open?: boolean): void {
    if (open !== undefined) {
      mobileSidebarOpen.value = open;
    } else {
      mobileSidebarOpen.value = !mobileSidebarOpen.value;
    }
  }

  function initTheme(): void {
    const rawSaved = localStorage.getItem('nasrplus_theme') as ThemePreference | null;
    // Default theme is strictly 'light' for both landing and management panel
    const savedTheme: ThemePreference = rawSaved && rawSaved !== 'system' ? rawSaved : 'light';
    const savedSidebar = localStorage.getItem('nasrplus_sidebar_collapsed');

    if (savedSidebar !== null) {
      sidebarCollapsed.value = savedSidebar === 'true';
    }

    setTheme(savedTheme);

    // Listen for OS color scheme changes only if preference is explicitly 'system'
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (themePreference.value === 'system') {
        applyTheme(e.matches);
      }
    });
  }

  return {
    isDark,
    themePreference,
    sidebarCollapsed,
    mobileSidebarOpen,
    setTheme,
    toggleTheme,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileSidebar,
    initTheme,
  };
});
