<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
        dir="rtl"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
          @click="closeModal"
        />

        <!-- Modal Card Container -->
        <div
          class="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200"
        >
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0"
          >
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0"
          >
            <Camera class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              مدیریت تصویر پرسنلی عضو
            </h3>
            <p v-if="memberName" class="text-xs text-slate-500 dark:text-slate-400 font-normal">
              پرونده: {{ memberName }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="بستن"
          @click="closeModal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-6 space-y-5 overflow-y-auto flex-1">
        <!-- Error Message Alert -->
        <div
          v-if="errorMessage"
          class="p-3.5 text-xs font-semibold rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 1. Selection / Drag-and-Drop Area (when no crop source is loaded) -->
        <div v-if="!cropSource" class="space-y-5">
          <!-- Existing photo preview banner if member has a photo -->
          <div
            v-if="currentPhoto"
            class="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3">
              <MemberAvatar
                :profile-image="currentPhoto"
                :full-name="memberName"
                size="lg"
                shape="portrait"
                :timestamp="currentTimestamp"
              />
              <div class="text-xs space-y-1">
                <p class="font-bold text-slate-800 dark:text-slate-200">
                  تصویر پرسنلی فعلی عضو
                </p>
                <p class="text-slate-400">
                  برای تغییر، عکس جدید انتخاب کنید یا با دکمه زیر آن را حذف نمایید.
                </p>
              </div>
            </div>

            <button
              type="button"
              :disabled="isDeleting"
              class="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl transition flex items-center gap-1.5 shrink-0"
              @click="confirmDelete"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>{{ isDeleting ? 'در حال حذف...' : 'حذف تصویر فعلی' }}</span>
            </button>
          </div>

          <!-- Dropzone -->
          <div
            class="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 group text-center"
            :class="[
              isDragging
                ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50/70 dark:hover:bg-slate-800/30',
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef?.click()"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handleFileSelected"
            />

            <div
              class="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs"
            >
              <UploadCloud class="w-8 h-8" />
            </div>

            <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              تصویر پرسنلی را اینجا بکشید یا برای انتخاب فایل کلیک کنید
            </p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mb-3">
              فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۵ مگابایت)
            </p>

            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:bg-brand-50 group-hover:text-brand-700 dark:group-hover:bg-brand-950/60 dark:group-hover:text-brand-300 transition"
            >
              <ImageIcon class="w-3.5 h-3.5" />
              انتخاب عکس از کامپیوتر
            </span>
          </div>
        </div>

        <!-- 2. Interactive Cropper & Canvas Area (when a new file is loaded) -->
        <div v-else class="space-y-4">
          <!-- Aspect ratio selector & re-select button -->
          <div class="flex items-center justify-between text-xs pb-1">
            <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                :class="[
                  'px-3 py-1 rounded-lg font-bold transition text-xs',
                  aspectRatio === 3 / 4
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                ]"
                @click="setAspectRatio(3 / 4)"
              >
                پرسنلی (۳ به ۴)
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-1 rounded-lg font-bold transition text-xs',
                  aspectRatio === 1
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                ]"
                @click="setAspectRatio(1)"
              >
                مربعی (۱ به ۱)
              </button>
            </div>

            <button
              type="button"
              class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              @click="resetSelectedFile"
            >
              <RefreshCw class="w-3.5 h-3.5" />
              انتخاب عکس دیگر
            </button>
          </div>

          <!-- Interactive Viewport Canvas Box -->
          <div
            ref="containerRef"
            class="relative w-full h-80 bg-slate-950 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center border border-slate-800"
            @mousedown="onMouseDown"
            @touchstart="onTouchStart"
            @wheel.prevent="onWheel"
          >
            <!-- Transformed Source Image -->
            <img
              ref="imageElementRef"
              :src="cropSource"
              alt="برش تصویر پرسنلی"
              class="max-w-none pointer-events-none select-none transition-transform duration-75"
              :style="imageTransformStyle"
              @load="onImageLoaded"
            />

            <!-- Dark Vignette Overlay with Centered Crop Window Cutout -->
            <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                class="relative border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] rounded-lg overflow-hidden transition-all duration-200"
                :style="cropBoxStyle"
              >
                <!-- Rule-of-thirds grid guides inside crop box -->
                <div class="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div class="border-r border-b border-white/25" />
                  <div class="border-r border-b border-white/25" />
                  <div class="border-b border-white/25" />
                  <div class="border-r border-b border-white/25" />
                  <div class="border-r border-b border-white/25" />
                  <div class="border-b border-white/25" />
                  <div class="border-r border-white/25" />
                  <div class="border-r border-white/25" />
                  <div />
                </div>
              </div>
            </div>

            <!-- Helpful Drag/Zoom instruction hint badge -->
            <div
              class="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white/80 text-[10px] px-2.5 py-1 rounded-lg pointer-events-none flex items-center gap-1"
            >
              <span>برای جابجایی بکشید • اسکرول برای بزرگ‌نمایی</span>
            </div>
          </div>

          <!-- Toolbar: Zoom slider, Rotate button, Reset view -->
          <div
            class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <!-- Zoom controls -->
            <div class="flex items-center gap-2 flex-1 min-w-[200px]">
              <ZoomOut
                class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                @click="zoomStep(-0.15)"
              />
              <input
                v-model.number="zoom"
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <ZoomIn
                class="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                @click="zoomStep(0.15)"
              />
              <span class="text-[11px] font-mono text-slate-500 w-10 text-left tabular-nums">
                {{ Math.round(zoom * 100) }}%
              </span>
            </div>

            <!-- Rotate & Reset Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 transition"
                title="چرخش ۹۰ درجه در جهت ساعتگرد"
                @click="rotateClockwise"
              >
                <RotateCw class="w-3.5 h-3.5" />
                <span>چرخش</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="بازنشانی کادر و بزرگ‌نمایی"
                @click="resetTransforms"
              >
                بازنشانی
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Upload Progress Indicator -->
        <div v-if="isUploading" class="space-y-1.5 pt-1">
          <div class="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              در حال ارسال و ذخیره تصویر پرسنلی...
            </span>
            <span class="tabular-nums font-mono text-brand-600 dark:text-brand-400">
              {{ uploadProgress }}%
            </span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              class="bg-brand-600 h-2.5 rounded-full transition-all duration-200 ease-out"
              :style="{ width: `${uploadProgress}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div
        class="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0"
      >
        <button
          type="button"
          :disabled="isUploading || isDeleting"
          class="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
          @click="closeModal"
        >
          انصراف
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="cropSource"
            type="button"
            :disabled="isUploading"
            class="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            @click="executeCropAndUpload"
          >
            <Check v-if="!isUploading" class="w-4 h-4" />
            <span
              v-else
              class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            />
            <span>{{ isUploading ? 'در حال ارسال...' : 'تائید و بارگذاری عکس' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Camera,
  X,
  UploadCloud,
  Image as ImageIcon,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Trash2,
  AlertCircle,
  Check,
} from 'lucide-vue-next';
import MemberAvatar from '@/components/ui/MemberAvatar.vue';
import { uploadMemberPhoto, deleteMemberPhoto } from '@/services/member-photo.service';
import { useNotificationStore } from '@/stores';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock';

interface Props {
  isOpen: boolean;
  memberId: string;
  memberName?: string;
  currentPhoto?: string | null;
  currentTimestamp?: number;
}

const props = withDefaults(defineProps<Props>(), {
  memberName: '',
  currentPhoto: null,
  currentTimestamp: 0,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', updatedPhotoPath: string): void;
}>();

const notificationStore = useNotificationStore();

// File input & drag state
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const cropSource = ref<string | null>(null);
const selectedRawFile = ref<File | null>(null);

// Status states
const isUploading = ref(false);
const isDeleting = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref<string | null>(null);

// Interactive Cropper states
const containerRef = ref<HTMLDivElement | null>(null);
const imageElementRef = ref<HTMLImageElement | null>(null);

const aspectRatio = ref<number>(3 / 4); // 3:4 portrait default, or 1 for square
const zoom = ref(1);
const rotation = ref(0); // 0, 90, 180, 270
const panX = ref(0);
const panY = ref(0);

// Drag tracking
const isPanning = ref(false);
const dragStart = { x: 0, y: 0 };
const panStart = { x: 0, y: 0 };

// Crop box dimensions inside preview container
const cropBoxWidth = ref(210); // 210px width
const cropBoxHeight = computed(() => {
  return Math.round(cropBoxWidth.value / aspectRatio.value);
});

const cropBoxStyle = computed(() => ({
  width: `${cropBoxWidth.value}px`,
  height: `${cropBoxHeight.value}px`,
}));

const imageTransformStyle = computed(() => {
  return {
    transform: `translate(${panX.value}px, ${panY.value}px) rotate(${rotation.value}deg) scale(${zoom.value})`,
  };
});

function setAspectRatio(ratio: number) {
  aspectRatio.value = ratio;
  if (ratio === 1) {
    cropBoxWidth.value = 240;
  } else {
    cropBoxWidth.value = 210;
  }
}

function zoomStep(delta: number) {
  const next = Math.max(0.5, Math.min(3.5, Number((zoom.value + delta).toFixed(2))));
  zoom.value = next;
}

function rotateClockwise() {
  rotation.value = (rotation.value + 90) % 360;
}

function resetTransforms() {
  zoom.value = 1;
  rotation.value = 0;
  panX.value = 0;
  panY.value = 0;
}

function onImageLoaded() {
  resetTransforms();
}

// Drag & Pan event handlers
function onMouseDown(e: MouseEvent) {
  isPanning.value = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  panStart.x = panX.value;
  panStart.y = panY.value;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e: MouseEvent) {
  if (!isPanning.value) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  panX.value = panStart.x + dx;
  panY.value = panStart.y + dy;
}

function onMouseUp() {
  isPanning.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isPanning.value = true;
    dragStart.x = e.touches[0].clientX;
    dragStart.y = e.touches[0].clientY;
    panStart.x = panX.value;
    panStart.y = panY.value;

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }
}

function onTouchMove(e: TouchEvent) {
  if (!isPanning.value || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - dragStart.x;
  const dy = e.touches[0].clientY - dragStart.y;
  panX.value = panStart.x + dx;
  panY.value = panStart.y + dy;
}

function onTouchEnd() {
  isPanning.value = false;
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
}

function onWheel(e: WheelEvent) {
  const delta = e.deltaY < 0 ? 0.1 : -0.1;
  zoomStep(delta);
}

// File Selection & Validation
function handleFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    processFile(target.files[0]);
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0]);
  }
}

