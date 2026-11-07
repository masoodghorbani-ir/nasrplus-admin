<template>
  <div class="space-y-2 select-none" dir="rtl">
    <div class="flex items-center justify-between">
      <label :for="inputId" class="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
        کد امنیتی کپچا
        <span class="text-rose-500 font-black mr-0.5">*</span>
      </label>
      <span class="text-3xs sm:text-xs text-slate-400 dark:text-slate-500">
        حروف بزرگ و کوچک تفاوتی ندارند
      </span>
    </div>

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
      <!-- Input Field -->
      <div class="relative flex-1">
        <input
          :id="inputId"
          ref="inputRef"
          type="text"
          :value="modelValue"
          maxlength="6"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="کد تصویر را وارد کنید"
          dir="ltr"
          class="w-full h-12 px-3.5 pl-10 rounded-xl border text-center font-mono text-base font-bold tracking-widest uppercase transition-all focus:outline-none focus:ring-2"
          :class="[
            hasError
              ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-700 dark:bg-rose-950/20 dark:text-rose-200'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:ring-brand-500/20',
          ]"
          @input="handleInput"
          @keydown.enter.prevent="$emit('enter')"
        />
        <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
          <ShieldAlert class="w-4 h-4" />
        </div>
      </div>

      <!-- Captcha Canvas Box & Controls -->
      <div
        class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shrink-0"
      >
        <!-- Canvas -->
        <div
          class="relative rounded-lg overflow-hidden cursor-pointer shadow-inner bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
          title="برای دریافت کد جدید کلیک کنید"
          @click="generateCaptcha"
        >
          <canvas
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            class="block w-[130px] h-[40px] pointer-events-none"
          />
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-0.5">
          <!-- Refresh button -->
          <button
            type="button"
            class="p-2 rounded-lg text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
            :class="{ 'rotate-180': isRotating }"
            title="تغییر کد امنیتی (دریافت تصویر جدید)"
            @click="handleRefreshClick"
          >
            <RefreshCw class="w-4 h-4 transition-transform duration-500" :class="{ 'animate-spin': isRotating }" />
          </button>

          <!-- Audio pronunciation button -->
          <button
            v-if="hasSpeechSupport"
            type="button"
            class="p-2 rounded-lg text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="شنیدن کد امنیتی به صورت صوتی"
            @click="speakCaptcha"
          >
            <Volume2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Error message if invalid -->
    <p v-if="hasError && errorMessage" class="text-xs text-rose-600 dark:text-rose-400 font-medium">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { ShieldAlert, RefreshCw, Volume2 } from 'lucide-vue-next';
import { toLatinDigits } from '@/utils/formatters';

interface Props {
  modelValue?: string;
  hasError?: boolean;
  errorMessage?: string;
  inputId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  hasError: false,
  errorMessage: '',
  inputId: 'captcha-input',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'refresh'): void;
  (e: 'enter'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const canvasWidth = 140;
const canvasHeight = 44;
const currentCaptchaCode = ref('');
const isRotating = ref(false);

const hasSpeechSupport = computed(() => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
});

// Characters excluding ambiguous 0, O, 1, I, l
const CHAR_SET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(length = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * CHAR_SET.length);
    result += CHAR_SET[idx];
  }
  return result;
}

function getRandomColor(min = 30, max = 180): string {
  const r = Math.floor(min + Math.random() * (max - min));
  const g = Math.floor(min + Math.random() * (max - min));
  const b = Math.floor(min + Math.random() * (max - min));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawCaptcha(code: string) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGrad.addColorStop(0, '#f1f5f9');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Add random noise lines
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = getRandomColor(120, 200);
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
    ctx.bezierCurveTo(
      Math.random() * canvasWidth,
      Math.random() * canvasHeight,
      Math.random() * canvasWidth,
      Math.random() * canvasHeight,
      Math.random() * canvasWidth,
      Math.random() * canvasHeight
    );
    ctx.stroke();
  }

  // Add random noise dots
  for (let i = 0; i < 35; i++) {
    ctx.fillStyle = getRandomColor(100, 220);
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvasWidth,
      Math.random() * canvasHeight,
      0.8 + Math.random() * 1.2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Draw each character with random rotation & offset
  const charSpacing = canvasWidth / (code.length + 1);
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = (i + 1) * charSpacing;
    const y = canvasHeight / 2 + (Math.random() * 6 - 3);

    ctx.save();
    ctx.translate(x, y);

    // Random rotation between -20 and +20 degrees
    const angle = ((Math.random() * 40 - 20) * Math.PI) / 180;
    ctx.rotate(angle);

    // Font styling
    const fontSize = Math.floor(21 + Math.random() * 5);
    ctx.font = `bold ${fontSize}px monospace, 'Vazirmatn', sans-serif`;
    ctx.fillStyle = getRandomColor(10, 100);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
}

function generateCaptcha() {
  const newCode = generateRandomCode(5);
  currentCaptchaCode.value = newCode;
  nextTick(() => {
    drawCaptcha(newCode);
  });
}

function handleRefreshClick() {
  isRotating.value = true;
  generateCaptcha();
  emit('update:modelValue', '');
  emit('refresh');
  setTimeout(() => {
    isRotating.value = false;
  }, 500);
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const normalized = toLatinDigits(target.value).trim().toUpperCase();
  emit('update:modelValue', normalized);
}

function speakCaptcha() {
  if (!hasSpeechSupport.value) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const codeChars = currentCaptchaCode.value.split('').join(' . ');
  const utterance = new SpeechSynthesisUtterance(codeChars);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  synth.speak(utterance);
}

/**
 * Validates the user input against the current captcha code
 */
function validate(value?: string): boolean {
  const testVal = (value !== undefined ? value : props.modelValue || '').trim().toUpperCase();
  const cleanCurrent = currentCaptchaCode.value.trim().toUpperCase();
  return testVal.length > 0 && testVal === cleanCurrent;
}

function focus() {
  inputRef.value?.focus();
}

onMounted(() => {
  generateCaptcha();
});

defineExpose({
  generateCaptcha,
  validate,
  focus,
  getCurrentCode: () => currentCaptchaCode.value,
});
</script>
