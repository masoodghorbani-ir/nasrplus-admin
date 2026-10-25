<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMemberAuthStore, useLookupsStore, useThemeStore } from '@/stores';
import MemberProfileNavbar from './components/MemberProfileNavbar.vue';
import MemberLoginCard from './components/MemberLoginCard.vue';
import MemberOverviewDashboard from './components/MemberOverviewDashboard.vue';
import MemberPersonalInfoTab from './components/MemberPersonalInfoTab.vue';
import MemberPhotoTab from './components/MemberPhotoTab.vue';
import MemberQualificationsTab from '@/views/members/components/MemberQualificationsTab.vue';
import MemberSkillsTab from '@/views/members/components/MemberSkillsTab.vue';
import MemberPhotoModal from '@/views/members/components/MemberPhotoModal.vue';
import { AppLogo } from '@/components/ui';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Sparkles,
  Camera,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-vue-next';

type TabKey = 'dashboard' | 'info' | 'qualifications' | 'skills' | 'photo';

const route = useRoute();
const router = useRouter();
const memberAuthStore = useMemberAuthStore();
const lookupsStore = useLookupsStore();
const themeStore = useThemeStore();

const activeTab = ref<TabKey>('dashboard');
const isPhotoModalOpen = ref(false);
const tabContainerRef = ref<HTMLElement | null>(null);

const tabs = [
  { key: 'dashboard', label: 'پیشخوان', icon: LayoutDashboard },
  { key: 'info', label: 'شناسنامه', icon: User },
  { key: 'qualifications', label: 'مدارک تحصیلی', icon: GraduationCap },
  { key: 'skills', label: 'مهارت‌ها', icon: Sparkles },
  { key: 'photo', label: 'تصویر پرسنلی', icon: Camera },
] as const;

function scrollActiveTabIntoView(tabKey: string) {
  setTimeout(() => {
    if (!tabContainerRef.value) return;
    const activeEl = tabContainerRef.value.querySelector<HTMLElement>(`[data-tab="${tabKey}"]`);
    activeEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, 60);
}

function setTab(tab: TabKey) {
  activeTab.value = tab;
  router.replace({ query: { ...route.query, tab } });
  scrollActiveTabIntoView(tab);
}

function handlePhotoUpdated(newPhotoPath: string) {
  memberAuthStore.updateCurrentMember({ profileImage: newPhotoPath });
  memberAuthStore.photoTimestamp = Date.now();
  isPhotoModalOpen.value = false;
}

function handleDataUpdated() {
  memberAuthStore.fetchProfile();
}

function goHome() {
  router.push('/');
}

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && ['dashboard', 'info', 'qualifications', 'skills', 'photo'].includes(newTab as string)) {
      activeTab.value = newTab as TabKey;
      scrollActiveTabIntoView(newTab as string);
    } else {
      activeTab.value = 'dashboard';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  memberAuthStore.initAuth();
  await lookupsStore.fetchAllLookups();
  if (memberAuthStore.isAuthenticated) {
    await memberAuthStore.fetchProfile();
  }
});
</script>

