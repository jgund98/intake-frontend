<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { $fetch } from 'ofetch';
import {
  type ApiResp,
  type PresignedUrlData,
} from '~/models/apiResponse.model';

const props = defineProps({
  fieldName: { type: String, required: true },
  modelValue: { type: Object, required: true },
  question: { type: Object, default: null },
  required: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const acceptedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/tiff',
  'text/csv',
  'text/plain',
  'image/heic', // iOS HEIC images
  'image/heif', // iOS HEIF images
];

const acceptedExtensions = [
  '.pdf',
  '.jpeg',
  '.jpg',
  '.png',
  '.doc',
  '.docx',
  '.tiff',
  '.tif',
  '.csv',
  '.txt',
  '.heic',
  '.heif',
];

// Helper function to validate file type
function isValidFileType(file: globalThis.File): boolean {
  // Check MIME type first
  if (file.type && acceptedTypes.includes(file.type)) {
    return true;
  }

  // Fallback: check file extension (important for mobile where MIME type might be empty)
  const fileName = file.name.toLowerCase();
  return acceptedExtensions.some(ext => fileName.endsWith(ext));
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const uploadedFileName = ref('');
const errorMessage = ref('');

// Remove uploaded file
const removeFile = (e: Event) => {
  e.stopPropagation(); // Prevent triggering file input click

  const existingData = { ...props.modelValue };
  delete existingData[props.fieldName];

  emit('update:modelValue', existingData);
  uploadedFileName.value = '';
  errorMessage.value = '';

  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// Initialize uploadedFileName from modelValue
const initializeFromModelValue = () => {
  const existingFile = props.modelValue[props.fieldName];
  if (existingFile && Array.isArray(existingFile) && existingFile.length > 0) {
    uploadedFileName.value = existingFile[0].name || '';
  }
};

// Initialize on mount
onMounted(() => {
  initializeFromModelValue();
});

// Watch for changes in modelValue
watch(
  () => props.modelValue[props.fieldName],
  newValue => {
    if (newValue && Array.isArray(newValue) && newValue.length > 0) {
      uploadedFileName.value = newValue[0].name || '';
    } else {
      uploadedFileName.value = '';
    }
  },
  { immediate: true }
);

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  const MAX_FILE_SIZE_MB = 6;
  const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

  errorMessage.value = '';
  uploadedFileName.value = '';

  if (!selectedFile) return;

  if (!isValidFileType(selectedFile)) {
    errorMessage.value =
      'File type not allowed. Please upload PDF, JPG, PNG, DOC, DOCX, TIFF, CSV, or TXT files.';
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  if (selectedFile.size > MAX_FILE_SIZE) {
    errorMessage.value = `File size exceeds ${MAX_FILE_SIZE_MB} MB. Please upload a smaller file.`;
    if (fileInputRef.value) fileInputRef.value.value = '';
    return;
  }

  uploading.value = true;

  try {
    const sessionId = `session_${Date.now()}`;

    const presignedResponse = await $fetch<ApiResp<PresignedUrlData>>(
      '/api/assets-url',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      }
    );

    if (!presignedResponse.ok) {
      errorMessage.value = presignedResponse.message;
      uploading.value = false;
      if (fileInputRef.value) fileInputRef.value.value = '';
      return;
    }

    const { uploadUrl, downloadUrl, s3Key } = presignedResponse.data;

    const controller = new globalThis.AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 60000);

    try {
      const uploadResponse = await globalThis.fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
        },
        body: selectedFile,
        signal: controller.signal,
      });

      globalThis.clearTimeout(timeoutId);

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      const existingData = { ...props.modelValue };
      existingData[props.fieldName] = [
        {
          name: selectedFile.name,
          contentType: selectedFile.type,
          fileUrl: downloadUrl,
          s3Key: s3Key,
        },
      ];

      emit('update:modelValue', existingData);
      uploadedFileName.value = selectedFile.name;
      uploading.value = false;
      if (fileInputRef.value) fileInputRef.value.value = '';
    } catch (uploadError: any) {
      globalThis.clearTimeout(timeoutId);

      if (uploadError.name === 'AbortError') {
        errorMessage.value =
          'Upload timeout. Please check your connection and try again.';
      } else {
        errorMessage.value = 'Failed to upload file. Please try again.';
      }
      uploading.value = false;
      if (fileInputRef.value) fileInputRef.value.value = '';
      return;
    }
  } catch (error: any) {
    let message = 'Failed to upload file. Please try again.';

    if (error?.data?.message) {
      message = error.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
      message = 'Network error. Please check your connection and try again.';
    }

    errorMessage.value = message;
    uploadedFileName.value = '';
    uploading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="flex items-center gap-3 px-3 py-3 cursor-pointer bg-primary-light-5 border-2 rounded-xl transition-all"
      :class="[
        uploadedFileName ? 'w-full' : 'w-[220px]',
        errorMessage
          ? 'border-red-500'
          : uploading
            ? 'border-primary opacity-70'
            : 'border-primary',
      ]"
      v-bind="$attrs"
      @click="!uploading && !uploadedFileName && fileInputRef?.click()"
    >
      <!-- Loading spinner or upload icon -->
      <div v-if="uploading" class="w-4 h-4">
        <svg
          class="animate-spin h-4 w-4 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <NuxtImg
        v-else
        src="/icons/file-upload.svg"
        class="w-4 h-4 icon-primary"
        alt="Upload Icon"
      />

      <!-- File name or status -->
      <span
        class="font-semibold text-body2 truncate flex-1"
        :class="[
          errorMessage
            ? 'text-red-500'
            : uploading
              ? 'text-gray-5'
              : uploadedFileName
                ? 'text-gray-1'
                : 'text-gray-1',
          uploading && 'cursor-not-allowed',
        ]"
      >
        {{ uploading ? 'Uploading...' : uploadedFileName || 'Select a file' }}
      </span>

      <!-- Remove button (only show when file is uploaded) -->
      <button
        v-if="uploadedFileName && !uploading"
        type="button"
        class="flex-shrink-0 w-5 h-5 hover:opacity-70 transition-opacity cursor-pointer"
        @click="removeFile"
      >
        <NuxtImg src="/icons/close.svg" class="w-5 h-5" alt="Remove file" />
      </button>

      <input
        ref="fileInputRef"
        type="file"
        accept=".pdf,.jpeg,.jpg,.png,.doc,.docx,.tiff,.tif,.csv,.txt,.heic,.heif,image/*,application/pdf"
        class="hidden"
        :disabled="uploading"
        @change="handleFileChange"
      />
    </div>

    <!-- Error Message -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="errorMessage" class="px-1">
        <span class="text-sm text-red-500">{{ errorMessage }}</span>
      </div>
    </transition>
  </div>
</template>
