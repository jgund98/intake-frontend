<script setup>
import { ref, computed, watch } from 'vue';
import { NuxtImg } from '#components';

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
    default: 'value...',
  },
  leftIcon: {
    type: String,
    default: null,
  },
  rightIcon: {
    type: String,
    default: null,
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
  validator: {
    type: Function,
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

// Get validation error message
const validationError = computed(() => {
  const value = text.value?.trim() || '';

  // Use custom validator if provided
  if (props.validator) {
    return props.validator(value) || '';
  }

  // Default required validation
  if (props.required && !value) {
    return props.errorMessage || '';
  }

  return '';
});

const error = computed(() => {
  return touched.value && !!validationError.value;
});

// Computed for displayed error message
const displayedError = computed(() => {
  return error.value ? validationError.value : '';
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
    <div
      class="flex items-center px-3 rounded-input border-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)] transition-colors h-[42px]"
      :class="[
        error
          ? 'border-red-500 focus-within:border-red-600 bg-transparent'
          : isPrimary
            ? 'border-primary-dark-6 focus-within:border-primary bg-primary-dark-1'
            : 'border-gray-300 focus-within:border-gray-500 bg-transparent',
      ]"
      v-bind="$attrs"
    >
      <!-- Left Icon -->
      <NuxtImg
        v-if="leftIcon"
        :src="leftIcon"
        alt="left icon"
        width="16"
        height="16"
        class="mr-2 shrink-0 w-4 h-4"
        :class="error ? 'opacity-50' : ''"
      />

      <!-- Input -->
      <input
        v-model="text"
        :name="fieldName"
        :placeholder="placeholder"
        :required="required"
        type="text"
        class="flex-1 min-w-0 h-full bg-transparent outline-none border-none text-base-input placeholder-gray-11"
        :class="[
          leftIcon && 'pl-0',
          rightIcon && 'pr-0',
          error ? 'text-red-500' : 'text-gray-1',
        ]"
        @blur="handleBlur"
      />

      <!-- Right Icon -->
      <NuxtImg
        v-if="rightIcon"
        :src="rightIcon"
        alt="right icon"
        width="16"
        height="16"
        class="ml-2 shrink-0 w-4 h-4"
        :class="error ? 'opacity-50' : ''"
      />

      <!-- N/A Button -->
      <button
        v-if="showNAButton"
        type="button"
        class="ml-2 px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors whitespace-nowrap cursor-pointer"
        @click="handleNAClick"
      >
        N/A
      </button>
    </div>
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
    <div v-if="displayedError" class="mt-1 px-1">
      <span class="text-sm text-red-500">{{ displayedError }}</span>
    </div>
  </transition>
</template>
