<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore, useThemeStore } from '@/stores';

const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(() => {
  themeStore.initTheme();
  authStore.initAuth();
});
</script>

<template>
  <router-view />
</template>
