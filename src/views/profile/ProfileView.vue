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
  { key: 'dashboard', label: 'داشبورد و پیشخوان', icon: LayoutDashboard },
  { key: 'info', label: 'شناسنامه و مشخصات', icon: User },
  { key: 'qualifications', label: 'مدارک تحصیلی', icon: GraduationCap },
  { key: 'skills', label: 'مهارت‌ها و گواهینامه‌ها', icon: Sparkles },
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

// Sync tab from route query
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
  <!-- CASE A: Member is NOT Authenticated -> Show Login View -->
  <div
    v-if="!memberAuthStore.isAuthenticated"
    class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 relative overflow-x-hidden transition-colors selection:bg-emerald-500 selection:text-white"
    dir="rtl"
  >
    <!-- Background Glows -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute -top-32 right-1/2 translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl dark:from-emerald-600/10 dark:via-emerald-600/5 rounded-full"
      />
      <div
        class="absolute -bottom-40 -left-20 w-80 h-80 bg-brand-500/10 blur-3xl rounded-full dark:bg-brand-500/5"
      />
    </div>

    <!-- Login Header -->
    <header
      class="w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 transition-colors"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <!-- Logo -->
        <div class="flex items-center gap-3 cursor-pointer" @click="goHome">
          <div
            class="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white dark:bg-slate-800 p-1.5 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0"
          >
            <img
              src="/logo.png"
              alt="لوگوی نظام صنفی رایانه‌ای"
              class="h-full w-auto object-contain"
            />
          </div>

          <div class="flex flex-col text-right">
            <span class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              نصر پلاس
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-normal">
              سامانه یکپارچه سازمان نظام صنفی رایانه‌ای
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
            @click="goHome"
          >
            <ArrowRight class="w-4 h-4" />
            <span class="hidden sm:inline">صفحه اصلی</span>
          </button>

          <button
            type="button"
            class="h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
            @click="themeStore.toggleTheme"
          >
            <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
            <Moon v-else class="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Login Body -->
    <main class="flex-1 flex items-center justify-center max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 z-10">
      <MemberLoginCard />
    </main>

    <!-- Footer -->
    <footer
      class="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs py-4 px-4 sm:px-6 z-10"
    >
      <div
        class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right"
      >
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span>&bull;</span>
          <span>پورتال اختصاصی و کارتابل اعضای صنف</span>
        </div>
        <div class="font-medium text-slate-600 dark:text-slate-400">
          سازمان نظام صنفی رایانه‌ای استان اردبیل
        </div>
      </div>
    </footer>
  </div>

  <!-- CASE B: Member is Logged In -> Show Member Portal Experience -->
  <div
    v-else
    class="min-h-screen flex flex-col justify-between bg-slate-50/70 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white"
    dir="rtl"
  >
    <!-- Authenticated Top Navigation Header -->
    <MemberProfileNavbar />

    <!-- Sticky Floating Navigation Tabs Bar (Always accessible on scroll & mobile optimized) -->
    <div
      class="sticky top-16 sm:top-20 z-20 px-3 sm:px-6 py-2 sm:py-2.5 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-all shadow-xs"
    >
      <div class="max-w-7xl mx-auto">
        <div
          ref="tabContainerRef"
          class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center overflow-x-auto scrollbar-none gap-1 sm:gap-2 touch-pan-x"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :data-tab="tab.key"
            type="button"
            :class="[
              'px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shrink-0 transition-all cursor-pointer whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
            ]"
            @click="setTab(tab.key)"
          >
            <component :is="tab.icon" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-7 space-y-5 sm:space-y-6">
      <!-- Tab Content 1: Overview Dashboard -->
      <div v-if="activeTab === 'dashboard'" class="animate-in fade-in duration-200">
        <MemberOverviewDashboard
          v-if="memberAuthStore.member"
          :member="memberAuthStore.member"
          @navigate="setTab($event as TabKey)"
          @openPhoto="isPhotoModalOpen = true"
        />
      </div>

      <!-- Tab Content 2: Personal & Guild Profile Details -->
      <div v-else-if="activeTab === 'info'" class="animate-in fade-in duration-200">
        <MemberPersonalInfoTab
          v-if="memberAuthStore.member"
          :member="memberAuthStore.member"
        />
      </div>

      <!-- Tab Content 3: Academic Qualifications Management -->
      <div v-else-if="activeTab === 'qualifications'" class="animate-in fade-in duration-200 space-y-4">
        <!-- Explanatory Header Card -->
        <div class="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/70 dark:border-emerald-800">
              <GraduationCap class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                مدیریت مدارک تحصیلی و استعلام کارشناسان صنف
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-relaxed">
                شما می‌توانید مدارک تحصیلی خود را ثبت نموده و وضعیت بررسی و تاییدیه کارشناسان دبیرخانه را در لحظه مشاهده فرمایید.
              </p>
            </div>
          </div>
        </div>

        <!-- Embedded Academic Qualifications Tab (allowVerify=false so members manage qualifications without expert actions) -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
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

      <!-- Tab Content 4: Skills & Certifications Management -->
      <div v-else-if="activeTab === 'skills'" class="animate-in fade-in duration-200 space-y-4">
        <!-- Explanatory Header Card -->
        <div class="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200/70 dark:border-brand-800">
              <Sparkles class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                مدیریت مهارت‌ها، تخصص‌ها و گواهینامه‌ها
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-relaxed">
                تخصص‌های خود را با درصد خودارزیابی ثبت نموده، تصویر گواهینامه‌ها را بارگذاری و تاییدیه رسمی کارشناسان را پیگیری کنید.
              </p>
            </div>
          </div>
        </div>

        <!-- Embedded Skills Tab (allowVerify=false) -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
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

      <!-- Tab Content 5: Personal Photo Management -->
      <div v-else-if="activeTab === 'photo'" class="animate-in fade-in duration-200">
        <MemberPhotoTab
          v-if="memberAuthStore.member"
          :member="memberAuthStore.member"
          @openPhotoModal="isPhotoModalOpen = true"
        />
      </div>
    </main>

    <!-- Global Member Photo Interactive Modal -->
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

    <!-- Portal Footer -->
    <footer
      class="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs py-4 px-4 sm:px-6 mt-8"
    >
      <div
        class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right"
      >
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-800 dark:text-slate-200">سامانه نصر پلاس</span>
          <span>&bull;</span>
          <span>پرتال رسمی اعضای نظام صنفی رایانه‌ای</span>
        </div>
        <div class="font-medium text-slate-600 dark:text-slate-400">
          کاری از متخصصان کمیسیون نرم‌افزار استان اردبیل
        </div>
      </div>
    </footer>
  </div>
</template>
