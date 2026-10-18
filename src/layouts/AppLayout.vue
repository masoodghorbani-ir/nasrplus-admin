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

      <main class="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 2xl:px-10 py-4 sm:py-5 lg:py-6">
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

      <!-- Panel Footer -->
      <footer class="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs py-3.5 px-3 sm:px-5 lg:px-6 xl:px-8 2xl:px-10">
        <div class="max-w-[1920px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-700 dark:text-slate-300">سامانه نصر پلاس</span>
            <span class="text-slate-300 dark:text-slate-700">&bull;</span>
            <span>سازمان نظام صنفی رایانه‌ای</span>
          </div>
          <div class="font-medium text-slate-600 dark:text-slate-300">
            کاری از متخصصان کمسیون نرم افزار استان اردبیل
          </div>
        </div>
      </footer>
    </div>

    <!-- Global Toast Container -->
    <ToastContainer />
  </div>
</template>
