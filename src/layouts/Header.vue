<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, useThemeStore, useNotificationStore } from '@/stores';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from 'lucide-vue-next';
import { Modal, Button, ConfirmDialog, Badge } from '@/components/ui';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const notificationStore = useNotificationStore();

const isUserMenuOpen = ref(false);
const isProfileModalOpen = ref(false);
const isLogoutModalOpen = ref(false);

const breadcrumbTitle = computed(() => {
  return (route.meta?.title as string) || 'پیشخوان';
});

const userInitials = computed(() => {
  if (!authStore.user?.fullName) return 'مدیر';
  const parts = authStore.user.fullName.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]} ${parts[1][0]}`;
  }
  return parts[0].slice(0, 2);
});

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

function closeUserMenu() {
  isUserMenuOpen.value = false;
}

function openProfile() {
  closeUserMenu();
  isProfileModalOpen.value = true;
}

function promptLogout() {
  closeUserMenu();
  isLogoutModalOpen.value = true;
}

function handleLogout() {
  authStore.logout();
  notificationStore.info('شما با موفقیت از سامانه خارج شدید.');
  router.push('/login');
}
</script>

<template>
  <header
    class="h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20 shrink-0 select-none"
    dir="rtl"
  >
    <!-- Left side (in RTL: Right side): Mobile toggle & Breadcrumbs -->
    <div class="flex items-center gap-3">
      <!-- Mobile sidebar hamburger button -->
      <button
        type="button"
        class="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        @click="themeStore.toggleMobileSidebar(true)"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Breadcrumbs -->
      <div class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        <span class="text-slate-400 dark:text-slate-500 hidden sm:inline">سامانه نصر پلاس</span>
        <span class="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
        <h2 class="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
          {{ breadcrumbTitle }}
        </h2>
      </div>
    </div>

    <!-- Actions: Theme Switcher, User Menu -->
    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Dark / Light Mode Switcher -->
      <button
        type="button"
        class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        :title="themeStore.isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
        @click="themeStore.toggleTheme"
      >
        <Sun v-if="themeStore.isDark" class="w-5 h-5 text-amber-400" />
        <Moon v-else class="w-5 h-5 text-slate-600" />
      </button>

      <!-- User Profile Dropdown -->
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          @click="toggleUserMenu"
        >
          <!-- Avatar Initials -->
          <div class="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
            {{ userInitials }}
          </div>

          <div class="hidden sm:flex flex-col text-right leading-tight">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
              {{ authStore.user?.fullName || authStore.user?.username || 'مدیر سیستم' }}
            </span>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {{ authStore.isSuperAdmin ? 'مدیر ارشد' : 'مدیر' }}
            </span>
          </div>

          <ChevronDown
            class="w-3.5 h-3.5 text-slate-400 mr-0.5 transition-transform duration-200"
            :class="{ 'rotate-180': isUserMenuOpen }"
          />
        </button>

        <!-- Dropdown Menu -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="isUserMenuOpen"
            class="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-950/50 border border-slate-200/90 dark:border-slate-800 p-1.5 z-40 text-right"
            dir="rtl"
          >
            <!-- User Info Summary -->
            <div class="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 mb-1.5">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {{ userInitials }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {{ authStore.user?.fullName || 'کاربر مدیر' }}
                  </p>
                  <p class="text-3xs text-slate-500 dark:text-slate-400 truncate mt-0.5" dir="ltr">
                    {{ authStore.user?.username }}
                  </p>
                </div>
              </div>

              <div class="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span class="text-3xs text-slate-500 dark:text-slate-400 font-medium">سطح دسترسی:</span>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-3xs font-extrabold"
                  :class="[
                    authStore.isSuperAdmin
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
                  ]"
                >
                  {{ authStore.isSuperAdmin ? 'مدیر ارشد (SUPERADMIN)' : 'مدیر سامانه (ADMIN)' }}
                </span>
              </div>
            </div>

            <!-- Menu actions -->
            <div class="space-y-0.5">
              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                @click="openProfile"
              >
                <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <User class="w-3.5 h-3.5" />
                </div>
                <span class="truncate">اطلاعات حساب و دسترسی‌ها</span>
              </button>

              <div class="my-1 border-t border-slate-100 dark:border-slate-800/80" />

              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                @click="promptLogout"
              >
                <div class="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <LogOut class="w-3.5 h-3.5" />
                </div>
                <span class="truncate">خروج از حساب کاربری</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>

  <!-- User Profile Details Modal -->
  <Modal
    :open="isProfileModalOpen"
    title="اطلاعات حساب کاربری مدیر"
    subtitle="جزییات هویت و مجوزهای دسترسی فعال در سامانه نصر پلاس"
    size="md"
    @close="isProfileModalOpen = false"
  >
    <div class="space-y-4 text-right">
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-base flex items-center justify-center shrink-0">
          {{ userInitials }}
        </div>
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">
            {{ authStore.user?.fullName }}
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ authStore.user?.username }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
          <span class="text-slate-400 block mb-1">نوع کاربری:</span>
          <span class="font-bold text-slate-800 dark:text-slate-200">
            {{ authStore.user?.type }}
          </span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
          <span class="text-slate-400 block mb-1">وضعیت حساب:</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            فعال
          </span>
        </div>
      </div>

      <div>
        <h5 class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Shield class="w-4 h-4 text-brand-600" />
          مجوزهای دسترسی تخصیص‌یافته
        </h5>

        <div v-if="authStore.isSuperAdmin" class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          به عنوان <strong>مدیر ارشد (SUPERADMIN)</strong>، دسترسی کامل به تمامی بخش‌های سامانه، تعاریف پایه، مدیریت اعضا، شرکت‌ها و حساب‌های مدیران برای شما فعال است.
        </div>

        <div v-else-if="Array.isArray(authStore.user?.permissions) && authStore.user.permissions.length > 0" class="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
          <Badge
            v-for="(p, idx) in authStore.user.permissions"
            :key="idx"
            variant="brand"
          >
            {{ typeof p === 'string' ? p : p.name }}
          </Badge>
        </div>

        <div v-else class="text-xs text-slate-400 py-3 text-center">
          هیچ مجوز مجزایی ثبت نشده است.
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="outline" size="md" @click="isProfileModalOpen = false">
        بستن پنجره
      </Button>
    </template>
  </Modal>

  <!-- Logout Confirmation Dialog -->
  <ConfirmDialog
    :open="isLogoutModalOpen"
    title="خروج از حساب کاربری"
    description="آیا می‌خواهید از سامانه نصر پلاس خارج شوید؟ برای دسترسی مجدد نیاز به ورود با نام کاربری و رمز عبور خواهید داشت."
    confirm-text="خروج از حساب"
    variant="danger"
    @confirm="handleLogout"
    @cancel="isLogoutModalOpen = false"
  />
</template>
