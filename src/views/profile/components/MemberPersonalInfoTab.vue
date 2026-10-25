<script setup lang="ts">
import type { Member } from '@/types';
import { useLookupsStore, useMemberAuthStore, useNotificationStore } from '@/stores';
import { Copy } from 'lucide-vue-next';
import { toPersianDigits, formatPersianDate } from '@/utils/formatters';

interface Props {
  member: Member;
}

defineProps<Props>();
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
  <div class="space-y-5 select-none" dir="rtl">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h2 class="portal-section-title text-base">شناسنامه و مشخصات</h2>
        <p class="portal-muted leading-relaxed">
          اطلاعات بر اساس اسناد رسمی و پرونده ثبتی سازمان نظام صنفی رایانه‌ای نمایش داده می‌شود.
        </p>
      </div>
      <span
        :class="[
          'inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
          memberAuthStore.statusConfig.bgClass,
        ]"
      >
        <span class="h-1.5 w-1.5 rounded-full" :class="memberAuthStore.statusConfig.dotClass" />
        {{ memberAuthStore.statusConfig.label }}
      </span>
    </header>

    <!-- Identity -->
    <section class="portal-panel p-5 sm:p-6">
      <h3 class="portal-section-title mb-1 border-b border-slate-100 pb-3 dark:border-slate-800">
        اطلاعات هویتی
      </h3>
      <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div class="portal-field">
          <dt class="portal-label">نام و نام خانوادگی</dt>
          <dd class="portal-value">{{ memberAuthStore.memberFullName }}</dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">کد ملی</dt>
          <dd class="flex items-center gap-2">
            <span class="portal-value tabular-nums">
              {{ member.nationalCode ? toPersianDigits(member.nationalCode) : 'ثبت نشده' }}
            </span>
            <button
              v-if="member.nationalCode"
              type="button"
              class="cursor-pointer text-slate-400 transition hover:text-brand-600"
              title="کپی کد ملی"
              @click="copyText(member.nationalCode, 'کد ملی')"
            >
              <Copy class="h-3.5 w-3.5" />
            </button>
          </dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">نام پدر</dt>
          <dd class="portal-value">{{ member.fatherName || 'ثبت نشده' }}</dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">جنسیت</dt>
          <dd class="portal-value">
            <span v-if="member.gender === 'MALE'">مرد</span>
            <span v-else-if="member.gender === 'FEMALE'">زن</span>
            <span v-else class="font-normal text-slate-400">نامشخص</span>
          </dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">تاریخ تولد</dt>
          <dd class="portal-value tabular-nums">
            {{ member.birthDate ? formatPersianDate(member.birthDate) : 'ثبت نشده' }}
          </dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">پست الکترونیکی</dt>
          <dd class="portal-value dir-ltr text-right font-mono">
            {{ (member as any).email || 'ثبت نشده' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Membership -->
    <section class="portal-panel p-5 sm:p-6">
      <h3 class="portal-section-title mb-1 border-b border-slate-100 pb-3 dark:border-slate-800">
        مشخصات عضویت
      </h3>
      <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div class="portal-field">
          <dt class="portal-label">کد عضویت</dt>
          <dd class="flex items-center gap-2">
            <span class="text-sm font-semibold tabular-nums text-brand-700 dark:text-brand-300">
              {{ toPersianDigits(member.memberCode) }}
            </span>
            <button
              type="button"
              class="cursor-pointer text-slate-400 transition hover:text-brand-600"
              title="کپی کد عضویت"
              @click="copyText(member.memberCode, 'کد عضویت')"
            >
              <Copy class="h-3.5 w-3.5" />
            </button>
          </dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">رسته تخصصی</dt>
          <dd class="portal-value">{{ lookupsStore.getSpecializationTitle(member.specializationId) }}</dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">رتبه عضویت</dt>
          <dd class="portal-value">{{ lookupsStore.getRankTitle(member.rankId) }}</dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">نوع عضویت</dt>
          <dd class="portal-value">{{ lookupsStore.getMembershipTypeTitle(member.membershipTypeId) }}</dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">ماهیت عضویت</dt>
          <dd class="portal-value">{{ lookupsStore.getNatureTitle(member.natureOfMembership) }}</dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">شرکت یا سازمان وابسته</dt>
          <dd class="portal-value">
            <span v-if="typeof member.companyInformation === 'object' && (member.companyInformation as any)?.title">
              {{ (member.companyInformation as any).title }}
            </span>
            <span v-else class="font-normal text-slate-400">مستقل / بدون شرکت</span>
          </dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">تاریخ شروع عضویت</dt>
          <dd class="portal-value tabular-nums">
            {{ member.membershipDate ? formatPersianDate(member.membershipDate) : 'ثبت نشده' }}
          </dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">تاریخ اعتبار پروانه</dt>
          <dd class="portal-value tabular-nums">
            {{ member.expiryDate ? formatPersianDate(member.expiryDate) : 'نامحدود / معتبر' }}
          </dd>
        </div>

        <div class="portal-field">
          <dt class="portal-label">تاریخ ثبت پرونده</dt>
          <dd class="portal-value tabular-nums">
            {{ member.createdAt ? formatPersianDate(member.createdAt) : 'ثبت نشده' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Contact -->
    <section class="portal-panel p-5 sm:p-6">
      <h3 class="portal-section-title mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
        تماس و نشانی
      </h3>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300">شماره‌های تماس</h4>
            <span class="portal-muted tabular-nums">
              {{ toPersianDigits(member.telephones?.length || 0) }} شماره
            </span>
          </div>

          <div v-if="member.telephones && member.telephones.length > 0" class="divide-y divide-slate-100 dark:divide-slate-800">
            <div
              v-for="tel in member.telephones"
              :key="tel._id"
              class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ tel.title || (tel.phoneType === 'MOBILE' ? 'تلفن همراه' : 'تلفن ثابت') }}
                  <span
                    v-if="tel.isPrimary"
                    class="mr-1 text-[11px] font-medium text-brand-700 dark:text-brand-300"
                  >
                    · اصلی
                  </span>
                </p>
                <p class="mt-0.5 text-sm font-medium tabular-nums text-slate-800 dark:text-slate-100 dir-ltr text-right font-mono">
                  {{ toPersianDigits(tel.phoneNumber) }}
                </p>
              </div>
              <button
                type="button"
                class="cursor-pointer text-slate-400 transition hover:text-brand-600"
                title="کپی شماره تماس"
                @click="copyText(tel.phoneNumber, 'شماره تماس')"
              >
                <Copy class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p
            v-else
            class="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-slate-700"
          >
            شماره‌ای ثبت نشده است
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300">نشانی‌ها</h4>
            <span class="portal-muted tabular-nums">
              {{ toPersianDigits(member.addresses?.length || 0) }} نشانی
            </span>
          </div>

          <div v-if="member.addresses && member.addresses.length > 0" class="divide-y divide-slate-100 dark:divide-slate-800">
            <div
              v-for="addr in member.addresses"
              :key="addr._id"
              class="space-y-1.5 py-3 first:pt-0 last:pb-0"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {{ lookupsStore.getProvinceTitle(addr.province) }}، {{ lookupsStore.getCityTitle(addr.city) }}
                </p>
                <span
                  v-if="addr.isPrimary"
                  class="text-[11px] font-medium text-brand-700 dark:text-brand-300"
                >
                  اصلی
                </span>
              </div>
              <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {{ addr.address }}
              </p>
              <div
                v-if="addr.postalCode"
                class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400"
              >
                <span>
                  کد پستی:
                  <span class="font-medium tabular-nums text-slate-700 dark:text-slate-300 font-mono">
                    {{ toPersianDigits(addr.postalCode) }}
                  </span>
                </span>
                <button
                  type="button"
                  class="cursor-pointer text-slate-400 transition hover:text-brand-600"
                  title="کپی کد پستی"
                  @click="copyText(addr.postalCode, 'کد پستی')"
                >
                  <Copy class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <p
            v-else
            class="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400 dark:border-slate-700"
          >
            نشانی ثبت نشده است
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
