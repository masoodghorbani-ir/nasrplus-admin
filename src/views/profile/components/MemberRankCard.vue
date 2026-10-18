<script setup lang="ts">
import { computed } from 'vue';
import type { Member, Rank } from '@/types';
import { useLookupsStore } from '@/stores';
import { Award, Star, Sparkles, AlertCircle } from 'lucide-vue-next';
import { toPersianDigits } from '@/utils/formatters';

interface Props {
  member: Member;
}

const props = defineProps<Props>();
const lookupsStore = useLookupsStore();

const rankObject = computed<Rank | null>(() => {
  if (!props.member?.rankId) return null;
  if (typeof props.member.rankId === 'object') return props.member.rankId as Rank;
  return lookupsStore.ranks.find((r) => r._id === props.member.rankId) || null;
});

const rankTitle = computed(() => {
  return lookupsStore.getRankTitle(props.member?.rankId);
});

const rankLevel = computed(() => {
  if (rankObject.value?.level !== undefined) {
    return rankObject.value.level;
  }
  // Try parsing from title (e.g. "رتبه 1" -> 1)
  const match = rankTitle.value.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
});

// Rank tier metadata
const rankConfig = computed(() => {
  const lvl = rankLevel.value;
  if (lvl === 1) {
    return {
      title: 'رتبه ۱ عالی نظام صنفی رایانه‌ای',
      stars: 3,
      badgeText: 'بالاترین سطح صلاحیت تخصصی صنف',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-300/80 dark:border-amber-700/60',
      textColor: 'text-amber-600 dark:text-amber-400',
      description: 'دارای بالاترین مجوز اجرای کلان‌ترین پروژه‌های نرم‌افزاری و زیرساختی فناوری اطلاعات کشور با سقف نامحدود ریالی.',
    };
  }
  if (lvl === 2) {
    return {
      title: 'رتبه ۲ تخصصی نظام صنفی رایانه‌ای',
      stars: 2,
      badgeText: 'سطح تخصصی پیشرفته',
      badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700',
      gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent',
      borderColor: 'border-indigo-300/80 dark:border-indigo-700/60',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      description: 'دارای صلاحیت فنی جهت انعقاد و اجرای پروژه‌های فناوری اطلاعات متوسط تا بزرگ صنف مطابق با ضوابط کمیسیون نظارت.',
    };
  }
  if (lvl === 3) {
    return {
      title: 'رتبه ۳ تخصصی نظام صنفی رایانه‌ای',
      stars: 1,
      badgeText: 'سطح تخصصی پایه',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-300/80 dark:border-emerald-700/60',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      description: 'دارای پروانه صلاحیت حرفه‌ای معتبر جهت همکاری در طرح‌ها و مناقصات حوزه فناوری اطلاعات استانی و کشوری.',
    };
  }

  return {
    title: rankTitle.value !== '—' ? rankTitle.value : 'فاقد رتبه‌بندی صنفی',
    stars: 0,
    badgeText: 'در انتظار ارزیابی رتبه‌بندی',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    gradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
    borderColor: 'border-slate-200 dark:border-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
    description: 'برای احراز رتبه صنفی، لطفاً مدارک تحصیلی و سوابق مهارتی و گواهینامه‌های خود را در بخش‌های مربوطه تکمیل فرمایید.',
  };
});
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-3xl p-5 sm:p-6 border transition-all duration-300 bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between h-full',
      rankConfig.borderColor,
    ]"
  >
    <!-- Background subtle gradient highlight -->
    <div
      :class="[
        'absolute inset-0 bg-gradient-to-br pointer-events-none opacity-60 dark:opacity-40',
        rankConfig.gradient,
      ]"
    />

    <div class="relative z-10 flex flex-col justify-between h-full gap-4">
      <!-- Main Content -->
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-3">
          <!-- Rank Icon & Title -->
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs',
                rankConfig.badgeClass,
              ]"
            >
              <Award class="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div class="space-y-1 text-right">
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold border',
                    rankConfig.badgeClass,
                  ]"
                >
                  <Sparkles class="w-3 h-3" />
                  <span>{{ rankConfig.badgeText }}</span>
                </span>

                <span
                  v-if="rankLevel !== null"
                  class="text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  (سطح {{ toPersianDigits(rankLevel) }})
                </span>
              </div>

              <h3 class="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                {{ rankConfig.title }}
              </h3>
            </div>
          </div>

          <!-- Glowing Stars or Status -->
          <div class="shrink-0">
            <div v-if="rankConfig.stars > 0" class="flex items-center gap-1">
              <div
                v-for="s in 3"
                :key="s"
                :class="[
                  'w-7 h-7 rounded-xl flex items-center justify-center border transition',
                  s <= rankConfig.stars
                    ? 'bg-amber-400 text-white border-amber-500 shadow-sm shadow-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-transparent',
                ]"
              >
                <Star class="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            <div v-else class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl">
              <AlertCircle class="w-3.5 h-3.5" />
              <span class="text-2xs font-medium">بدون ستاره</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-xs font-normal text-slate-600 dark:text-slate-400 leading-relaxed text-right">
          {{ rankConfig.description }}
        </p>
      </div>
    </div>
  </div>
</template>
