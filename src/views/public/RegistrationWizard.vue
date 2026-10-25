<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  User,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  // UploadCloud, // TODO: فعال‌سازی هم‌زمان با تب مدارک
  // FileCheck,
  // FileX,
  Printer,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-vue-next';
import { publicApi } from '@/api';
import { DatePicker } from '@/components/ui';
import { IRAN_PROVINCES } from '@/data/iran-locations';
import {
  toPersianDigits,
  isValidNationalCode,
} from '@/utils/formatters';
import type {
  PublicRegistrationPayload,
  DocumentUploadItem,
  RegistrationTrackRecord,
} from '@/types';

const emit = defineEmits<{
  (e: 'completed', trackingCode: string): void;
}>();

const currentStep = ref(1);
const isSubmitting = ref(false);
const submitSuccess = ref(false);
const submittedRecord = ref<RegistrationTrackRecord | null>(null);
const isCodeCopied = ref(false);

// مراحل فرآیند ثبت‌نام (مرحله ۳ - مدارک موقتاً تا آماده‌سازی API بک‌اند کامنت شده است)
const steps = [
  { num: 1, label: 'مشخصات هویتی' },
  { num: 2, label: 'تخصص و نشانی' },
  // { num: 3, label: 'مدارک و ارسال' }, // TODO: پس از آماده‌سازی API مدارک در بک‌اند آن‌کامنت شود
];

// Form model
const form = reactive<PublicRegistrationPayload>({
  kind: 'REAL',
  membershipCategory: 'عضویت شخص حقیقی (کارشناس / مشاور فاوا)',
  firstName: '',
  lastName: '',
  nationalCode: '',
  fatherName: '',
  gender: 'MALE',
  birthDate: '1371/03/08',
  idNumber: '',

  // Legal fields
  companyName: '',
  companyNationalId: '',
  companyRegistrationNumber: '',
  companyEconomicCode: '',
  representativePosition: 'مدیرعامل',

  // Contact
  mobilePhone: '',
  phone: '',
  email: '',
  province: 'اردبیل',
  city: 'اردبیل',
  postalCode: '',
  address: '',

  // Professional
  specialization: 'نرم‌افزار، سامانه‌های اطلاعاتی و هوش مصنوعی',
  degreeLevel: 'کارشناسی',
  academicField: 'مهندسی کامپیوتر',
  experienceYears: 4,

  // Documents
  documents: [],

  // Terms
  acceptedTerms: true,
});

// Document placeholders
const docItems = ref<DocumentUploadItem[]>([
  {
    id: 'national_card',
    field: 'national_card',
    title: 'تصویر کارت ملی (پشت و رو)',
    required: true,
  },
  {
    id: 'identity_doc',
    field: 'identity_doc',
    title: 'تصویر صفحه اول شناسنامه',
    required: true,
  },
  {
    id: 'degree_or_gazette',
    field: 'degree_or_gazette',
    title: 'تصویر دانشنامه تحصیلی کارشناسی یا بالاتر',
    required: true,
  },
  {
    id: 'photo',
    field: 'photo',
    title: 'عکس پرسنلی ۴×۳ (زمینه سفید)',
    required: true,
  },
]);

// Error dictionary
const errors = reactive<Record<string, string>>({});

// Cities for current province
const currentCities = computed(() => {
  const p = IRAN_PROVINCES.find((x) => x.name === form.province);
  return p ? p.cities : [];
});

watch(
  () => form.province,
  (newProv) => {
    const p = IRAN_PROVINCES.find((x) => x.name === newProv);
    if (p && p.cities.length > 0) {
      form.city = p.cities[0];
    }
  }
);

watch(
  () => form.kind,
  (newKind) => {
    if (newKind === 'REAL') {
      form.membershipCategory = 'عضویت شخص حقیقی (کارشناس / مشاور فاوا)';
      docItems.value[2].title = 'تصویر دانشنامه تحصیلی کارشناسی یا بالاتر';
    } else {
      form.membershipCategory = 'عضویت شخص حقوقی (شرکت‌ها و موسسات)';
      docItems.value[2].title = 'آگهی تاسیس و آخرین تغییرات روزنامه رسمی شرکت';
    }
  }
);

