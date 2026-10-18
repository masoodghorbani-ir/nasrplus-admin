<script setup lang="ts">
import type { Member } from '@/types';
import { Modal, Button } from '@/components/ui';
import { toPersianDigits } from '@/utils/formatters';
import { GraduationCap } from 'lucide-vue-next';
import MemberQualificationsTab from './components/MemberQualificationsTab.vue';

interface Props {
  open: boolean;
  member: Member | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  member: null,
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'updated'): void;
}>();
</script>

<template>
  <Modal
    :open="open"
    size="2xl"
    @close="emit('update:open', false)"
  >
    <!-- Modal Header -->
    <template #header>
      <div v-if="member" class="w-full flex items-center justify-between text-right" dir="rtl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold">
            <GraduationCap class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>مدارک و تحصیلات دانشگاهی عضو</span>
              <span class="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-md tabular-nums">
                {{ toPersianDigits(member.memberCode) }}
              </span>
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              عضو: <strong class="text-slate-700 dark:text-slate-300">{{ member.firstName || '' }} {{ member.lastName || '' }}</strong>
              <span v-if="member.nationalCode" class="mr-2">
                &bull; کد ملی: <span class="tabular-nums">{{ toPersianDigits(member.nationalCode) }}</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <div v-if="member?._id" class="text-right select-none" dir="rtl">
      <MemberQualificationsTab
        :member-id="member._id"
        :member="member"
        @updated="emit('updated')"
      />
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <span class="text-[11px] text-slate-400">
          امکان ثبت مدارک دانشگاهی متعدد برای هر عضو و گردش کار ارزیابی کارشناسی فراهم است.
        </span>
        <Button
          variant="outline"
          size="sm"
          @click="emit('update:open', false)"
        >
          بستن پنجره
        </Button>
      </div>
    </template>
  </Modal>
</template>
