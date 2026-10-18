<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { Modal, Button } from '@/components/ui';
import {
  FileText,
  Download,
  ExternalLink,
  Award,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-vue-next';
import {
  base64ToBlob,
  isPdfDocument,
  isImageDocument,
  resolveCertificateUrl,
} from '@/utils/skills';

interface Props {
  open: boolean;
  fileUrl?: string;
  title?: string;
  specializationTitle?: string;
  memberName?: string;
  zIndex?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  fileUrl: '',
  title: 'مشاهده گواهینامه',
  specializationTitle: '',
  memberName: '',
  zIndex: 'z-[80]',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

// Document state
type DocKind = 'loading' | 'pdf' | 'image' | 'error' | 'empty';
const docKind = ref<DocKind>('loading');
const errorMessage = ref('');

// Resolved URL for displaying images or fetching
const displayUrl = ref<string>('');

// For PDF: Blob URL is needed so browsers render it natively without data/cross-origin iframe blocks
const activeBlobUrl = ref<string>('');

// Image zoom & rotate controls
const imageZoom = ref(1);
const imageRotation = ref(0);
const isImageLoading = ref(true);
let didFallbackImage = false;

// Cleanup created blob URL to prevent memory leaks
function cleanupBlobUrl() {
  if (activeBlobUrl.value && activeBlobUrl.value.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(activeBlobUrl.value);
    } catch {
      // Ignore
    }
    activeBlobUrl.value = '';
  }
}

onUnmounted(() => {
  cleanupBlobUrl();
});

// Watch open state and fileUrl to resolve document kind
watch(
  [() => props.open, () => props.fileUrl],
  ([isOpen, url]) => {
    if (!isOpen) {
      cleanupBlobUrl();
      resetImageControls();
      return;
    }
    resolveDocument(url);
  },
  { immediate: true }
);

function resetImageControls() {
  imageZoom.value = 1;
  imageRotation.value = 0;
  isImageLoading.value = true;
  didFallbackImage = false;
}

async function resolveDocument(url?: string) {
  cleanupBlobUrl();
  resetImageControls();
  errorMessage.value = '';

  if (!url || !url.trim()) {
    docKind.value = 'empty';
    displayUrl.value = '';
    return;
  }

  const rawUrl = url.trim();
  const fullUrl = resolveCertificateUrl(rawUrl);
  displayUrl.value = fullUrl;
  docKind.value = 'loading';

  try {
    // 1. Base64 PDF
    if (
      rawUrl.startsWith('data:application/pdf') ||
      rawUrl.startsWith('data:pdf/') ||
      rawUrl.startsWith('JVBERi0')
    ) {
      const blob = base64ToBlob(rawUrl, 'application/pdf');
      activeBlobUrl.value = URL.createObjectURL(blob);
      docKind.value = 'pdf';
      return;
    }

    // 2. Base64 Image
    if (rawUrl.startsWith('data:image/')) {
      docKind.value = 'image';
      return;
    }

    // 3. Blob URLs
    if (rawUrl.startsWith('blob:')) {
      try {
        const response = await fetch(rawUrl);
        if (!response.ok) {
          throw new Error('Blob expired');
        }
        const blob = await response.blob();
        if (blob.type === 'application/pdf') {
          activeBlobUrl.value = rawUrl;
          docKind.value = 'pdf';
          return;
        }
        if (blob.type.startsWith('image/')) {
          docKind.value = 'image';
          return;
        }

        // Check magic bytes
        const buffer = await blob.slice(0, 8).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
          activeBlobUrl.value = rawUrl;
          docKind.value = 'pdf';
          return;
        }
        docKind.value = 'image';
        return;
      } catch {
        docKind.value = 'error';
        errorMessage.value = 'پیوند موقت این مدرک منقضی شده است. لطفاً فایل را مجدداً بارگذاری فرمایید.';
        return;
      }
    }

    // 4. PDF (by extension or heuristic)
    if (isPdfDocument(fullUrl) || isPdfDocument(rawUrl)) {
      docKind.value = 'pdf';
      try {
        // Fetch as blob to guarantee smooth rendering without iframe origin or header restrictions
        const res = await fetch(fullUrl);
        if (res.ok) {
          const blob = await res.blob();
          activeBlobUrl.value = URL.createObjectURL(blob);
        } else {
          activeBlobUrl.value = fullUrl;
        }
      } catch {
        activeBlobUrl.value = fullUrl;
      }
      return;
    }

    // 5. Image (by extension or heuristic)
    if (isImageDocument(fullUrl) || isImageDocument(rawUrl)) {
      docKind.value = 'image';
      return;
    }

    // 6. Unknown extension: test via fetch
    try {
      const checkRes = await fetch(fullUrl, { method: 'GET' });
      const ct = checkRes.headers.get('content-type') || '';
      if (ct.includes('application/pdf')) {
        docKind.value = 'pdf';
        const blob = await checkRes.blob();
        activeBlobUrl.value = URL.createObjectURL(blob);
        return;
      }
      if (ct.includes('image/')) {
        docKind.value = 'image';
        return;
      }
    } catch {
      // Default to image
    }

    docKind.value = 'image';
  } catch (err: any) {
    console.error('Failed to resolve document preview:', err);
    docKind.value = 'error';
    errorMessage.value = 'بارگذاری پیش‌نمایش سند با خطا مواجه شد.';
  }
}