// Validation for each step
function validateStep(step: number): boolean {
  Object.keys(errors).forEach((key) => delete errors[key]);

  // Step 1: Identity & Entity
  if (step === 1) {
    let valid = true;
    if (form.kind === 'LEGAL') {
      if (!form.companyName?.trim()) {
        errors.companyName = 'نام ثبتی شرکت الزامی است.';
        valid = false;
      }
      if (!form.companyNationalId?.trim() || form.companyNationalId.trim().length < 10) {
        errors.companyNationalId = 'شناسه ملی ۱۱ رقمی شرکت الزامی است.';
        valid = false;
      }
    }

    if (!form.firstName.trim()) {
      errors.firstName = 'نام را وارد نمایید.';
      valid = false;
    }
    if (!form.lastName.trim()) {
      errors.lastName = 'نام خانوادگی را وارد نمایید.';
      valid = false;
    }
    if (!form.nationalCode.trim()) {
      errors.nationalCode = 'کد ملی ده‌رقمی الزامی است.';
      valid = false;
    } else if (!isValidNationalCode(form.nationalCode.trim())) {
      errors.nationalCode = 'کد ملی وارد شده نامعتبر است (کنترل ده‌رقمی نادرست است).';
      valid = false;
    }
    if (!form.fatherName.trim()) {
      errors.fatherName = 'نام پدر الزامی است.';
      valid = false;
    }
    if (!form.birthDate) {
      errors.birthDate = 'تاریخ تولد الزامی است.';
      valid = false;
    }
    return valid;
  }

  // Step 2: Contact, Specialization & Address
  if (step === 2) {
    let valid = true;
    if (!form.mobilePhone.trim()) {
      errors.mobilePhone = 'شماره تلفن همراه الزامی است.';
      valid = false;
    } else if (!/^(\+98|0)?9\d{9}$/.test(form.mobilePhone.trim())) {
      errors.mobilePhone = 'فرمت شماره همراه نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).';
      valid = false;
    }
    if (!form.specialization) {
      errors.specialization = 'رسته تخصصی را انتخاب نمایید.';
      valid = false;
    }
    if (!form.postalCode.trim() || form.postalCode.trim().length !== 10) {
      errors.postalCode = 'کد پستی ده‌رقمی الزامی است.';
      valid = false;
    }
    if (!form.address.trim()) {
      errors.address = 'نشانی دقیق پستی الزامی است.';
      valid = false;
    }
    if (!form.acceptedTerms) {
      errors.acceptedTerms = 'لطفاً تایید قوانین و مقررات را علامت بزنید.';
      valid = false;
    }
    return valid;
  }

  // Step 3: Documents & Terms (آماده برای زمان فعال‌سازی مجدد)
  if (step === 3) {
    let valid = true;
    for (const doc of docItems.value) {
      if (doc.required && !doc.fileName) {
        errors[doc.field] = `بارگذاری "${doc.title}" الزامی است.`;
        valid = false;
      }
    }
    if (!form.acceptedTerms) {
      errors.acceptedTerms = 'لطفاً تایید اساسنامه و مرامنامه را علامت بزنید.';
      valid = false;
    }
    return valid;
  }

  return true;
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < steps.length) {
      currentStep.value++;
      scrollToForm();
    }
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
    scrollToForm();
  }
}

function goToStep(step: number) {
  if (step > steps.length) return;
  if (step < currentStep.value) {
    currentStep.value = step;
    scrollToForm();
  } else if (validateStep(currentStep.value)) {
    currentStep.value = step;
    scrollToForm();
  }
}