function processFile(file: File) {
  errorMessage.value = null;

  // Validate format
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    errorMessage.value = 'فرمت فایل معتبر نیست. لطفاً تصویر JPG، PNG یا WEBP انتخاب کنید.';
    return;
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'حجم فایل بیشتر از ۵ مگابایت است.';
    return;
  }

  selectedRawFile.value = file;
  if (cropSource.value) {
    URL.revokeObjectURL(cropSource.value);
  }
  cropSource.value = URL.createObjectURL(file);
}

function resetSelectedFile() {
  if (cropSource.value) {
    URL.revokeObjectURL(cropSource.value);
  }
  cropSource.value = null;
  selectedRawFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
  errorMessage.value = null;
  resetTransforms();
}

/**
 * Renders the visible crop area to an offscreen canvas and converts to Blob
 */
async function generateCroppedBlob(): Promise<Blob> {
  const img = imageElementRef.value;
  const container = containerRef.value;
  if (!img || !container) {
    throw new Error('Image or preview container element is missing');
  }

  // Desired high-res output dimensions
  const targetWidth = aspectRatio.value === 1 ? 800 : 600;
  const targetHeight = aspectRatio.value === 1 ? 800 : 800;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // Background white for transparent PNGs converted to JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Compute the scale factor between the onscreen crop box and the target canvas
  const scaleToCanvas = targetWidth / cropBoxWidth.value;

  ctx.save();
  // Move origin to center of target canvas
  ctx.translate(targetWidth / 2, targetHeight / 2);

  // Apply user rotation
  ctx.rotate((rotation.value * Math.PI) / 180);

  // Apply user pan and zoom scaled to output resolution
  ctx.scale(zoom.value * scaleToCanvas, zoom.value * scaleToCanvas);
  ctx.translate(panX.value, panY.value);

  // Draw image centered
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  ctx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2, naturalWidth, naturalHeight);

  ctx.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob generated an empty blob'));
        }
      },
      'image/jpeg',
      0.92
    );
  });
}

