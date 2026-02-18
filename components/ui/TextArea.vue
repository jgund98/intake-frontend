<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  fieldName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Enter text...',
  },
  required: {
    type: Boolean,
    default: false,
  },
  isPrimary: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: 'This field is required',
  },
  rows: {
    type: Number,
    default: 4,
  },
  minLength: {
    type: Number,
    default: 25,
  },
  maxLength: {
    type: Number,
    default: null,
  },
  allowNA: {
    type: Boolean,
    default: false,
  },
  naText: {
    type: String,
    default: 'Not Applicable',
  },
});

const modelValue = defineModel({ default: {} });
const touched = ref(false);
const text = ref(modelValue.value[props.fieldName] || '');

// Watch text changes and update modelValue
watch(text, newValue => {
  const trimmedValue = newValue?.trim();

  // Always update modelValue regardless of validation state
  modelValue.value = {
    ...modelValue.value,
    [props.fieldName]: trimmedValue || '',
  };
});

// Watch modelValue changes from parent and update local text
watch(
  () => modelValue.value[props.fieldName],
  newValue => {
    if (newValue !== text.value) {
      text.value = newValue || '';
    }
  },
  { immediate: true }
);

const error = computed(() => {
  if (!touched.value) return false;

  const trimmedValue = text.value?.trim();

  // Check if required and empty
  if (props.required && !trimmedValue) return true;

  // Check if required and less than 25 characters
  if (props.required && trimmedValue && trimmedValue.length < props.minLength)
    return true;

  return false;
});

const currentErrorMessage = computed(() => {
  if (!error.value) return '';

  const trimmedValue = text.value?.trim();

  // Required field error
  if (props.required && !trimmedValue) {
    return props.errorMessage;
  }

  // Minimum character error
  if (props.required && trimmedValue && trimmedValue.length < props.minLength) {
    return `Minimum ${props.minLength} characters required (${trimmedValue.length}/${props.minLength})`;
  }

  return '';
});

const characterCount = computed(() => {
  const trimmedValue = text.value?.trim();
  return trimmedValue ? trimmedValue.length : 0;
});

const handleBlur = () => {
  touched.value = true;
};

// Handle N/A button click
const handleNAClick = () => {
  text.value = props.naText;
  touched.value = true;
};
// Check if N/A button should be shown (show when field is empty or has no content)
const showNAButton = computed(() => {
  return props.allowNA && !text.value?.trim();
});
</script>

<template>
  <div class="w-full">
    <!-- N/A Button (positioned above textarea) -->
    <div v-if="showNAButton" class="flex justify-end mb-1.5">
      <button
        type="button"
        class="px-2.5 py-1 text-xs font-medium text-gray-500 bg-white hover:bg-gray-200 rounded-full border border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
        @click="handleNAClick"
      >
        Not Applicable
      </button>
    </div>

    <div
      class="px-3 py-2.5 rounded-input border-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)] transition-colors"
      :class="[
        error
          ? 'border-red-500 focus-within:border-red-600 bg-transparent'
          : isPrimary
            ? 'border-primary-dark-6 focus-within:border-primary bg-primary-dark-1'
            : 'border-gray-300 focus-within:border-gray-500 bg-transparent',
      ]"
      v-bind="$attrs"
    >
      <!-- Textarea -->
      <textarea
        v-model="text"
        :name="fieldName"
        :placeholder="placeholder"
        :required="required"
        :rows="rows"
        :maxlength="maxLength"
        class="w-full bg-transparent outline-none border-none text-base-input placeholder-gray-11 resize-none leading-relaxed"
        :class="error ? 'text-red-500' : 'text-gray-1'"
        @blur="handleBlur"
      ></textarea>
    </div>
  </div>
  <!-- Character Count (if maxLength is provided) -->
  <div v-if="maxLength" class="mt-1 px-1 flex justify-between items-center">
    <div v-if="error && currentErrorMessage">
      <span class="text-sm text-red-500">{{ currentErrorMessage }}</span>
    </div>
    <div class="ml-auto">
      <span
        class="text-xs"
        :class="
          characterCount >= maxLength
            ? 'text-red-500 font-semibold'
            : 'text-gray-500'
        "
      >
        {{ characterCount }} / {{ maxLength }}
      </span>
    </div>
  </div>

  <!-- Error Message (without character count) -->
  <transition
    v-else
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div v-if="error && currentErrorMessage" class="mt-1 px-1">
      <span class="text-sm text-red-500">{{ currentErrorMessage }}</span>
    </div>
  </transition>
</template>
