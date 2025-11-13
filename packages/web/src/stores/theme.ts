import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'theme_mode';

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('auto');
  const isDark = ref(false);

  // 检测系统主题
  function detectSystemTheme(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // 应用主题
  function applyTheme(dark: boolean) {
    isDark.value = dark;
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // 更新主题
  function updateTheme() {
    if (mode.value === 'auto') {
      applyTheme(detectSystemTheme());
    } else {
      applyTheme(mode.value === 'dark');
    }
  }

  // 设置主题模式
  function setThemeMode(newMode: ThemeMode) {
    mode.value = newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
    updateTheme();
  }

  // 初始化主题
  function initTheme() {
    const savedMode = localStorage.getItem(STORAGE_KEY) as ThemeMode;
    if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
      mode.value = savedMode;
    }

    updateTheme();

    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (mode.value === 'auto') {
          applyTheme(e.matches);
        }
      });
    }
  }

  return {
    mode,
    isDark,
    setThemeMode,
    initTheme,
  };
});