async function executeCropAndUpload() {
  if (!props.memberId) {
    errorMessage.value = 'شناسه عضو معتبر نیست.';
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  errorMessage.value = null;

  try {
    const croppedBlob = await generateCroppedBlob();
    const updatedMember = await uploadMemberPhoto(
      props.memberId,
      croppedBlob,
      (progress) => {
        uploadProgress.value = progress;
      }
    );

    notificationStore.success('تصویر پرسنلی عضو با موفقیت بارگذاری شد.');
    emit('updated', updatedMember.profileImage || '');
    closeModal();
  } catch (err: any) {
    const msg =
      err.response?.data?.message || err.message || 'خطا در بارگذاری و پردازش تصویر پرسنلی';
    errorMessage.value = msg;
    notificationStore.error(msg);
  } finally {
    isUploading.value = false;
  }
}

async function confirmDelete() {
  if (!props.memberId) return;

  const confirmed = window.confirm('آیا از حذف تصویر پرسنلی این عضو اطمینان دارید؟');
  if (!confirmed) return;

  isDeleting.value = true;
  errorMessage.value = null;

  try {
    await deleteMemberPhoto(props.memberId);
    notificationStore.success('تصویر پرسنلی عضو با موفقیت حذف شد.');
    emit('updated', '');
    closeModal();
  } catch (err: any) {
    const msg = err.response?.data?.message || 'خطا در حذف تصویر پرسنلی';
    errorMessage.value = msg;
    notificationStore.error(msg);
  } finally {
    isDeleting.value = false;
  }
}

function closeModal() {
  if (isUploading.value) return;
  resetSelectedFile();
  emit('close');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen && !isUploading.value) {
    closeModal();
  }
}

// Cleanup object URLs, scrollLock and listeners
watch(
  () => props.isOpen,
  (val, oldVal) => {
    if (val && !oldVal) {
      lockBodyScroll();
    } else if (!val && oldVal) {
      unlockBodyScroll();
      resetSelectedFile();
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  if (props.isOpen) {
    lockBodyScroll();
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (props.isOpen) {
    unlockBodyScroll();
  }
  if (cropSource.value) {
    URL.revokeObjectURL(cropSource.value);
  }
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
});
</script>