// Image load error fallback handler
function handleImageError() {
  // If absolute backend URL failed, fallback to relative proxy path or vice-versa
  if (!didFallbackImage) {
    didFallbackImage = true;
    if (displayUrl.value.includes(':5000/')) {
      displayUrl.value = displayUrl.value.replace(/^https?:\/\/[^/]+:5000/, '');
      return;
    } else if (displayUrl.value.startsWith('/uploads/')) {
      displayUrl.value = `http://localhost:5000${displayUrl.value}`;
      return;
    }
  }

  isImageLoading.value = false;
  docKind.value = 'error';
  errorMessage.value = 'تصویر گواهینامه در دسترس نیست یا بارگذاری نشد.';
}

// Zoom controls
function zoomIn() {
  if (imageZoom.value < 3) {
    imageZoom.value = Math.min(3, +(imageZoom.value + 0.25).toFixed(2));
  }
}

function zoomOut() {
  if (imageZoom.value > 0.5) {
    imageZoom.value = Math.max(0.5, +(imageZoom.value - 0.25).toFixed(2));
  }
}

function rotate() {
  imageRotation.value = (imageRotation.value + 90) % 360;
}

function resetZoom() {
  imageZoom.value = 1;
  imageRotation.value = 0;
}

// Download handler
function handleDownload() {
  const targetUrl = docKind.value === 'pdf' ? (activeBlobUrl.value || displayUrl.value) : displayUrl.value;
  if (!targetUrl) return;

  const isPdf = docKind.value === 'pdf';
  const ext = isPdf ? 'pdf' : detectImageExtension(displayUrl.value || props.fileUrl);

  const rawTitle = (props.title || 'certificate').replace(/[\\/:*?"<>|]/g, '_').trim();
  const filename = rawTitle.toLowerCase().endsWith(`.${ext}`) ? rawTitle : `${rawTitle}.${ext}`;

  const link = document.createElement('a');
  link.href = targetUrl;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function detectImageExtension(url: string): string {
  if (url.includes('.png') || url.startsWith('data:image/png')) return 'png';
  if (url.includes('.webp') || url.startsWith('data:image/webp')) return 'webp';
  if (url.includes('.gif') || url.startsWith('data:image/gif')) return 'gif';
  if (url.includes('.svg') || url.startsWith('data:image/svg')) return 'svg';
  return 'jpg';
}

const externalUrl = computed(() => {
  if (docKind.value === 'pdf') {
    return activeBlobUrl.value || displayUrl.value;
  }
  return displayUrl.value;
});
</script>

<template>
  <Modal
    :open="open"
    size="xl"
    :z-index="zIndex"
    @close="emit('update:open', false)"
  >
    <template #header>
      <div class="w-full flex items-center justify-between text-right gap-3" dir="rtl">
        <!-- Title and Metadata -->
        <div class="flex items-center gap-3 min-w-0">
          <div
            :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors',
              docKind === 'pdf'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
            ]"
          >
            <component :is="docKind === 'pdf' ? FileText : Award" class="w-5 h-5" />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {{ title || 'مشاهده گواهینامه معتبر مهارت' }}
              </h3>

              <!-- Format Badge -->
              <span
                v-if="docKind === 'pdf'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black tracking-wide bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800"
              >
                <FileText class="w-3 h-3" />
                <span>سند PDF</span>
              </span>

              <span
                v-else-if="docKind === 'image'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800"
              >
                <ImageIcon class="w-3 h-3" />
                <span>تصویر مدرک</span>
              </span>
            </div>

            <p v-if="specializationTitle || memberName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 truncate">
              <span v-if="specializationTitle" class="truncate">رسته: {{ specializationTitle }}</span>
              <span v-if="specializationTitle && memberName">•</span>
              <span v-if="memberName" class="truncate">عضو: {{ memberName }}</span>
            </p>
          </div>
        </div>

        <!-- Action Tools (Zoom for Image, External Link & Download) -->
        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Image Zoom / Rotate Controls -->
          <div
            v-if="docKind === 'image'"
            class="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ml-1"
          >
            <button
              type="button"
              class="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-40 cursor-pointer"
              title="بزرگ‌نمایی (+)"
              :disabled="imageZoom >= 3"
              @click="zoomIn"
            >
              <ZoomIn class="w-4 h-4" />
            </button>

            <span class="text-[10px] font-bold font-mono px-1 tabular-nums text-slate-600 dark:text-slate-300">
              {{ Math.round(imageZoom * 100) }}٪
            </span>

            <button
              type="button"
              class="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-40 cursor-pointer"
              title="کوچک‌نمایی (-)"
              :disabled="imageZoom <= 0.5"
              @click="zoomOut"
            >
              <ZoomOut class="w-4 h-4" />
            </button>

            <button
              type="button"
              class="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              title="چرخش ۹۰ درجه"
              @click="rotate"
            >
              <RotateCw class="w-4 h-4" />
            </button>

            <button
              v-if="imageZoom !== 1 || imageRotation !== 0"
              type="button"
              class="p-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              title="بازنشانی اندازه و جهت"
              @click="resetZoom"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
          </div>

          <!-- Open in Separate Tab -->
          <a
            v-if="externalUrl"
            :href="externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="باز کردن در برگه مجزا"
          >
            <ExternalLink class="w-4 h-4" />
            <span class="hidden md:inline">برگه جدید</span>
          </a>

          <!-- Download Button -->
          <Button
            v-if="displayUrl || fileUrl"
            variant="outline"
            size="sm"
            class="h-8 text-xs"
            @click="handleDownload"
          >
            <Download class="w-4 h-4 ml-1" />
            <span class="hidden sm:inline">دانلود فایل</span>
          </Button>
        </div>
      </div>
    </template>

    <!-- Preview Canvas Area -->
    <div
      class="min-h-[460px] max-h-[72vh] overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-950/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative"
      dir="ltr"
    >
      <!-- 1. Loading State -->
      <div v-if="docKind === 'loading'" class="flex flex-col items-center justify-center gap-3 py-16 text-center select-none" dir="rtl">
        <Loader2 class="w-9 h-9 text-brand-600 animate-spin" />
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300">در حال آماده‌سازی و بارگذاری مدرک...</p>
      </div>

      <!-- 2. PDF Document Viewer (Rendered natively via Blob URL) -->
      <div v-else-if="docKind === 'pdf'" class="w-full h-[65vh] flex flex-col bg-slate-900/5 dark:bg-slate-950">
        <iframe
          v-if="activeBlobUrl"
          :src="activeBlobUrl"
          class="w-full h-full rounded-2xl border-0 bg-white"
          title="نمایش سند گواهینامه PDF"
        ></iframe>

        <div v-else class="flex flex-col items-center justify-center h-full p-8 text-center space-y-3" dir="rtl">
          <FileText class="w-12 h-12 text-rose-500 mx-auto" />
          <p class="text-xs font-bold text-slate-700 dark:text-slate-200">
            سند گواهینامه در قالب PDF آماده شده است.
          </p>
          <a
            :href="activeBlobUrl || displayUrl || fileUrl"
            target="_blank"
            class="text-xs text-brand-600 underline font-bold"
          >
            برای مشاهده مستقیم یا چاپ، اینجا کلیک کنید
          </a>
        </div>
      </div>

      <!-- 3. Image Document Viewer (with zoom/rotate/pan capability) -->
      <div
        v-else-if="docKind === 'image'"
        class="w-full h-[65vh] overflow-auto flex items-center justify-center p-4 select-none relative"
      >
        <!-- Image Loader Spinner -->
        <div v-if="isImageLoading" class="absolute inset-0 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/70 z-10">
          <Loader2 class="w-8 h-8 text-brand-600 animate-spin" />
        </div>

        <img
          v-if="displayUrl"
          :src="displayUrl"
          :alt="title || 'Certificate Image'"
          :style="{
            transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }"
          class="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800"
          @load="isImageLoading = false"
          @error="handleImageError"
        />
      </div>

      <!-- 4. Error State (Expired Blob / Network issue) -->
      <div v-else-if="docKind === 'error'" class="p-8 text-center space-y-3 max-w-md mx-auto" dir="rtl">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">
          عدم امکان نمایش مستقیم مدرک
        </h4>
        <p class="text-xs text-slate-500 leading-relaxed">
          {{ errorMessage || 'فایل ارسالی دارای پیوند نامعتبر است یا بارگذاری نشد.' }}
        </p>
        <div class="pt-2 flex items-center justify-center gap-2">
          <Button variant="primary" size="sm" @click="resolveDocument(fileUrl)">
            تلاش مجدد
          </Button>
          <Button v-if="displayUrl || fileUrl" variant="outline" size="sm" @click="handleDownload">
            <Download class="w-4 h-4 ml-1" />
            دانلود فایل
          </Button>
        </div>
      </div>

      <!-- 5. Empty State -->
      <div v-else class="p-8 text-center space-y-3" dir="rtl">
        <FileText class="w-12 h-12 text-slate-300 mx-auto" />
        <p class="text-xs font-bold text-slate-600 dark:text-slate-400">
          فایل یا مدرکی برای این مهارت الصاق نشده است.
        </p>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="w-full flex items-center justify-between" dir="rtl">
        <div class="flex items-center gap-2 text-2xs text-slate-500 dark:text-slate-400">
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
          <span>گواهینامه تائیدیه مهارت تخصصی عضو صنف رایانه‌ای</span>
        </div>

        <Button variant="secondary" size="sm" @click="emit('update:open', false)">
          بستن
        </Button>
      </div>
    </template>
  </Modal>
</template>
