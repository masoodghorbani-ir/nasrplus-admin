<template>
  <div
    class="relative inline-flex items-center justify-center overflow-hidden font-bold select-none shrink-0"
    :class="[sizeClasses, shapeClasses, backgroundClass]"
  >
    <!-- Member Photo Image -->
    <img
      v-if="fullImageUrl && !imageError"
      :src="fullImageUrl"
      :alt="alt || fullName || 'تصویر پرسنلی عضو'"
      class="w-full h-full object-cover transition-opacity duration-300"
      loading="lazy"
      @error="imageError = true"
    />

    <!-- Fallback Initials / Silhouette -->
    <div
      v-else
      class="w-full h-full flex items-center justify-center"
      :class="deterministicBgColor"
    >
      <span
        v-if="initials"
        class="font-black text-slate-700 dark:text-slate-200 tracking-tight select-none"
      >
        {{ initials }}
      </span>
      <User
        v-else
        :class="iconSizeClass"
        class="text-slate-400 dark:text-slate-500"
      />
    </div>

    <!-- Status Indicator Badge -->
    <span
      v-if="showStatus && status"
      class="absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs"
      :class="[statusSizeClass, statusColorClass]"
      :title="`وضعیت: ${status}`"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { User } from 'lucide-vue-next';
import { resolvePhotoUrl } from '@/services/member-photo.service';

const props = withDefaults(
  defineProps<{
    profileImage?: string | null;
    fullName?: string;
    status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REJECTED';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'card';
    shape?: 'circle' | 'rounded' | 'portrait';
    showStatus?: boolean;
    timestamp?: number;
    alt?: string;
  }>(),
  {
    profileImage: '',
    fullName: '',
    size: 'md',
    shape: 'rounded',
    showStatus: false,
    timestamp: 0,
    alt: '',
  }
);

const imageError = ref(false);

// Reset image error state when profileImage or timestamp updates
watch(
  () => [props.profileImage, props.timestamp],
  () => {
    imageError.value = false;
  }
);

const fullImageUrl = computed(() => {
  return resolvePhotoUrl(props.profileImage, props.timestamp);
});

const initials = computed(() => {
  if (!props.fullName) return '';
  const trimmed = props.fullName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2);
  }
  return `${parts[0][0]} ${parts[parts.length - 1][0]}`;
});

// Deterministic gentle background palette for member initials fallback
const deterministicBgColor = computed(() => {
  if (!props.fullName) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  const colors = [
    'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
    'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  ];
  let hash = 0;
  for (let i = 0; i < props.fullName.length; i++) {
    hash = (hash << 5) - hash + props.fullName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-6 h-6 text-[10px]';
    case 'sm':
      return 'w-9 h-9 text-xs';
    case 'md':
      return 'w-12 h-12 text-sm';
    case 'lg':
      return 'w-20 h-20 text-lg';
    case 'xl':
      return 'w-28 h-36 text-xl'; // 3:4 portrait
    case 'card':
      return 'w-44 h-60 text-2xl'; // ID Card size
    default:
      return 'w-12 h-12 text-sm';
  }
});

const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-3.5 h-3.5';
    case 'sm':
      return 'w-4.5 h-4.5';
    case 'md':
      return 'w-6 h-6';
    case 'lg':
      return 'w-9 h-9';
    case 'xl':
      return 'w-12 h-12';
    case 'card':
      return 'w-16 h-16';
    default:
      return 'w-6 h-6';
  }
});

const shapeClasses = computed(() => {
  if (props.size === 'xl' || props.size === 'card' || props.shape === 'portrait') {
    return 'rounded-2xl';
  }
  return props.shape === 'circle' ? 'rounded-full' : 'rounded-xl';
});

const backgroundClass = computed(() => {
  return props.profileImage && !imageError.value
    ? 'bg-slate-100 dark:bg-slate-800'
    : 'bg-slate-200 dark:bg-slate-700';
});

const statusSizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-2 h-2 ring-1';
    case 'sm':
      return 'w-2.5 h-2.5 ring-1.5';
    case 'md':
      return 'w-3.5 h-3.5 ring-2';
    case 'lg':
      return 'w-4 h-4 ring-2';
    case 'xl':
    case 'card':
      return 'w-5 h-5 ring-2.5';
    default:
      return 'w-3 h-3 ring-2';
  }
});

const statusColorClass = computed(() => {
  switch (props.status) {
    case 'ACTIVE':
      return 'bg-emerald-500';
    case 'PENDING':
      return 'bg-amber-500';
    case 'SUSPENDED':
    case 'REJECTED':
      return 'bg-rose-500';
    case 'EXPIRED':
      return 'bg-slate-400';
    default:
      return 'bg-slate-400';
  }
});
</script>
