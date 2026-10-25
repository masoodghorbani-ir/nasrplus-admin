<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminsApi } from '@/api';
import { useNotificationStore, useAuthStore } from '@/stores';
import type { AdminUser, Permission, CreateAdminInput, UpdateAdminInput, AdminType } from '@/types';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Users,
  Shield,
  Key,
  Search,
  Edit,
  Trash2,
} from 'lucide-vue-next';
import {
  Button,
  Input,
  Select,
  DatePicker,
  Badge,
  Modal,
  ConfirmDialog,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { formatPersianDate } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';

const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const activeTab = ref<'admins' | 'permissions'>('admins');
const adminsList = ref<AdminUser[]>([]);
const permissionsList = ref<Permission[]>([]);
const isLoadingAdmins = ref(false);
const isLoadingPerms = ref(false);

const adminSearch = ref('');
const adminDateFrom = ref('');
const adminDateTo = ref('');

const displayedAdmins = computed(() => {
  let list = adminsList.value;
  if (adminSearch.value.trim()) {
    const q = adminSearch.value.trim().toLowerCase();
    list = list.filter(
      (a) =>
        (a.fullName && a.fullName.toLowerCase().includes(q)) ||
        (a.username && a.username.toLowerCase().includes(q))
    );
  }
  if (adminDateFrom.value) {
    const from = new Date(adminDateFrom.value);
    from.setHours(0, 0, 0, 0);
    list = list.filter((a) => {
      if (!a.createdAt) return false;
      return new Date(a.createdAt) >= from;
    });
  }
  if (adminDateTo.value) {
    const to = new Date(adminDateTo.value);
    to.setHours(23, 59, 59, 999);
    list = list.filter((a) => {
      if (!a.createdAt) return false;
      return new Date(a.createdAt) <= to;
    });
  }
  return list;
});

// Create Admin modal
const isCreateAdminModalOpen = ref(false);
const isSubmittingAdmin = ref(false);
const newAdminUsername = ref('');
const newAdminPassword = ref('');
const newAdminFullName = ref('');
const newAdminType = ref<AdminType>('ADMIN');
const selectedPermissions = ref<string[]>([]);

// Edit Admin modal
const isEditAdminModalOpen = ref(false);
const isSubmittingEditAdmin = ref(false);
const editingAdminId = ref<string | null>(null);
const editAdminFullName = ref('');
const editAdminUsername = ref('');
const editAdminPassword = ref('');
const editAdminIsActive = ref<'true' | 'false'>('true');
const editSelectedPermissions = ref<string[]>([]);

// Delete Admin dialog
const isDeleteModalOpen = ref(false);
const isDeletingAdmin = ref(false);
const adminToDelete = ref<AdminUser | null>(null);

// Create Permission modal
const isCreatePermModalOpen = ref(false);
const isSubmittingPerm = ref(false);
const permName = ref('');
const permKey = ref('');
const permModule = ref('');
const permDesc = ref('');

async function loadAdmins() {
  isLoadingAdmins.value = true;
  try {
    const res = await adminsApi.getAdmins();
    if (res.success) {
      adminsList.value = res.data;
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری فهرست مدیران'));
  } finally {
    isLoadingAdmins.value = false;
  }
}

async function loadPermissions() {
  isLoadingPerms.value = true;
  try {
    const res = await adminsApi.getPermissions();
    if (res.success) {
      permissionsList.value = res.data;
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در بارگذاری دسترسی‌ها'));
  } finally {
    isLoadingPerms.value = false;
  }
}

function openCreateAdminModal() {
  newAdminUsername.value = '';
  newAdminPassword.value = '';
  newAdminFullName.value = '';
  newAdminType.value = 'ADMIN';
  selectedPermissions.value = [];
  isCreateAdminModalOpen.value = true;
}

function togglePermission(key: string) {
  const idx = selectedPermissions.value.indexOf(key);
  if (idx !== -1) {
    selectedPermissions.value.splice(idx, 1);
  } else {
    selectedPermissions.value.push(key);
  }
}

async function handleCreateAdmin() {
  if (!newAdminUsername.value.trim() || !newAdminPassword.value.trim()) {
    notificationStore.warning('نام کاربری و کلمه عبور الزامی است.');
    return;
  }

  isSubmittingAdmin.value = true;
  try {
    const payload: CreateAdminInput = {
      username: newAdminUsername.value.trim(),
      password: newAdminPassword.value.trim(),
      fullName: newAdminFullName.value.trim() || undefined,
      type: newAdminType.value,
      permissions: newAdminType.value === 'SUPERADMIN' ? [] : selectedPermissions.value,
    };

    const res = await adminsApi.createAdmin(payload);
    if (res.success) {
      notificationStore.success('حساب مدیر جدید با موفقیت ایجاد شد.');
      isCreateAdminModalOpen.value = false;
      loadAdmins();
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ایجاد حساب مدیر'));
  } finally {
    isSubmittingAdmin.value = false;
  }
}

function openEditAdminModal(admin: AdminUser) {
  editingAdminId.value = admin._id || admin.id;
  editAdminFullName.value = admin.fullName || '';
  editAdminUsername.value = admin.username || '';
  editAdminPassword.value = '';
  editAdminIsActive.value = admin.isActive !== false ? 'true' : 'false';

  if (Array.isArray(admin.permissions)) {
    editSelectedPermissions.value = admin.permissions
      .map((p: any) => (typeof p === 'object' && p !== null ? (p._id || p.id || '') : String(p)))
      .filter(Boolean);
  } else {
    editSelectedPermissions.value = [];
  }

  isEditAdminModalOpen.value = true;
}

function toggleEditPermission(id: string) {
  const idx = editSelectedPermissions.value.indexOf(id);
  if (idx !== -1) {
    editSelectedPermissions.value.splice(idx, 1);
  } else {
    editSelectedPermissions.value.push(id);
  }
}

async function handleUpdateAdmin() {
  if (!editingAdminId.value) return;

  if (!editAdminUsername.value.trim()) {
    notificationStore.warning('نام کاربری الزامی است.');
    return;
  }

  isSubmittingEditAdmin.value = true;
  try {
    const payload: UpdateAdminInput = {
      username: editAdminUsername.value.trim(),
      fullName: editAdminFullName.value.trim() || undefined,
      isActive: editAdminIsActive.value === 'true',
      permissions: editSelectedPermissions.value,
    };

    if (editAdminPassword.value.trim()) {
      payload.password = editAdminPassword.value.trim();
    }

    const res = await adminsApi.updateAdmin(editingAdminId.value, payload);
    if (res.success) {
      notificationStore.success('حساب مدیر با موفقیت به‌روزرسانی شد.');
      isEditAdminModalOpen.value = false;
      await loadAdmins();

      if (editingAdminId.value === authStore.user?.id || editingAdminId.value === authStore.user?._id) {
        authStore.fetchProfile();
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ویرایش حساب مدیر'));
  } finally {
    isSubmittingEditAdmin.value = false;
  }
}

function promptDeleteAdmin(admin: AdminUser) {
  if (admin.type === 'SUPERADMIN') {
    notificationStore.warning('امکان حذف حساب مدیر ارشد (Superadmin) وجود ندارد.');
    return;
  }
  adminToDelete.value = admin;
  isDeleteModalOpen.value = true;
}

async function handleDeleteAdmin() {
  if (!adminToDelete.value) return;
  const adminId = adminToDelete.value._id || adminToDelete.value.id;
  if (!adminId) return;

  isDeletingAdmin.value = true;
  try {
    const res = await adminsApi.deleteAdmin(adminId);
    if (res.success) {
      notificationStore.success('حساب مدیر با موفقیت حذف گردید.');
      isDeleteModalOpen.value = false;
      adminToDelete.value = null;
      await loadAdmins();
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در حذف حساب مدیر'));
  } finally {
    isDeletingAdmin.value = false;
  }
}

async function handleCreatePermission() {
  if (!permName.value.trim() || !permKey.value.trim()) {
    notificationStore.warning('عنوان و کلید مجوز الزامی است.');
    return;
  }

  isSubmittingPerm.value = true;
  try {
    const res = await adminsApi.createPermission({
      name: permName.value.trim(),
      key: permKey.value.trim(),
      module: permModule.value.trim() || undefined,
      description: permDesc.value.trim() || undefined,
    });

    if (res.success) {
      notificationStore.success('مجوز جدید ثبت گردید.');
      isCreatePermModalOpen.value = false;
      loadPermissions();
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ثبت مجوز'));
  } finally {
    isSubmittingPerm.value = false;
  }
}

onMounted(() => {
  if (!authStore.isSuperAdmin) {
    router.replace('/admin/dashboard');
    return;
  }
  loadAdmins();
  loadPermissions();
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Title & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          مدیریت مدیران و سطوح دسترسی
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          کنترل حساب‌های مدیر ارشد (Superadmin)، مدیران عادی و ماتریس مجوزهای سامانه
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          title="تازه‌سازی"
          @click="loadAdmins(); loadPermissions();"
        >
          <RefreshCw class="w-4 h-4 ml-1" />
          تازه‌سازی
        </Button>

        <Button
          v-if="activeTab === 'admins' && authStore.isSuperAdmin"
          variant="primary"
          size="sm"
          @click="openCreateAdminModal"
        >
          <Plus class="w-4 h-4 ml-1" />
          افزودن مدیر جدید
        </Button>

        <Button
          v-else-if="activeTab === 'permissions' && authStore.isSuperAdmin"
          variant="primary"
          size="sm"
          @click="isCreatePermModalOpen = true"
        >
          <Plus class="w-4 h-4 ml-1" />
          افزودن مجوز جدید
        </Button>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
      <button
        type="button"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
          activeTab === 'admins'
            ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/30'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        ]"
        @click="activeTab = 'admins'"
      >
        <Users class="w-4 h-4" />
        حساب‌های مدیران
      </button>

      <button
        type="button"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
          activeTab === 'permissions'
            ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/30'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        ]"
        @click="activeTab = 'permissions'"
      >
        <Key class="w-4 h-4" />
        ماتریس مجوزهای دسترسی
      </button>
    </div>

    <!-- Tab 1: Admins List Table -->
    <div v-if="activeTab === 'admins'" class="space-y-4">
      <!-- Filter Bar for Admins -->
      <div
        class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <Input
            v-model="adminSearch"
            placeholder="جستجوی نام یا نام کاربری مدیر..."
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </Input>

          <DatePicker
            v-model="adminDateFrom"
            placeholder="از تاریخ ثبت..."
          />

          <DatePicker
            v-model="adminDateTo"
            placeholder="تا تاریخ ثبت..."
          />
        </div>
      </div>

      <div
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th class="py-3.5 px-4">نام و نام خانوادگی</th>
                <th class="py-3.5 px-4">نام کاربری / ایمیل</th>
                <th class="py-3.5 px-4">سطح دسترسی</th>
                <th class="py-3.5 px-4">تعداد مجوزها</th>
                <th class="py-3.5 px-4">وضعیت</th>
                <th class="py-3.5 px-4">تاریخ ثبت</th>
                <th v-if="authStore.isSuperAdmin" class="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
              <template v-if="isLoadingAdmins">
                <tr v-for="i in 3" :key="i">
                  <td :colspan="authStore.isSuperAdmin ? 7 : 6" class="py-4 px-4">
                    <Skeleton height="h-6" />
                  </td>
                </tr>
              </template>

              <template v-else-if="displayedAdmins.length === 0">
                <tr>
                  <td :colspan="authStore.isSuperAdmin ? 7 : 6">
                    <EmptyState
                      title="هیچ حسابی یافت نشد"
                      description="برای ایجاد مدیر جدید از دکمه بالا استفاده کنید."
                      :icon="Shield"
                    />
                  </td>
                </tr>
              </template>

              <tr
                v-for="admin in displayedAdmins"
                v-else
                :key="admin._id || admin.id"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <!-- Name & Avatar -->
                <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      {{ admin.fullName ? admin.fullName[0] : 'م' }}
                    </div>
                    <div class="truncate">
                      <span>{{ admin.fullName || 'کاربر مدیر' }}</span>
                      <span v-if="admin.username === authStore.user?.username" class="mr-1.5 text-[10px] text-brand-600 dark:text-brand-400 font-bold">
                        (حساب جاری شما)
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Username -->
                <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium font-mono text-left" dir="ltr">
                  {{ admin.username }}
                </td>

                <!-- Role / Type -->
                <td class="py-3.5 px-4">
                  <Badge :variant="admin.type === 'SUPERADMIN' ? 'brand' : 'default'">
                    {{ admin.type === 'SUPERADMIN' ? 'مدیر ارشد (Superadmin)' : 'مدیر عادی (Admin)' }}
                  </Badge>
                </td>

                <!-- Permissions count -->
                <td class="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                  <span v-if="admin.type === 'SUPERADMIN'" class="text-emerald-600 dark:text-emerald-400 font-bold">
                    دسترسی کامل (نامحدود)
                  </span>
                  <span v-else>
                    {{ Array.isArray(admin.permissions) ? admin.permissions.length : 0 }} مجوز
                  </span>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4">
                  <span
                    v-if="admin.isActive !== false"
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    فعال
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    غیرفعال
                  </span>
                </td>

                <!-- Created At -->
                <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                  {{ formatPersianDate(admin.createdAt) }}
                </td>

                <!-- Actions (Superadmin Only) -->
                <td v-if="authStore.isSuperAdmin" class="py-3.5 px-4 text-center">
                  <!-- For Regular Admins: Edit and Delete buttons -->
                  <div v-if="admin.type !== 'SUPERADMIN'" class="flex items-center justify-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      class="text-xs h-7.5 px-2.5 font-medium hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
                      title="ویرایش حساب مدیر"
                      @click="openEditAdminModal(admin)"
                    >
                      <Edit class="w-3.5 h-3.5 ml-1 text-slate-500 dark:text-slate-400" />
                      ویرایش
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      class="text-xs h-7.5 px-2.5 font-medium"
                      title="حذف حساب مدیر"
                      @click="promptDeleteAdmin(admin)"
                    >
                      <Trash2 class="w-3.5 h-3.5 ml-1" />
                      حذف
                    </Button>
                  </div>

                  <!-- For Superadmin: Non-editable indicator -->
                  <span
                    v-else
                    class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 select-none py-1"
                    title="حساب مدیر ارشد غیرقابل ویرایش یا حذف است"
                  >
                    <ShieldCheck class="w-3.5 h-3.5 text-brand-500/70" />
                    غیرقابل تغییر
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 2: Permissions Matrix -->
    <div
      v-else
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <th class="py-3.5 px-4">عنوان مجوز</th>
              <th class="py-3.5 px-4">کلید دسترسی (Permission Key)</th>
              <th class="py-3.5 px-4">ماژول مربوطه</th>
              <th class="py-3.5 px-4">شرح کاربرد</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
            <template v-if="isLoadingPerms">
              <tr v-for="i in 4" :key="i">
                <td colspan="4" class="py-4 px-4">
                  <Skeleton height="h-6" />
                </td>
              </tr>
            </template>

            <tr
              v-for="perm in permissionsList"
              v-else
              :key="perm._id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck class="w-4 h-4 text-brand-600 shrink-0" />
                {{ perm.name }}
              </td>

              <td class="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400" dir="ltr">
                <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                  {{ perm.key }}
                </span>
              </td>

              <td class="py-3.5 px-4">
                <Badge variant="blue">
                  {{ perm.module || 'سیستم' }}
                </Badge>
              </td>

              <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                {{ perm.description || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Admin Modal -->
    <Modal
      :open="isCreateAdminModalOpen"
      title="ایجاد حساب کاربری مدیر جدید"
      subtitle="تعیین شناسه، نوع کاربری و مجوزهای دسترسی"
      size="xl"
      @close="isCreateAdminModalOpen = false"
    >
      <form class="space-y-4 text-right" @submit.prevent="handleCreateAdmin">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            v-model="newAdminFullName"
            label="نام و نام خانوادگی"
            placeholder="نام و نام خانوادگی را وارد نمایید"
          />

          <Select
            v-model="newAdminType"
            label="سطح حساب"
            :options="[
              { label: 'مدیر عادی (ADMIN)', value: 'ADMIN' },
              { label: 'مدیر ارشد (SUPERADMIN)', value: 'SUPERADMIN' },
            ]"
            required
          />

          <Input
            v-model="newAdminUsername"
            label="نام کاربری / ایمیل"
            placeholder="نام کاربری یا ایمیل را وارد نمایید"
            dir="ltr"
            required
          />

          <Input
            v-model="newAdminPassword"
            type="password"
            label="رمز عبور"
            placeholder="رمز عبور را وارد نمایید"
            dir="ltr"
            required
          />
        </div>

        <!-- Permissions selector if ADMIN -->
        <div v-if="newAdminType === 'ADMIN'" class="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
              انتخاب مجوزهای دسترسی این مدیر ({{ selectedPermissions.length }} مجوز انتخاب شده):
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-[11px] text-brand-600 dark:text-brand-400 hover:underline cursor-pointer font-medium"
                @click="selectedPermissions = permissionsList.map((p) => p._id)"
              >
                انتخاب همه
              </button>
              <span class="text-slate-300 dark:text-slate-700">&bull;</span>
              <button
                type="button"
                class="text-[11px] text-slate-500 hover:underline cursor-pointer font-medium"
                @click="selectedPermissions = []"
              >
                لغو همه
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
            <div
              v-for="perm in permissionsList"
              :key="perm._id"
              :class="[
                'p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-colors',
                selectedPermissions.includes(perm._id)
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300',
              ]"
              @click="togglePermission(perm._id)"
            >
              <div>
                <span class="font-bold block">{{ perm.name }}</span>
                <span class="text-[10px] text-slate-400" dir="ltr">{{ perm.key }}</span>
              </div>
              <input
                type="checkbox"
                :checked="selectedPermissions.includes(perm._id)"
                class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <Button variant="outline" size="md" :disabled="isSubmittingAdmin" @click="isCreateAdminModalOpen = false">
          انصراف
        </Button>
        <Button variant="primary" size="md" :loading="isSubmittingAdmin" @click="handleCreateAdmin">
          ایجاد حساب مدیر
        </Button>
      </template>
    </Modal>

    <!-- Edit Admin Modal -->
    <Modal
      :open="isEditAdminModalOpen"
      title="ویرایش حساب کاربری مدیر"
      subtitle="ویرایش مشخصات فردی، وضعیت و مجوزهای دسترسی"
      size="xl"
      @close="isEditAdminModalOpen = false"
    >
      <form class="space-y-4 text-right" @submit.prevent="handleUpdateAdmin">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            v-model="editAdminFullName"
            label="نام و نام خانوادگی"
            placeholder="نام و نام خانوادگی را وارد نمایید"
          />

          <Select
            v-model="editAdminIsActive"
            label="وضعیت حساب"
            :options="[
              { label: 'فعال', value: 'true' },
              { label: 'غیرفعال', value: 'false' },
            ]"
            required
          />

          <Input
            v-model="editAdminUsername"
            label="نام کاربری / ایمیل"
            placeholder="نام کاربری یا ایمیل را وارد نمایید"
            dir="ltr"
            required
          />

          <Input
            v-model="editAdminPassword"
            type="password"
            label="رمز عبور جدید (اختیاری)"
            placeholder="در صورت عدم تمایل به تغییر، خالی بگذارید"
            hint="تنها در صورتی که می‌خواهید رمز را تغییر دهید پر کنید."
            dir="ltr"
          />
        </div>

        <!-- Permissions selector for edited Admin -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
              انتخاب مجوزهای دسترسی این مدیر ({{ editSelectedPermissions.length }} مجوز انتخاب شده):
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-[11px] text-brand-600 dark:text-brand-400 hover:underline cursor-pointer font-medium"
                @click="editSelectedPermissions = permissionsList.map((p) => p._id)"
              >
                انتخاب همه
              </button>
              <span class="text-slate-300 dark:text-slate-700">&bull;</span>
              <button
                type="button"
                class="text-[11px] text-slate-500 hover:underline cursor-pointer font-medium"
                @click="editSelectedPermissions = []"
              >
                لغو همه
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
            <div
              v-for="perm in permissionsList"
              :key="perm._id"
              :class="[
                'p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-colors',
                editSelectedPermissions.includes(perm._id)
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300',
              ]"
              @click="toggleEditPermission(perm._id)"
            >
              <div>
                <span class="font-bold block">{{ perm.name }}</span>
                <span class="text-[10px] text-slate-400" dir="ltr">{{ perm.key }}</span>
              </div>
              <input
                type="checkbox"
                :checked="editSelectedPermissions.includes(perm._id)"
                class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <Button
          variant="outline"
          size="md"
          :disabled="isSubmittingEditAdmin"
          @click="isEditAdminModalOpen = false"
        >
          انصراف
        </Button>
        <Button
          variant="primary"
          size="md"
          :loading="isSubmittingEditAdmin"
          @click="handleUpdateAdmin"
        >
          ذخیره تغییرات
        </Button>
      </template>
    </Modal>

    <!-- Delete Admin Confirmation Dialog -->
    <ConfirmDialog
      :open="isDeleteModalOpen"
      title="حذف حساب کاربری مدیر"
      :description="adminToDelete ? `آیا از حذف حساب کاربری «${adminToDelete.fullName || adminToDelete.username}» اطمینان دارید؟ دسترسی این کاربر به سامانه به‌طور کامل لغو خواهد شد و این عملیات قابل بازگشت نیست.` : ''"
      confirm-text="حذف قطعی حساب"
      cancel-text="انصراف"
      variant="danger"
      :loading="isDeletingAdmin"
      @confirm="handleDeleteAdmin"
      @cancel="isDeleteModalOpen = false"
    />

    <!-- Create Permission Modal -->
    <Modal
      :open="isCreatePermModalOpen"
      title="ثبت مجوز جدید در سیستم"
      subtitle="تعریف دسترسی ساخت‌یافته ماژول‌ها"
      size="md"
      @close="isCreatePermModalOpen = false"
    >
      <form class="space-y-4 text-right" @submit.prevent="handleCreatePermission">
        <Input
          v-model="permName"
          label="عنوان فارسی مجوز"
          placeholder="عنوان فارسی مجوز را وارد نمایید"
          required
        />

        <Input
          v-model="permKey"
          label="کلید انگلیسی دسترسی (Key)"
          placeholder="شناسه کلید دسترسی (انگلیسی)"
          dir="ltr"
          required
        />

        <Input
          v-model="permModule"
          label="نام ماژول"
          placeholder="نام ماژول مربوطه"
          dir="ltr"
        />

        <Input
          v-model="permDesc"
          label="توضیحات دسترسی"
          placeholder="توضیحات دسترسی را وارد نمایید"
        />
      </form>

      <template #footer>
        <Button variant="outline" size="md" :disabled="isSubmittingPerm" @click="isCreatePermModalOpen = false">
          انصراف
        </Button>
        <Button variant="primary" size="md" :loading="isSubmittingPerm" @click="handleCreatePermission">
          ثبت مجوز
        </Button>
      </template>
    </Modal>
  </div>
</template>
