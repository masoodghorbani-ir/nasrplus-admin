<script setup lang="ts">
import type { Member } from '@/types';
import { useLookupsStore, useMemberAuthStore } from '@/stores';
import {
  User,
  Fingerprint,
  Mail,
  Calendar,
  CalendarDays,
  Building2,
  Briefcase,
  Layers,
  Award,
  IdCard,
  Copy,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Users,
  UserCheck,
  Hash,
} from 'lucide-vue-next';
import { toPersianDigits, formatPersianDate } from '@/utils/formatters';
import { useNotificationStore } from '@/stores';

interface Props {
  member: Member;
}

const props = defineProps<Props>();
const lookupsStore = useLookupsStore();
const memberAuthStore = useMemberAuthStore();
const notificationStore = useNotificationStore();

function copyText(val?: string, title: string = 'کپی شد') {
  if (!val) return;
  navigator.clipboard.writeText(val);
  notificationStore.success(`${val} در حافظه کپی شد`, title);
}
</script>

<template>
  <div class="space-y-6 select-none" dir="rtl">
    <!-- Header Summary Note -->
    <div
      class="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-50/90 via-slate-50 to-indigo-50/60 dark:from-slate-800/80 dark:via-slate-900 dark:to-indigo-950/30 border border-brand-200/70 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
    >
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-600/30">
          <IdCard class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            شناسنامه و پرونده هویتی - صنفی عضو
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-normal">
            اطلاعات درج‌شده بر مبنای اسناد رسمی و پرونده ثبتی سازمان نظام صنفی رایانه‌ای کشور تنظیم گردیده است.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">وضعیت پرونده:</span>
        <span
          :class="[
            'px-3 py-1 rounded-xl text-xs font-semibold border shadow-xs',
            memberAuthStore.statusConfig.bgClass,
          ]"
        >
          {{ memberAuthStore.statusConfig.label }}
        </span>
      </div>
    </div>

    <!-- Section 1: Individual / Identity Info -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800 flex items-center justify-center">
            <User class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              اطلاعات هویتی و فردی
            </h4>
            <span class="text-3xs sm:text-xs text-slate-400 dark:text-slate-500 font-normal">
              مشخصات سجلی و هویتی تاییدشده عضو
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <!-- Full Name -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">نام و نام خانوادگی</span>
            <User class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-1.5">
            {{ memberAuthStore.memberFullName }}
          </div>
        </div>

        <!-- National Code -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">کد ملی</span>
            <Fingerprint class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {{ member.nationalCode ? toPersianDigits(member.nationalCode) : 'ثبت نشده' }}
            </span>
            <button
              v-if="member.nationalCode"
              type="button"
              class="text-slate-400 hover:text-brand-600 transition p-1 cursor-pointer"
              title="کپی کد ملی"
              @click="copyText(member.nationalCode, 'کد ملی')"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Father's Name -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">نام پدر</span>
            <Users class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1.5">
            {{ member.fatherName || 'ثبت نشده' }}
          </div>
        </div>

        <!-- Gender -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">جنسیت</span>
            <UserCheck class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1.5">
            <span v-if="member.gender === 'MALE'">مرد</span>
            <span v-else-if="member.gender === 'FEMALE'">زن</span>
            <span v-else class="text-slate-400 font-normal">نامشخص</span>
          </div>
        </div>

        <!-- Birth Date -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">تاریخ تولد</span>
            <Calendar class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums mt-1.5">
            {{ member.birthDate ? formatPersianDate(member.birthDate) : 'ثبت نشده' }}
          </div>
        </div>

        <!-- Email -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">پست الکترونیکی</span>
            <Mail class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate dir-ltr text-right mt-1.5 font-mono">
            {{ (member as any).email || 'ثبت نشده' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Guild Membership Details -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
          <div class="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/70 dark:border-brand-800 flex items-center justify-center">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              مشخصات عضویت در نظام صنفی رایانه‌ای
            </h4>
            <span class="text-3xs sm:text-xs text-slate-400 dark:text-slate-500 font-normal">
              شماره نظام، رسته و مشخصات پرونده صنفی
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        <!-- Membership Code -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/60 flex flex-col justify-between min-h-[76px] transition-colors hover:border-brand-400">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-brand-700 dark:text-brand-300">کد عضویت (شماره نظام)</span>
            <Hash class="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">
              {{ toPersianDigits(member.memberCode) }}
            </span>
            <button
              type="button"
              class="text-brand-500 hover:text-brand-700 transition p-1 cursor-pointer"
              title="کپی کد عضویت"
              @click="copyText(member.memberCode, 'کد عضویت')"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Specialization -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">رسته تخصصی صنف</span>
            <Briefcase class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-1.5">
            {{ lookupsStore.getSpecializationTitle(member.specializationId) }}
          </div>
        </div>

        <!-- Guild Rank -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">رتبه عضویت صنف</span>
            <Award class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="mt-1.5">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
              {{ lookupsStore.getRankTitle(member.rankId) }}
            </span>
          </div>
        </div>

        <!-- Membership Type -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">نوع عضویت</span>
            <ShieldCheck class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1.5">
            {{ lookupsStore.getMembershipTypeTitle(member.membershipTypeId) }}
          </div>
        </div>

        <!-- Nature of Membership -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">ماهیت عضویت</span>
            <Layers class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1.5">
            {{ lookupsStore.getNatureTitle(member.natureOfMembership) }}
          </div>
        </div>

        <!-- Affiliated Company -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">شرکت یا سازمان وابسته</span>
            <Building2 class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-1.5">
            <span v-if="typeof member.companyInformation === 'object' && (member.companyInformation as any)?.title">
              {{ (member.companyInformation as any).title }}
            </span>
            <span v-else class="text-slate-400 font-normal">مستقل / بدون شرکت</span>
          </div>
        </div>

        <!-- Start Date -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">تاریخ شروع عضویت</span>
            <CalendarDays class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums mt-1.5">
            {{ member.membershipDate ? formatPersianDate(member.membershipDate) : 'ثبت نشده' }}
          </div>
        </div>

        <!-- Expiry Date -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">تاریخ اعتبار پروانه</span>
            <Clock class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums mt-1.5">
            {{ member.expiryDate ? formatPersianDate(member.expiryDate) : 'نامحدود / معتبر' }}
          </div>
        </div>

        <!-- Creation Date -->
        <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[76px] transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">تاریخ ثبت پرونده</span>
            <Calendar class="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums mt-1.5">
            {{ member.createdAt ? formatPersianDate(member.createdAt) : 'ثبت نشده' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Contact & Addresses -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div class="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800 flex items-center justify-center">
            <Phone class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              اطلاعات تماس و نشانی‌ها
            </h4>
            <span class="text-3xs sm:text-xs text-slate-400 dark:text-slate-500 font-normal">
              شماره‌های تماس رسمی، همراه و آدرس اقامتگاه
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <!-- Telephones List -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone class="w-3.5 h-3.5 text-slate-400" />
              <span>شماره‌های تماس ثبت‌شده</span>
            </h5>
            <span class="text-3xs text-slate-400 font-medium tabular-nums">
              {{ toPersianDigits(member.telephones?.length || 0) }} شماره
            </span>
          </div>

          <div v-if="member.telephones && member.telephones.length > 0" class="space-y-2.5">
            <div
              v-for="tel in member.telephones"
              :key="tel._id"
              class="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Phone class="w-4 h-4" />
                </div>
                <div>
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {{ tel.title || (tel.phoneType === 'MOBILE' ? 'تلفن همراه' : 'تلفن ثابت') }}
                  </span>
                  <span class="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums dir-ltr text-right block mt-0.5 font-mono">
                    {{ toPersianDigits(tel.phoneNumber) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span v-if="tel.isPrimary" class="text-3xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                  شماره اصلی
                </span>
                <button
                  type="button"
                  class="text-slate-400 hover:text-brand-600 transition p-1 cursor-pointer"
                  title="کپی شماره تماس"
                  @click="copyText(tel.phoneNumber, 'شماره تماس')"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-slate-400 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-1.5 font-normal">
            <Phone class="w-6 h-6 text-slate-300 dark:text-slate-600" />
            <span>هیچ شماره تماسی در پرونده ثبت نشده است</span>
          </div>
        </div>

        <!-- Addresses List -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 text-slate-400" />
              <span>نشانی‌های پستی و اقامتگاه</span>
            </h5>
            <span class="text-3xs text-slate-400 font-normal tabular-nums">
              {{ toPersianDigits(member.addresses?.length || 0) }} نشانی
            </span>
          </div>

          <div v-if="member.addresses && member.addresses.length > 0" class="space-y-2.5">
            <div
              v-for="addr in member.addresses"
              :key="addr._id"
              class="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <MapPin class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span>{{ lookupsStore.getProvinceTitle(addr.province) }}، {{ lookupsStore.getCityTitle(addr.city) }}</span>
                </div>
                <span v-if="addr.isPrimary" class="text-3xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                  اقامتگاه اصلی
                </span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-6 font-normal">
                {{ addr.address }}
              </p>
              <div v-if="addr.postalCode" class="pr-6 flex items-center justify-between text-3xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span class="flex items-center gap-1">
                  <span>کد پستی:</span>
                  <span class="font-semibold tabular-nums text-slate-700 dark:text-slate-300 font-mono">{{ toPersianDigits(addr.postalCode) }}</span>
                </span>
                <button
                  type="button"
                  class="text-slate-400 hover:text-brand-600 transition p-1 cursor-pointer"
                  title="کپی کد پستی"
                  @click="copyText(addr.postalCode, 'کد پستی')"
                >
                  <Copy class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-slate-400 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-1.5">
            <MapPin class="w-6 h-6 text-slate-300 dark:text-slate-600" />
            <span>هیچ نشانی پستی در پرونده ثبت نشده است</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