<template>
  <!-- Unauthenticated -->
  <div
    v-if="!memberAuthStore.isAuthenticated"
    class="portal-page relative flex min-h-screen flex-col justify-between overflow-x-hidden font-sans transition-colors selection:bg-brand-600 selection:text-white"
    dir="rtl"
  >
    <header class="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <div class="cursor-pointer" title="رفتن به صفحه اصلی" @click="goHome">
          <AppLogo size="md" />
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            @click="goHome"
          >
            <ArrowRight class="h-4 w-4" />
            <span class="hidden sm:inline">صفحه اصلی</span>
          </button>

          <button
            type="button"
            class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
            @click="themeStore.toggleTheme"
          >
            <Sun v-if="themeStore.isDark" class="h-4 w-4 text-amber-400" />
            <Moon v-else class="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>

    <main class="z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <MemberLoginCard />
    </main>

    <footer class="z-10 w-full border-t border-slate-200 bg-white py-4 px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:text-right">
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span aria-hidden="true">·</span>
          <span>پورتال اختصاصی اعضای صنف</span>
        </div>
        <div>سازمان نظام صنفی رایانه‌ای استان اردبیل</div>
      </div>
    </footer>
  </div>

  <!-- Authenticated -->
  <div
    v-else
    class="portal-page flex min-h-screen flex-col justify-between font-sans transition-colors selection:bg-brand-600 selection:text-white"
    dir="rtl"
  >
    <MemberProfileNavbar />

    <!-- Integrated underline navigation -->
    <nav
      class="sticky top-14 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 sm:top-16"
      aria-label="بخش‌های پرونده"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          ref="tabContainerRef"
          class="-mb-px flex items-center gap-1 overflow-x-auto touch-pan-x scrollbar-none"
          role="tablist"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :data-tab="tab.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            :class="[
              'portal-nav-tab cursor-pointer',
              activeTab === tab.key ? 'portal-nav-tab-active' : '',
            ]"
            @click="setTab(tab.key)"
          >
            <component :is="tab.icon" class="h-4 w-4 shrink-0" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </nav>

    <main class="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <div v-if="activeTab === 'dashboard'">
        <MemberOverviewDashboard
          v-if="memberAuthStore.member"
          :member="memberAuthStore.member"
          @navigate="setTab($event as TabKey)"
          @openPhoto="isPhotoModalOpen = true"
        />
      </div>

      <div v-else-if="activeTab === 'info'">
        <MemberPersonalInfoTab
          v-if="memberAuthStore.member"
          :member="memberAuthStore.member"
        />
      </div>

      <div v-else-if="activeTab === 'qualifications'" class="space-y-4">
        <header class="space-y-1">
          <h2 class="portal-section-title text-base">مدارک تحصیلی</h2>
          <p class="portal-muted leading-relaxed">
            مدارک دانشگاهی خود را ثبت کنید و وضعیت بررسی کارشناسان دبیرخانه را پیگیری نمایید.
          </p>
        </header>

        <div class="portal-panel p-4 sm:p-5">
          <MemberQualificationsTab
            v-if="memberAuthStore.member"
            :member-id="memberAuthStore.member._id"
            :member="memberAuthStore.member"
            :allow-verify="false"
            :restrict-edit-time="true"
            @updated="handleDataUpdated"
          />
        </div>
      </div>

      <div v-else-if="activeTab === 'skills'" class="space-y-4">
        <header class="space-y-1">
          <h2 class="portal-section-title text-base">مهارت‌ها و گواهینامه‌ها</h2>
          <p class="portal-muted leading-relaxed">
            تخصص‌ها را با خودارزیابی ثبت کنید، تصویر گواهینامه را بارگذاری و تایید کارشناسان را پیگیری کنید.
          </p>
        </header>

        <div class="portal-panel p-4 sm:p-5">
          <MemberSkillsTab
            v-if="memberAuthStore.member"
            :member-id="memberAuthStore.member._id"
            :member="memberAuthStore.member"
            :allow-verify="false"
            :restrict-edit-time="true"
            @updated="handleDataUpdated"
          />
        </div>
      </div>

      <div v-else-if="activeTab === 'photo'">
        <MemberPhotoTab
          v-if="memberAuthStore.member"
          :member="memberAuthStore.member"
          @openPhotoModal="isPhotoModalOpen = true"
        />
      </div>
    </main>

    <MemberPhotoModal
      v-if="memberAuthStore.member"
      :is-open="isPhotoModalOpen"
      :member-id="memberAuthStore.member._id"
      :member-name="memberAuthStore.memberFullName"
      :current-photo="memberAuthStore.member.profileImage"
      :current-timestamp="memberAuthStore.photoTimestamp"
      @close="isPhotoModalOpen = false"
      @updated="handlePhotoUpdated"
    />

    <footer class="mt-6 w-full border-t border-slate-200 bg-white py-4 px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-center text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:text-right">
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span aria-hidden="true">·</span>
          <span>پرتال رسمی اعضای نظام صنفی رایانه‌ای</span>
        </div>
        <div>کاری از متخصصان کمیسیون نرم‌افزار استان اردبیل</div>
      </div>
    </footer>
  </div>
</template>
