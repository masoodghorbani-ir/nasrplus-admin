<script setup lang="ts">
import { onMounted } from 'vue';
import { useThemeStore, useLookupsStore } from '@/stores';
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';
import { ToastContainer } from '@/components/ui';

const themeStore = useThemeStore();
const lookupsStore = useLookupsStore();

onMounted(() => {
  // Pre-load lookup tables in the background for snappy UX
  lookupsStore.fetchAllLookups().catch(() => {});
});
</script>

<template>
  <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans" dir="rtl">
    <!-- Desktop Sidebar (persistent) -->
    <div class="hidden lg:block shrink-0">
      <Sidebar />
    </div>

    <!-- Mobile Off-Canvas Drawer Sidebar -->
    <Teleport to="body">
      <div
        v-if="themeStore.mobileSidebarOpen"
        class="fixed inset-0 z-50 lg:hidden overflow-hidden"
        dir="rtl"
      >
        <!-- Backdrop -->
        <Transition
          enter-active-class="transition-opacity duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            @click="themeStore.toggleMobileSidebar(false)"
          />
        </Transition>

        <!-- Off-canvas panel -->
        <Transition
          enter-active-class="transform transition ease-out duration-300"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transform transition ease-in duration-200"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div class="fixed inset-y-0 right-0 w-72 max-w-full shadow-2xl flex">
            <Sidebar class="w-full" />
          </div>
        </Transition>
      </div>
    </Teleport>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen">
      <Header />

      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-view v-slot="{ Component }">
          <transition
            name="fade"
            mode="out-in"
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Global Toast Container -->
    <ToastContainer />
  </div>
</template>
