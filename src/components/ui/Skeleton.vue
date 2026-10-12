<script setup lang="ts">
interface Props {
  rows?: number;
  height?: string;
  width?: string;
  rounded?: string;
}

withDefaults(defineProps<Props>(), {
  rows: 1,
  height: 'h-4',
  width: 'w-full',
  rounded: 'rounded-md',
});
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="i in rows"
      :key="i"
      :class="[
        'bg-slate-200 dark:bg-slate-800 animate-pulse',
        height,
        width,
        rounded,
      ]"
    />
  </div>
</template>
