<script setup lang="ts">
import { computed } from 'vue';
import type { Member, Rank } from '@/types';
import { useLookupsStore } from '@/stores';
import { Award, Star, AlertCircle } from 'lucide-vue-next';
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
  const match = rankTitle.value.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
});

const rankConfig = computed(() => {
  const lvl = rankLevel.value;
  if (lvl === 1) {
    return {
      title: 'رتبه ۱ عالی نظام صنفی رایانه‌ای',
      stars: 3,
      badgeText: 'بالاترین سطح صلاحیت تخصصی',
      description:
        'دارای بالاترین مجوز اجرای کلان‌ترین پروژه‌های نرم‌افزاری و زیرساختی فناوری اطلاعات با سقف نامحدود ریالی.',
    };
  }
  if (lvl === 2) {
    return {
      title: 'رتبه ۲ تخصصی نظام صنفی رایانه‌ای',
      stars: 2,
      badgeText: 'سطح تخصصی پیشرفته',
      description:
        'دارای صلاحیت فنی جهت انعقاد و اجرای پروژه‌های فناوری اطلاعات متوسط تا بزرگ مطابق ضوابط کمیسیون نظارت.',
    };
  }
  if (lvl === 3) {
    return {
      title: 'رتبه ۳ تخصصی نظام صنفی رایانه‌ای',
      stars: 1,
      badgeText: 'سطح تخصصی پایه',
      description:
        'دارای پروانه صلاحیت حرفه‌ای معتبر جهت همکاری در طرح‌ها و مناقصات حوزه فناوری اطلاعات استانی و کشوری.',
    };
  }

  return {
    title: rankTitle.value !== '—' ? rankTitle.value : 'فاقد رتبه‌بندی صنفی',
    stars: 0,
    badgeText: 'در انتظار ارزیابی رتبه‌بندی',
    description:
      'برای احراز رتبه صنفی، مدارک تحصیلی و سوابق مهارتی و گواهینامه‌های خود را در بخش‌های مربوطه تکمیل کنید.',
  };
});
</script>

<template>
  <section class="portal-panel flex h-full flex-col justify-between p-5 sm:p-6">
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="portal-icon-box">
            <Award class="h-4 w-4" />
          </span>
          <div class="min-w-0 space-y-1 text-right">
            <p class="portal-label">{{ rankConfig.badgeText }}</p>
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
              {{ rankConfig.title }}
            </h3>
            <p v-if="rankLevel !== null" class="portal-muted">
              سطح {{ toPersianDigits(rankLevel) }}
            </p>
          </div>
        </div>

        <div class="shrink-0">
          <div v-if="rankConfig.stars > 0" class="flex items-center gap-1" aria-label="ستاره رتبه">
            <Star
              v-for="s in 3"
              :key="s"
              class="h-4 w-4"
              :class="
                s <= rankConfig.stars
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 dark:text-slate-600'
              "
            />
          </div>
          <span
            v-else
            class="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"
          >
            <AlertCircle class="h-3.5 w-3.5" />
            بدون رتبه
          </span>
        </div>
      </div>

      <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        {{ rankConfig.description }}
      </p>
    </div>
  </section>
</template>
