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
    default: 'email',
  },
  placeholder: {
    type: String,
    default: 'Enter your email...',
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
  requiredMessage: {
    type: String,
    default: 'Email is required',
  },
  invalidMessage: {
    type: String,
    default: 'Please enter a valid email address',
  },
  isPrimary: {
    type: Boolean,
    default: true,
  },
});

const modelValue = defineModel({ default: {} });
const touched = ref(false);
const email = ref(modelValue.value[props.fieldName] || '');

// Email validation regex - requires at least 2 characters for TLD
const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Watch email changes and update modelValue
watch(email, newValue => {
  const trimmedValue = newValue?.trim();

  // Always update modelValue regardless of validation state
  modelValue.value = {
    ...modelValue.value,
    [props.fieldName]: trimmedValue || '',
  };
});

// Watch modelValue changes from parent and update local email
watch(
  () => modelValue.value[props.fieldName],
  newValue => {
    if (newValue !== email.value) {
      email.value = newValue || '';
    }
  },
  { immediate: true }
);

const isValidEmail = computed(() => {
  const trimmedValue = email.value?.trim();
  if (!trimmedValue) return true; // Empty is valid if not required
  return emailRegex.test(trimmedValue);
});

const error = computed(() => {
  if (!touched.value) return false;

  const trimmedValue = email.value?.trim();

  // Check if required and empty
  if (props.required && !trimmedValue) return true;

  // Check if invalid format (only if not empty)
  if (trimmedValue && !isValidEmail.value) return true;

  return false;
});

const currentErrorMessage = computed(() => {
  if (!error.value) return '';

  const trimmedValue = email.value?.trim();

  // Required field error
  if (props.required && !trimmedValue) {
    return props.requiredMessage;
  }

  // Invalid format error
  if (trimmedValue && !isValidEmail.value) {
    return props.invalidMessage;
  }

  return '';
});

const handleBlur = () => {
  touched.value = true;
};

const handleInput = () => {
  // Mark as touched on input to provide real-time validation feedback
  if (email.value) {
    touched.value = true;
  }
};
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
        v-model="email"
        :name="fieldName"
        :placeholder="placeholder"
        :required="required"
        type="email"
        class="flex-1 min-w-0 h-full bg-transparent outline-none border-none text-base-input placeholder-gray-11"
        :class="[
          leftIcon && 'pl-0',
          rightIcon && 'pr-0',
          error ? 'text-red-500' : 'text-gray-1',
        ]"
        @blur="handleBlur"
        @input="handleInput"
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
    <div v-if="error && currentErrorMessage" class="mt-1 px-1">
      <span class="text-sm text-red-500">{{ currentErrorMessage }}</span>
    </div>
  </transition>
</template>
