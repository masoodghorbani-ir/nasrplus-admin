<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminsApi } from '@/api';
import { useNotificationStore, useAuthStore, useLookupsStore } from '@/stores';
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
  History,
  Layers,
  AlertCircle,
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
  TableActions,
  type ActionItem,
} from '@/components/ui';
import { formatPersianDate } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errors';
import LoginLogsView from './LoginLogsView.vue';

const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();
const lookupsStore = useLookupsStore();

const activeTab = ref<'admins' | 'permissions' | 'logs'>('admins');
const adminsList = ref<AdminUser[]>([]);
const permissionsList = ref<Permission[]>([]);
const isLoadingAdmins = ref(false);
const isLoadingPerms = ref(false);

const adminSearch = ref('');
const adminRoleFilter = ref<string>('');
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
  if (adminRoleFilter.value) {
    list = list.filter((a) => a.type === adminRoleFilter.value);
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
const selectedSpecializations = ref<string[]>([]);
const newAdminIsActive = ref(true);

// Edit Admin modal
const isEditAdminModalOpen = ref(false);
const isSubmittingEditAdmin = ref(false);
const editingAdminId = ref<string | null>(null);
const editAdminFullName = ref('');
const editAdminUsername = ref('');
const editAdminPassword = ref('');
const editAdminType = ref<AdminType>('ADMIN');
const editAdminIsActive = ref<'true' | 'false'>('true');
const editSelectedSpecializations = ref<string[]>([]);

// Standalone Permissions Modal
const isPermissionsModalOpen = ref(false);
const isSavingPermissions = ref(false);
const adminForPermissions = ref<AdminUser | null>(null);
const managingPermissionIds = ref<string[]>([]);

// Standalone Login Logs Modal
const isUserLogsModalOpen = ref(false);
const selectedAdminForLogs = ref<AdminUser | null>(null);

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

const roleOptions = [
  { label: 'مدیر سامانه (ADMIN)', value: 'ADMIN' },
  { label: 'کارشناس بررسی پرونده‌ها (EXPERT)', value: 'EXPERT' },
];

const filterRoleOptions = [
  { label: 'همه نقش‌ها', value: '' },
  { label: 'مدیر ارشد (SUPERADMIN)', value: 'SUPERADMIN' },
  { label: 'مدیر سامانه (ADMIN)', value: 'ADMIN' },
  { label: 'کارشناس بررسی (EXPERT)', value: 'EXPERT' },
];

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
  selectedSpecializations.value = [];
  newAdminIsActive.value = true;
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

function toggleSpecialization(id: string) {
  const idx = selectedSpecializations.value.indexOf(id);
  if (idx !== -1) {
    selectedSpecializations.value.splice(idx, 1);
  } else {
    selectedSpecializations.value.push(id);
  }
}

function toggleEditSpecialization(id: string) {
  const idx = editSelectedSpecializations.value.indexOf(id);
  if (idx !== -1) {
    editSelectedSpecializations.value.splice(idx, 1);
  } else {
    editSelectedSpecializations.value.push(id);
  }
}

function toggleManagingPermission(id: string) {
  const idx = managingPermissionIds.value.indexOf(id);
  if (idx !== -1) {
    managingPermissionIds.value.splice(idx, 1);
  } else {
    managingPermissionIds.value.push(id);
  }
}

async function handleCreateAdmin() {
  if (!newAdminUsername.value.trim() || !newAdminPassword.value.trim()) {
    notificationStore.warning('نام کاربری و کلمه عبور الزامی است.');
    return;
  }

  if (newAdminPassword.value.trim().length < 6) {
    notificationStore.warning('رمز عبور باید حداقل ۶ کاراکتر باشد.');
    return;
  }

  if (newAdminType.value === 'EXPERT') {
    if (!selectedSpecializations.value || selectedSpecializations.value.length === 0) {
      notificationStore.warning('انتخاب حداقل یک رسته تخصصی برای کارشناس الزامی است.');
      return;
    }
  }

  isSubmittingAdmin.value = true;
  try {
    const cleanSpecializations = selectedSpecializations.value
      .map((s) => String(s).trim())
      .filter((s) => /^[0-9a-fA-F]{24}$/.test(s));

    const cleanPermissions = selectedPermissions.value
      .map((p) => String(p).trim())
      .filter((p) => /^[0-9a-fA-F]{24}$/.test(p));

    const payload: CreateAdminInput = {
      username: newAdminUsername.value.trim(),
      password: newAdminPassword.value.trim(),
      fullName: newAdminFullName.value.trim() || undefined,
      type: newAdminType.value,
      isActive: Boolean(newAdminIsActive.value),
      permissions: newAdminType.value === 'ADMIN' ? cleanPermissions : [],
      reviewableSpecializations: newAdminType.value === 'EXPERT' ? cleanSpecializations : [],
    };

    const res = await adminsApi.createAdmin(payload);
    if (res.success) {
      notificationStore.success(
        newAdminType.value === 'EXPERT'
          ? 'حساب کارشناس جدید با موفقیت ایجاد و رسته‌های تخصصی انتساب یافت.'
          : 'حساب مدیر جدید با موفقیت ایجاد شد.'
      );
      isCreateAdminModalOpen.value = false;
      loadAdmins();
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ایجاد حساب کاربر'));
  } finally {
    isSubmittingAdmin.value = false;
  }
}

function openEditAdminModal(admin: AdminUser) {
  editingAdminId.value = admin._id || admin.id || null;
  editAdminFullName.value = admin.fullName || '';
  editAdminUsername.value = admin.username || '';
  editAdminPassword.value = '';
  editAdminType.value = admin.type;
  editAdminIsActive.value = admin.isActive !== false ? 'true' : 'false';

  if (admin.type === 'EXPERT' && Array.isArray(admin.reviewableSpecializations)) {
    editSelectedSpecializations.value = admin.reviewableSpecializations
      .map((s: any) => (typeof s === 'object' && s !== null ? (s._id || s.id || '') : String(s)))
      .filter((s) => Boolean(s) && /^[0-9a-fA-F]{24}$/.test(String(s).trim()));
  } else {
    editSelectedSpecializations.value = [];
  }

  isEditAdminModalOpen.value = true;
}

async function handleUpdateAdmin() {
  if (!editingAdminId.value) return;

  if (!editAdminUsername.value.trim()) {
    notificationStore.warning('نام کاربری الزامی است.');
    return;
  }

  if (editAdminType.value === 'EXPERT') {
    if (!editSelectedSpecializations.value || editSelectedSpecializations.value.length === 0) {
      notificationStore.warning('انتخاب حداقل یک رسته تخصصی برای کارشناس الزامی است.');
      return;
    }
  }

  if (editAdminPassword.value.trim() && editAdminPassword.value.trim().length < 6) {
    notificationStore.warning('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
    return;
  }

  isSubmittingEditAdmin.value = true;
  try {
    const cleanSpecializations = editSelectedSpecializations.value
      .map((s) => String(s).trim())
      .filter((s) => /^[0-9a-fA-F]{24}$/.test(s));

    const payload: UpdateAdminInput = {
      username: editAdminUsername.value.trim(),
      fullName: editAdminFullName.value.trim() || undefined,
      type: editAdminType.value,
      isActive: editAdminIsActive.value === 'true',
      reviewableSpecializations: editAdminType.value === 'EXPERT' ? cleanSpecializations : [],
    };

    if (editAdminPassword.value.trim()) {
      payload.password = editAdminPassword.value.trim();
    }

    const res = await adminsApi.updateAdmin(editingAdminId.value, payload);
    if (res.success) {
      notificationStore.success('مشخصات حساب کاربری با موفقیت به‌روزرسانی شد.');
      isEditAdminModalOpen.value = false;
      await loadAdmins();

      if (editingAdminId.value === authStore.user?.id || editingAdminId.value === authStore.user?._id) {
        authStore.fetchProfile();
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ویرایش حساب کاربر'));
  } finally {
    isSubmittingEditAdmin.value = false;
  }
}

// Open Permissions Modal for Admin
function openPermissionsModal(admin: AdminUser) {
  adminForPermissions.value = admin;
  if (Array.isArray(admin.permissions)) {
    managingPermissionIds.value = admin.permissions
      .map((p: any) => (typeof p === 'object' && p !== null ? (p._id || p.id || '') : String(p)))
      .filter(Boolean);
  } else {
    managingPermissionIds.value = [];
  }
  isPermissionsModalOpen.value = true;
}

async function handleSavePermissions() {
  if (!adminForPermissions.value) return;
  const adminId = adminForPermissions.value._id || adminForPermissions.value.id;
  if (!adminId) return;

  isSavingPermissions.value = true;
  try {
    const res = await adminsApi.assignPermissions(adminId, {
      permissionIds: managingPermissionIds.value,
    });
    if (res.success) {
      notificationStore.success('مجوزهای دسترسی این مدیر با موفقیت ذخیره گردید.');
      isPermissionsModalOpen.value = false;
      await loadAdmins();

      if (adminId === authStore.user?.id || adminId === authStore.user?._id) {
        authStore.fetchProfile();
      }
    }
  } catch (err) {
    notificationStore.error(extractErrorMessage(err, 'خطا در ثبت مجوزهای مدیر'));
  } finally {
    isSavingPermissions.value = false;
  }
}

// Open Login Logs Modal
function openUserLogsModal(admin: AdminUser) {
  selectedAdminForLogs.value = admin;
  isUserLogsModalOpen.value = true;
}

function promptDeleteAdmin(admin: AdminUser) {
  if (admin.type === 'SUPERADMIN') {
    notificationStore.warning('امکان حذف حساب مدیر ارشد سامانه (Superadmin) وجود ندارد.');
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
      notificationStore.success('حساب کاربر با موفقیت حذف گردید.');
      isDeleteModalOpen.value = false;
      adminToDelete.value = null;
      await loadAdmins();
    }
  } catch (err: any) {
    // Contract section 4: Referential integrity check
    const message = extractErrorMessage(
      err,
      'این حساب کاربری دارای سابقه لاگ ورود یا عملیات کارشناسی در سامانه است و امکان حذف آن وجود ندارد. پیشنهاد می‌شود به جای حذف، حساب را غیرفعال فرمایید.'
    );
    notificationStore.error(message);
  } finally {
    isDeletingAdmin.value = false;
  }
}

function getAdminActionItems(admin: AdminUser): ActionItem[] {
  const items: ActionItem[] = [];
  if (admin.type === 'ADMIN') {
    items.push({
      label: 'مجوزهای دسترسی',
      icon: Key,
      onClick: () => openPermissionsModal(admin),
    });
  }
  items.push({
    label: 'تاریخچه ورود به سیستم',
    icon: History,
    onClick: () => openUserLogsModal(admin),
  });
  items.push({
    label: 'حذف حساب کاربر',
    icon: Trash2,
    danger: true,
    divider: true,
    onClick: () => promptDeleteAdmin(admin),
  });
  return items;
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

function getSpecializationTitles(admin: AdminUser): string[] {
  if (!admin.reviewableSpecializations || !Array.isArray(admin.reviewableSpecializations)) {
    return [];
  }
  return admin.reviewableSpecializations.map((item: any) => {
    if (typeof item === 'object' && item !== null && item.title) {
      return item.title;
    }
    const found = lookupsStore.specializations.find((s) => s._id === String(item));
    return found?.title || String(item);
  });
}

onMounted(async () => {
  if (!authStore.isSuperAdmin) {
    router.replace('/admin/dashboard');
    return;
  }
  await Promise.allSettled([
    loadAdmins(),
    loadPermissions(),
    lookupsStore.fetchAllLookups(),
  ]);
});
</script>

<template>
  <div class="space-y-6 text-right select-none" dir="rtl">
    <!-- Header Title & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>مدیریت مدیران و کارشناسان</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
            مدیریت امنیتی
          </span>
        </h1>
        <p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          کنترل حساب‌های مدیر ارشد (Superadmin)، مدیران سامانه، کارشناسان بررسی پرونده و ره‌گیری دسترسی‌ها
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
          افزودن مدیر یا کارشناس جدید
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
        حساب‌های مدیران و کارشناسان
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

      <button
        type="button"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
          activeTab === 'logs'
            ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/30'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        ]"
        @click="activeTab = 'logs'"
      >
        <History class="w-4 h-4" />
        لاگ‌های ورود به سیستم
      </button>
    </div>

    <!-- TAB 1: Admins and Experts List Table -->
    <div v-if="activeTab === 'admins'" class="space-y-4">
      <!-- Filter Bar for Admins -->
      <div
        class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
      >
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <Input
            v-model="adminSearch"
            placeholder="جستجوی نام یا نام کاربری..."
          >
            <template #prefix>
              <Search class="w-4 h-4 text-slate-400" />
            </template>
          </Input>

          <Select
            v-model="adminRoleFilter"
            :options="filterRoleOptions"
            placeholder="فیلتر بر اساس نقش..."
          />

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
                <th class="py-3.5 px-4">نوع حساب</th>
                <th class="py-3.5 px-4">رسته‌های تخصصی قابل بررسی</th>
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
                  <td :colspan="authStore.isSuperAdmin ? 7 : 6" class="py-12">
                    <EmptyState
                      title="هیچ حسابی یافت نشد"
                      description="برای ایجاد مدیر یا کارشناس جدید از دکمه بالا استفاده کنید."
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
                <!-- 1. Full Name & Avatar -->
                <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                  <div class="flex items-center gap-2.5">
                    <div
                      :class="[
                        'w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 shadow-xs text-white',
                        admin.type === 'SUPERADMIN'
                          ? 'bg-purple-600'
                          : admin.type === 'EXPERT'
                            ? 'bg-emerald-600'
                            : 'bg-brand-600'
                      ]"
                    >
                      {{ admin.fullName ? admin.fullName[0] : 'م' }}
                    </div>
                    <div class="truncate">
                      <span>{{ admin.fullName || 'کاربر سیستم' }}</span>
                      <span v-if="admin.username === authStore.user?.username" class="mr-1.5 text-[10px] text-brand-600 dark:text-brand-400 font-bold">
                        (حساب جاری شما)
                      </span>
                    </div>
                  </div>
                </td>

                <!-- 2. Username -->
                <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium font-mono text-left" dir="ltr">
                  {{ admin.username }}
                </td>

                <!-- 3. Role / Type Badge -->
                <td class="py-3.5 px-4">
                  <!-- SUPERADMIN: Purple / Brand -->
                  <Badge v-if="admin.type === 'SUPERADMIN'" variant="purple">
                    مدیر ارشد سامانه
                  </Badge>
                  <!-- ADMIN: Blue -->
                  <Badge v-else-if="admin.type === 'ADMIN'" variant="blue">
                    مدیر سامانه
                  </Badge>
                  <!-- EXPERT: Emerald / Green -->
                  <Badge v-else-if="admin.type === 'EXPERT'" variant="emerald">
                    کارشناس بررسی پرونده
                  </Badge>
                </td>

                <!-- 4. Assigned Specializations (رسته‌های تخصصی قابل بررسی) -->
                <td class="py-3.5 px-4">
                  <!-- For EXPERT: display badge tags -->
                  <div v-if="admin.type === 'EXPERT'" class="flex flex-wrap gap-1 max-w-xs">
                    <template v-if="getSpecializationTitles(admin).length > 0">
                      <span
                        v-for="(title, idx) in getSpecializationTitles(admin)"
                        :key="idx"
                        class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                      >
                        {{ title }}
                      </span>
                    </template>
                    <span v-else class="text-rose-500 font-bold text-[11px] flex items-center gap-1">
                      <AlertCircle class="w-3.5 h-3.5" />
                      فاقد رسته انتسابی!
                    </span>
                  </div>

                  <!-- For SUPERADMIN and ADMIN: General unrestricted access -->
                  <div v-else class="text-slate-400 text-xs">
                    <span v-if="admin.type === 'SUPERADMIN'" class="text-purple-600 dark:text-purple-400 font-bold">
                      تمام رسته‌ها (دسترسی عمومی)
                    </span>
                    <span v-else class="text-slate-500 dark:text-slate-400">
                      —
                    </span>
                  </div>
                </td>

                <!-- 5. Status Toggle / Badge -->
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

                <!-- 6. Created At -->
                <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {{ formatPersianDate(admin.createdAt) }}
                </td>

                <!-- 7. Actions (Superadmin Only) -->
                <td v-if="authStore.isSuperAdmin" class="py-3.5 px-4 text-center whitespace-nowrap">
                  <!-- For Regular Admins & Experts -->
                  <div v-if="admin.type !== 'SUPERADMIN'" class="flex items-center justify-center">
                    <TableActions
                      primary-label="ویرایش"
                      :primary-icon="Edit"
                      primary-title="ویرایش مشخصات"
                      primary-variant="outline"
                      @primary="openEditAdminModal(admin)"
                      :items="getAdminActionItems(admin)"
                    />
                  </div>

                  <!-- For Superadmin: Non-editable indicator -->
                  <div v-else class="flex items-center justify-center gap-1.5">
                    <TableActions
                      primary-label="لاگ‌ها"
                      :primary-icon="History"
                      primary-title="مشاهده تاریخچه ورود مدیر ارشد"
                      primary-variant="outline"
                      @primary="openUserLogsModal(admin)"
                    />

                    <span
                      class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 select-none py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                      title="حساب مدیر ارشد سامانه غیرقابل ویرایش یا حذف است"
                    >
                      <ShieldCheck class="w-3.5 h-3.5 text-purple-500" />
                      حفاظت‌شده
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: Permissions Matrix -->
    <div
      v-else-if="activeTab === 'permissions'"
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

    <!-- TAB 3: System-wide Login Audit Logs -->
    <div v-else-if="activeTab === 'logs'">
      <LoginLogsView :embedded="true" />
    </div>

    <!-- ==================== MODALS ==================== -->

    <!-- 1. Create Admin / Expert Modal -->
    <Modal
      :open="isCreateAdminModalOpen"
      title="افزودن حساب کاربری جدید"
      subtitle="تعیین نقش (مدیر سامانه یا کارشناس بررسی پرونده) و انتساب دسترسی‌ها"
      size="xl"
      @close="isCreateAdminModalOpen = false"
    >
      <form class="space-y-4 text-right" @submit.prevent="handleCreateAdmin">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            v-model="newAdminFullName"
            label="نام و نام خانوادگی"
            placeholder="مثال: مهندس رضایی"
          />

          <Select
            v-model="newAdminType"
            label="نقش حساب کاربری"
            :options="roleOptions"
            required
          />

          <Input
            v-model="newAdminUsername"
            label="نام کاربری / ایمیل"
            placeholder="مثال: expert_software@nasrplus.ir"
            dir="ltr"
            required
          />

          <Input
            v-model="newAdminPassword"
            type="password"
            label="کلمه عبور (حداقل ۶ کاراکتر)"
            placeholder="کلمه عبور امن را وارد نمایید"
            dir="ltr"
            required
          />
        </div>

        <!-- CONDITIONAL FIELD: Reviewable Specializations (ONLY FOR EXPERT) -->
        <div
          v-if="newAdminType === 'EXPERT'"
          class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3 transition-all"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <Layers class="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span class="text-xs font-bold block">
                  رسته‌های تخصصی قابل بررسی: (الزامی)
                  <span class="text-rose-500 mr-1">*</span>
                </span>
                <span class="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                  کارشناس صرفاً مجاز به بررسی و ممیزی پرونده‌های مربوط به این رسته‌ها خواهد بود.
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer font-bold"
                @click="selectedSpecializations = lookupsStore.specializations.map((s) => s._id)"
              >
                انتخاب همه
              </button>
              <span class="text-emerald-300 dark:text-emerald-700">&bull;</span>
              <button
                type="button"
                class="text-[11px] text-slate-500 hover:underline cursor-pointer font-medium"
                @click="selectedSpecializations = []"
              >
                لغو همه
              </button>
            </div>
          </div>

          <!-- Specializations Selection Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
            <div
              v-for="spec in lookupsStore.specializations"
              :key="spec._id"
              :class="[
                'p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-colors',
                selectedSpecializations.includes(spec._id)
                  ? 'border-emerald-500 bg-white dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white text-slate-700 dark:text-slate-300',
              ]"
              @click="toggleSpecialization(spec._id)"
            >
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="selectedSpecializations.includes(spec._id)"
                  class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 pointer-events-none"
                />
                <span>{{ spec.title }}</span>
              </div>
              <span v-if="spec.code" class="text-[10px] text-slate-400 font-mono" dir="ltr">
                {{ spec.code }}
              </span>
            </div>
          </div>

          <p v-if="selectedSpecializations.length === 0" class="text-[11px] text-rose-500 font-bold">
            ⚠ انتخاب حداقل یک رسته تخصصی برای ثبت حساب کارشناس الزامی است.
          </p>
        </div>

        <!-- Permissions selector if ADMIN -->
        <div v-else-if="newAdminType === 'ADMIN'" class="pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 font-bold'
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

        <!-- Account Status Toggle -->
        <div class="pt-2 flex items-center gap-2">
          <input
            id="newAdminActive"
            v-model="newAdminIsActive"
            type="checkbox"
            class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
          />
          <label for="newAdminActive" class="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            حساب کاربری فعال باشد
          </label>
        </div>
      </form>

      <template #footer>
        <Button variant="outline" size="md" :disabled="isSubmittingAdmin" @click="isCreateAdminModalOpen = false">
          انصراف
        </Button>
        <Button variant="primary" size="md" :loading="isSubmittingAdmin" @click="handleCreateAdmin">
          ذخیره اطلاعات
        </Button>
      </template>
    </Modal>

    <!-- 2. Edit Admin / Expert Modal -->
    <Modal
      :open="isEditAdminModalOpen"
      title="ویرایش حساب کاربری"
      subtitle="ویرایش مشخصات فردی، نقش کاربری و رسته‌های تخصصی انتسابی"
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
            v-model="editAdminType"
            label="نقش حساب کاربری"
            :options="roleOptions"
            required
          />

          <Input
            v-model="editAdminUsername"
            label="نام کاربری / ایمیل"
            placeholder="نام کاربری یا ایمیل را وارد نمایید"
            dir="ltr"
            required
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

          <div class="sm:col-span-2">
            <Input
              v-model="editAdminPassword"
              type="password"
              label="کلمه عبور جدید (اختیاری)"
              placeholder="در صورت عدم تمایل به تغییر، این فیلد را خالی بگذارید"
              hint="تنها در صورتی که مایل به تغییر رمز عبور کاربر هستید پر نمایید (حداقل ۶ کاراکتر)."
              dir="ltr"
            />
          </div>
        </div>

        <!-- CONDITIONAL FIELD: Reviewable Specializations (ONLY FOR EXPERT) -->
        <div
          v-if="editAdminType === 'EXPERT'"
          class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3 transition-all"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <Layers class="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span class="text-xs font-bold block">
                  رسته‌های تخصصی قابل بررسی: (الزامی)
                  <span class="text-rose-500 mr-1">*</span>
                </span>
                <span class="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                  کارشناس صرفاً مجاز به بررسی پرونده‌ها و مهارت‌های این رسته‌ها خواهد بود.
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer font-bold"
                @click="editSelectedSpecializations = lookupsStore.specializations.map((s) => s._id)"
              >
                انتخاب همه
              </button>
              <span class="text-emerald-300 dark:text-emerald-700">&bull;</span>
              <button
                type="button"
                class="text-[11px] text-slate-500 hover:underline cursor-pointer font-medium"
                @click="editSelectedSpecializations = []"
              >
                لغو همه
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
            <div
              v-for="spec in lookupsStore.specializations"
              :key="spec._id"
              :class="[
                'p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-colors',
                editSelectedSpecializations.includes(spec._id)
                  ? 'border-emerald-500 bg-white dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white text-slate-700 dark:text-slate-300',
              ]"
              @click="toggleEditSpecialization(spec._id)"
            >
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="editSelectedSpecializations.includes(spec._id)"
                  class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 pointer-events-none"
                />
                <span>{{ spec.title }}</span>
              </div>
              <span v-if="spec.code" class="text-[10px] text-slate-400 font-mono" dir="ltr">
                {{ spec.code }}
              </span>
            </div>
          </div>

          <p v-if="editSelectedSpecializations.length === 0" class="text-[11px] text-rose-500 font-bold">
            ⚠ انتخاب حداقل یک رسته تخصصی برای کارشناس الزامی است.
          </p>
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

    <!-- 3. Assign Permissions Modal (for ADMIN role) -->
    <Modal
      :open="isPermissionsModalOpen"
      :title="`مدیریت مجوزهای دسترسی: ${adminForPermissions?.fullName || adminForPermissions?.username || ''}`"
      subtitle="تعیین دسترسی‌های ریزدانه‌ای ماژول‌ها برای این مدیر"
      size="xl"
      @close="isPermissionsModalOpen = false"
    >
      <div class="space-y-4 text-right">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
            تعداد مجوزهای انتخاب‌شده: <strong class="text-brand-600">{{ managingPermissionIds.length }}</strong>
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="text-xs text-brand-600 dark:text-brand-400 hover:underline cursor-pointer font-bold"
              @click="managingPermissionIds = permissionsList.map((p) => p._id)"
            >
              انتخاب همه
            </button>
            <span class="text-slate-300 dark:text-slate-700">&bull;</span>
            <button
              type="button"
              class="text-xs text-slate-500 hover:underline cursor-pointer font-medium"
              @click="managingPermissionIds = []"
            >
              لغو همه
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto p-1">
          <div
            v-for="perm in permissionsList"
            :key="perm._id"
            :class="[
              'p-3 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-colors',
              managingPermissionIds.includes(perm._id)
                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 font-bold shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300',
            ]"
            @click="toggleManagingPermission(perm._id)"
          >
            <div>
              <span class="font-bold block">{{ perm.name }}</span>
              <span class="text-[10px] text-slate-400 font-mono" dir="ltr">{{ perm.key }}</span>
              <span v-if="perm.description" class="text-[10px] text-slate-500 block mt-0.5">
                {{ perm.description }}
              </span>
            </div>
            <input
              type="checkbox"
              :checked="managingPermissionIds.includes(perm._id)"
              class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button variant="outline" size="md" :disabled="isSavingPermissions" @click="isPermissionsModalOpen = false">
          انصراف
        </Button>
        <Button variant="primary" size="md" :loading="isSavingPermissions" @click="handleSavePermissions">
          ذخیره دسترسی‌ها
        </Button>
      </template>
    </Modal>

    <!-- 4. User Login History Modal -->
    <Modal
      :open="isUserLogsModalOpen"
      :title="`تاریخچه لاگ‌های ورود: ${selectedAdminForLogs?.fullName || selectedAdminForLogs?.username || ''}`"
      subtitle="ره‌گیری امنیتی نشست‌ها و تلاش‌های ورود این کاربر"
      size="2xl"
      @close="isUserLogsModalOpen = false"
    >
      <div v-if="selectedAdminForLogs" class="space-y-4">
        <LoginLogsView
          :embedded="true"
          :filter-admin-id="selectedAdminForLogs._id || selectedAdminForLogs.id"
          :filter-username="selectedAdminForLogs.username"
        />
      </div>

      <template #footer>
        <Button variant="outline" size="md" @click="isUserLogsModalOpen = false">
          بستن پنجره
        </Button>
      </template>
    </Modal>

    <!-- 5. Delete Admin Confirmation Dialog -->
    <ConfirmDialog
      :open="isDeleteModalOpen"
      title="حذف حساب کاربری مدیر یا کارشناس"
      :description="adminToDelete ? `آیا از حذف حساب کاربری «${adminToDelete.fullName || adminToDelete.username}» اطمینان دارید؟ در صورت داشتن سوابق لاگ یا عملیات کارشناسی، سیستم به جهت حفظ زنجیره ره‌گیری امنیتی از حذف ممانعت خواهد کرد.` : ''"
      confirm-text="حذف قطعی حساب"
      cancel-text="انصراف"
      variant="danger"
      :loading="isDeletingAdmin"
      @confirm="handleDeleteAdmin"
      @cancel="isDeleteModalOpen = false"
    />

    <!-- 6. Create Permission Modal -->
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
          placeholder="مثال: مشاهده فهرست اعضا"
          required
        />

        <Input
          v-model="permKey"
          label="کلید انگلیسی دسترسی (Key)"
          placeholder="مثال: members:read"
          dir="ltr"
          required
        />

        <Input
          v-model="permModule"
          label="نام ماژول"
          placeholder="مثال: members"
          dir="ltr"
        />

        <Input
          v-model="permDesc"
          label="توضیحات دسترسی"
          placeholder="توضیح مختصر درباره کاربرد این دسترسی"
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