function scrollToForm() {
  const el = document.getElementById('register-card');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/*
// =========================================================================
// توابع مدیریت بارگذاری مدارک (پس از آماده‌سازی API بک‌اند آن‌کامنت شوند)
// =========================================================================
function handleFileUpload(docId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];

  const doc = docItems.value.find((d) => d.id === docId);
  if (!doc) return;

  if (file.size > 5 * 1024 * 1024) {
    errors[doc.field] = 'حجم فایل نباید بیش از ۵ مگابایت باشد.';
    return;
  }

  doc.fileName = file.name;
  doc.fileSize = file.size;
  doc.fileType = file.type;
  doc.uploadedAt = new Date().toISOString();
  delete errors[doc.field];

  const reader = new FileReader();
  reader.onload = (e) => {
    doc.dataUrl = e.target?.result as string;
    doc.previewUrl = doc.dataUrl;
  };
  reader.readAsDataURL(file);
}

function removeFile(docId: string) {
  const doc = docItems.value.find((d) => d.id === docId);
  if (doc) {
    doc.fileName = undefined;
    doc.fileSize = undefined;
    doc.previewUrl = undefined;
    doc.dataUrl = undefined;
  }
}
*/

// Submit
async function handleSubmit() {
  if (!validateStep(currentStep.value)) return;

  isSubmitting.value = true;
  try {
    form.documents = [...docItems.value];
    const res = await publicApi.submitRegistration(form);
    if (res.success) {
      submittedRecord.value = res.record;
      submitSuccess.value = true;
      emit('completed', res.trackingCode);
      scrollToForm();
    }
  } catch (err: any) {
    errors.submit = err.message || 'خطا در ثبت اطلاعات. لطفاً دوباره تلاش فرمایید.';
  } finally {
    isSubmitting.value = false;
  }
}

function copyTrackingCode() {
  if (submittedRecord.value?.trackingCode) {
    navigator.clipboard.writeText(submittedRecord.value.trackingCode);
    isCodeCopied.value = true;
    setTimeout(() => {
      isCodeCopied.value = false;
    }, 2000);
  }
}

function printReceipt() {
  window.print();
}

function resetForm() {
  submitSuccess.value = false;
  submittedRecord.value = null;
  currentStep.value = 1;
  docItems.value.forEach((d) => {
    d.fileName = undefined;
    d.previewUrl = undefined;
  });
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto" dir="rtl" id="register-card">
    <!-- Success State -->
    <div
      v-if="submitSuccess && submittedRecord"
      class="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden"
    >
      <div class="text-center max-w-lg mx-auto space-y-5">
        <!-- Success Icon -->
        <div class="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-600/15">
          <CheckCircle2 class="w-9 h-9" />
        </div>

        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 mb-2">
            ثبت‌نام با موفقیت انجام شد
          </span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            درخواست عضویت شما در سامانه ثبت گردید
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            پرونده شما جهت بررسی اولیه در اختیار کارشناسان دبیرخانه استانی قرار گرفت. پیامک تایید نیز به شماره همراه شما ارسال شد.
          </p>
        </div>

        <!-- Tracking Code Card -->
        <div class="p-5 rounded-2xl bg-brand-50/80 dark:bg-slate-800/80 border border-brand-200 dark:border-brand-800 text-center space-y-2">
          <span class="text-xs font-bold text-brand-800 dark:text-brand-300 block">
            کد رهگیری پرونده شما:
          </span>
          <div class="flex items-center justify-center gap-3">
            <span class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-wider select-all" dir="ltr">
              {{ submittedRecord.trackingCode }}
            </span>
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              @click="copyTrackingCode"
            >
              <Check v-if="isCodeCopied" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              <span>{{ isCodeCopied ? 'کپی شد' : 'کپی کد' }}</span>
            </button>
          </div>
          <p class="text-2xs text-slate-500 dark:text-slate-400">
            برای استعلام و پیگیری لحظه‌ای پرونده، این کد را ذخیره داشته باشید.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            type="button"
            class="h-11 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-600/25 transition-all cursor-pointer"
            @click="printReceipt"
          >
            <Printer class="w-4 h-4" />
            <span>چاپ و ذخیره رسید ثبت‌نام</span>
          </button>
          <button
            type="button"
            class="h-11 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            @click="resetForm"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>ثبت‌نام جدید</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Wizard Form Card -->
    <div
      v-else
      class="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
    >
      <!-- Top Segmented Switcher: Real vs Legal -->
      <div class="p-3.5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center justify-center">
          <div class="inline-flex flex-col sm:flex-row p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800 w-full max-w-xl gap-1 sm:gap-0">
            <button
              type="button"
              class="w-full sm:flex-1 py-3 px-3 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap min-h-[44px]"
              :class="[
                form.kind === 'REAL'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
              ]"
              @click="form.kind = 'REAL'"
            >
              <User class="w-4 h-4 shrink-0" />
              <span class="whitespace-nowrap">شخص حقیقی (کارشناس / مشاور)</span>
            </button>

            <button
              type="button"
              class="w-full sm:flex-1 py-3 px-3 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap min-h-[44px]"
              :class="[
                form.kind === 'LEGAL'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
              ]"
              @click="form.kind = 'LEGAL'"
            >
              <Building2 class="w-4 h-4 shrink-0" />
              <span class="whitespace-nowrap">شخص حقوقی (شرکت / موسسه)</span>
            </button>
          </div>
        </div>

        <!-- Sleek Progress Indicator -->
        <div class="flex items-center justify-between sm:justify-center gap-2 sm:gap-8 mt-4 sm:mt-6 max-w-lg mx-auto px-1 sm:px-0">
          <button
            v-for="st in steps"
            :key="st.num"
            type="button"
            class="flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none"
            @click="goToStep(st.num)"
          >
            <span
              class="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-extrabold flex items-center justify-center transition-all shrink-0"
              :class="[
                currentStep === st.num
                  ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/30'
                  : currentStep > st.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
              ]"
            >
              <Check v-if="currentStep > st.num" class="w-3.5 h-3.5" />
              <span v-else>{{ toPersianDigits(st.num) }}</span>
            </span>
            <span
              class="text-3xs sm:text-xs font-bold transition-colors"
              :class="[
                currentStep === st.num
                  ? 'text-brand-600 dark:text-brand-400 font-black'
                  : 'text-slate-500 dark:text-slate-400',
              ]"
            >
              {{ st.label }}
            </span>
          </button>
        </div>
      </div>

      <!-- Form Body -->
      <div class="p-4 sm:p-8">
        <!-- STEP 1: مشخصات هویتی -->
        <div v-if="currentStep === 1" class="space-y-5">
          <div class="text-right pb-2">
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
              {{ form.kind === 'REAL' ? 'مشخصات فردی متقاضی' : 'اطلاعات شرکت و نماینده قانونی' }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              اطلاعات را مطابق با مدارک هویتی رسمی وارد نمایید.
            </p>
          </div>

          <!-- Company fields if legal -->
          <div
            v-if="form.kind === 'LEGAL'"
            class="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-4"
          >
            <span class="text-xs font-bold text-amber-900 dark:text-amber-300 block">
              اطلاعات ثبتی شرکت / استارتاپ:
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام کامل ثبتی شرکت <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="form.companyName"
                  type="text"
                  placeholder="نام ثبتی شرکت را وارد نمایید"
                  class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p v-if="errors.companyName" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.companyName }}</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شناسه ملی ۱۱ رقمی شرکت <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="form.companyNationalId"
                  type="text"
                  placeholder="شناسه ملی ۱۱ رقمی را وارد نمایید"
                  maxlength="11"
                  dir="ltr"
                  class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                />
                <p v-if="errors.companyNationalId" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.companyNationalId }}</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سمت نماینده در شرکت
                </label>
                <select
                  v-model="form.representativePosition"
                  class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="مدیرعامل">مدیرعامل</option>
                  <option value="رئیس هیئت مدیره">رئیس هیئت مدیره</option>
                  <option value="عضو هیئت مدیره و نماینده تام‌الاختیار">عضو هیئت مدیره / نماینده تام‌الاختیار</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Personal identity inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.firstName"
                type="text"
                placeholder="نام را وارد نمایید"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <p v-if="errors.firstName" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.firstName }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام خانوادگی <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.lastName"
                type="text"
                placeholder="نام خانوادگی را وارد نمایید"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <p v-if="errors.lastName" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.lastName }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                کد ملی ده‌رقمی <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.nationalCode"
                type="text"
                placeholder="کد ملی ۱۰ رقمی را وارد نمایید"
                maxlength="10"
                dir="ltr"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              />
              <p v-if="errors.nationalCode" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.nationalCode }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام پدر <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.fatherName"
                type="text"
                placeholder="نام پدر"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <p v-if="errors.fatherName" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.fatherName }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                جنسیت
              </label>
              <select
                v-model="form.gender"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="MALE">مرد</option>
                <option value="FEMALE">زن</option>
              </select>
            </div>

            <div>
              <DatePicker
                v-model="form.birthDate"
                output-format="jalali"
                label="تاریخ تولد (شمسی)"
                placeholder="انتخاب تاریخ تولد..."
                input-class="bg-slate-50 dark:bg-slate-800"
                :error="errors.birthDate"
              />
            </div>
          </div>
        </div>

        <!-- STEP 2: تخصص و نشانی -->
        <div v-else-if="currentStep === 2" class="space-y-5">
          <div class="text-right pb-2">
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
              اطلاعات ارتباطی و رسته تخصصی
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              جهت هماهنگی، ارسال پیامک‌های سامانه و تعیین شعبه نظام صنفی.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                شماره تلفن همراه (پیامک تایید) <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.mobilePhone"
                type="text"
                placeholder="شماره همراه را وارد نمایید"
                maxlength="11"
                dir="ltr"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              />
              <p v-if="errors.mobilePhone" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.mobilePhone }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رایانامه (ایمیل)
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="پست الکترونیکی را وارد نمایید"
                dir="ltr"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رسته و تخصص اصلی <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="form.specialization"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="نرم‌افزار، سامانه‌های اطلاعاتی و هوش مصنوعی">نرم‌افزار، هوش مصنوعی، داده و سامانه‌های ابری</option>
                <option value="شبکه، زیرساخت و مراکز داده">شبکه، زیرساخت و تجهیزات ارتباطی</option>
                <option value="امنیت اطلاعات و فضای سایبری (افتا)">امنیت فضای تبادل اطلاعات (افتا) و تست نفوذ</option>
                <option value="سخت‌افزار، سرور و سامانه‌های دیجیتال">سخت‌افزار، قطعات، سرور و پشتیبانی فنی</option>
                <option value="مشاوره، نظارت و مدیریت طرح‌های فاوا">مشاوره، نظارت و مدیریت پروژه‌های ICT</option>
              </select>
              <p v-if="errors.specialization" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.specialization }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                آخرین مدرک تحصیلی
              </label>
              <select
                v-model="form.degreeLevel"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="کارشناسی">کارشناسی (لیسانس)</option>
                <option value="کارشناسی ارشد">کارشناسی ارشد (فوق لیسانس)</option>
                <option value="دکتری تخصصی">دکتری تخصصی (Ph.D)</option>
                <option value="کاردانی">کاردانی (فوق دیپلم)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رشته تحصیلی
              </label>
              <input
                v-model="form.academicField"
                type="text"
                placeholder="رشته تحصیلی را وارد نمایید"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                استان نظام صنفی <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="form.province"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option v-for="prov in IRAN_PROVINCES" :key="prov.id" :value="prov.name">
                  {{ prov.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                شهرستان <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="form.city"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option v-for="c in currentCities" :key="c" :value="c">
                  {{ c }}
                </option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                کد پستی ده‌رقمی <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.postalCode"
                type="text"
                placeholder="کد پستی ۱۰ رقمی را وارد نمایید"
                maxlength="10"
                dir="ltr"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              />
              <p v-if="errors.postalCode" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.postalCode }}</p>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نشانی دقیق پستی <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.address"
                type="text"
                placeholder="خیابان، کوچه، پلاک، طبقه و واحد"
                class="w-full h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <p v-if="errors.address" class="text-2xs text-rose-500 mt-1 font-bold">{{ errors.address }}</p>
            </div>
          </div>

          <!-- تاییدیه قوانین و مقررات صنف -->
          <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mt-2">
            <label class="flex items-start gap-2.5 cursor-pointer">
              <input
                v-model="form.acceptedTerms"
                type="checkbox"
                class="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
              />
              <span class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                صحت کلیه اطلاعات ثبت‌شده را مطابق قوانین و مقررات سازمان نظام صنفی رایانه‌ای اردبیل تایید می‌نمایم.
              </span>
            </label>
            <p v-if="errors.acceptedTerms" class="text-3xs text-rose-500 font-bold mt-1">
              {{ errors.acceptedTerms }}
            </p>
          </div>

          <p v-if="errors.submit" class="text-xs text-rose-500 font-bold">
            {{ errors.submit }}
          </p>
        </div>

        <!--
        ========================================================================
        مرحله ۳: بارگذاری مدارک و تایید نهایی
        (موقت غیرفعال شده تا زمان آماده‌سازی API بک‌اند؛ برای فعال‌سازی مجدد، این بلوک و مرحله ۳ در آرایه steps در اسکریپت را آن‌کامنت کنید)
        ========================================================================
        <div v-else-if="currentStep === 3" class="space-y-5">
          <div class="text-right pb-2">
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
              بارگذاری مدارک و تایید نهایی
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تصاویر باید واضح و حداکثر ۵ مگابایت باشند (فرمت‌های JPG، PNG یا PDF).
            </p>
          </div>

          [اسلات‌های بارگذاری مدارک]
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              v-for="doc in docItems"
              :key="doc.id"
              class="p-4 rounded-2xl border transition-all"
              :class="[
                doc.fileName
                  ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800'
                  : errors[doc.field]
                  ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40',
              ]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    :class="doc.fileName ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'"
                  >
                    <FileCheck v-if="doc.fileName" class="w-4 h-4" />
                    <UploadCloud v-else class="w-4 h-4" />
                  </div>
                  <div>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {{ doc.title }}
                      <span v-if="doc.required" class="text-rose-500">*</span>
                    </span>
                    <span v-if="doc.fileName" class="text-3xs text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5 truncate max-w-[180px]" dir="ltr">
                      {{ doc.fileName }}
                    </span>
                    <span v-else class="text-3xs text-slate-400 block mt-0.5">
                      انتخاب فایل تصویر یا PDF
                    </span>
                  </div>
                </div>

                <button
                  v-if="doc.fileName"
                  type="button"
                  class="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                  title="حذف فایل"
                  @click="removeFile(doc.id)"
                >
                  <FileX class="w-4 h-4" />
                </button>
              </div>

              <div v-if="!doc.fileName" class="mt-3">
                <label
                  class="block text-center py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  <span>بارگذاری فایل</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    class="hidden"
                    @change="handleFileUpload(doc.id, $event)"
                  />
                </label>
              </div>

              <p v-if="errors[doc.field]" class="text-3xs text-rose-500 font-bold mt-1.5">
                {{ errors[doc.field] }}
              </p>
            </div>
          </div>
        </div>
        -->
      </div>

      <!-- Navigation Footer -->
      <div class="px-4 sm:px-8 py-3.5 sm:py-4 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2">
        <button
          v-if="currentStep > 1"
          type="button"
          class="h-11 sm:h-10 px-3.5 sm:px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          @click="prevStep"
        >
          <ArrowRight class="w-3.5 h-3.5" />
          <span>مرحله قبل</span>
        </button>
        <div v-else />

        <div class="flex items-center gap-2">
          <button
            v-if="currentStep < steps.length"
            type="button"
            class="h-11 sm:h-10 px-5 sm:px-6 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            @click="nextStep"
          >
            <span>مرحله بعد</span>
            <ArrowLeft class="w-3.5 h-3.5" />
          </button>

          <button
            v-else
            type="button"
            :disabled="isSubmitting"
            class="h-11 sm:h-10 px-4 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 sm:gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            @click="handleSubmit"
          >
            <span v-if="!isSubmitting">ارسال درخواست عضویت</span>
            <span v-else>در حال ارسال...</span>
            <CheckCircle2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
