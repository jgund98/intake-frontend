<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { isValidPhoneNumber, AsYouType } from 'libphonenumber-js';
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
    default: '+1 XXX XXX XXXX',
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
  errorMessage: {
    type: String,
    default: 'Please enter a valid phone number',
  },
  defaultCountryCallingCode: {
    type: String,
    default: '+1',
  },
  isPrimary: {
    type: Boolean,
    default: true,
  },
});

const modelValue = defineModel<Record<string, any>>({ default: {} });
const touched = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const phoneNumber = ref<string>('');

// Initialize phone number
onMounted(() => {
  const initialValue = (modelValue.value[props.fieldName] as string) || '';
  phoneNumber.value = initialValue;
});

// Format and validate phone number (US only)
const formatPhoneNumber = (value: string): string => {
  if (!value) return '';

  // Remove any non-numeric characters except +
  let cleaned = value.replace(/[^\d+]/g, '');

  // If starts with +1, keep it
  if (cleaned.startsWith('+1')) {
    cleaned = cleaned.substring(0, 12); // +1 + 10 digits max
    const formatter = new AsYouType('US');
    return formatter.input(cleaned);
  }

  // If starts with 1 (without +), auto-add "+" prefix
  if (cleaned.startsWith('1') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
    cleaned = cleaned.substring(0, 12); // +1 + 10 digits max
    const formatter = new AsYouType('US');
    return formatter.input(cleaned);
  }

  // If starts with + but not +1, reject (US only)
  if (cleaned.startsWith('+') && !cleaned.startsWith('+1')) {
    return phoneNumber.value; // Keep previous valid value
  }

  // If just 10 digits without +, auto-prepend US country code
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    cleaned = '+1' + cleaned;
    const formatter = new AsYouType('US');
    return formatter.input(cleaned);
  }

  // If less than 10 digits and no +, allow typing (limit to 10 digits)
  if (cleaned.length > 10) {
    cleaned = cleaned.substring(0, 10);
  }

  return cleaned;
};

// Watch phone number changes and update modelValue
watch(phoneNumber, (newValue: string) => {
  const trimmedValue = newValue?.trim() || '';
  const formattedValue = formatPhoneNumber(trimmedValue);

  // Prevent infinite loop by only updating if different
  if (formattedValue !== phoneNumber.value) {
    phoneNumber.value = formattedValue;
  }

  // Remove all spaces from the value before storing in modelValue
  const cleanedValue = formattedValue.replace(/\s/g, '');

  // Always update modelValue regardless of validation state
  modelValue.value = {
    ...modelValue.value,
    [props.fieldName]: cleanedValue,
  };
});

// Watch modelValue changes from parent and update local phoneNumber
watch(
  () => modelValue.value[props.fieldName],
  (newValue: any) => {
    const stringValue = (newValue as string) || '';
    if (stringValue && stringValue !== phoneNumber.value) {
      phoneNumber.value = stringValue;
    }
  },
  { immediate: true }
);

// Validate phone number (US only)
const isValidPhone = computed(() => {
  const value = phoneNumber.value?.trim() || '';
  if (!value) return true;

  try {
    // Always validate as US number
    return isValidPhoneNumber(value, 'US');
  } catch {
    return false;
  }
});

const error = computed(() => {
  const value = phoneNumber.value?.trim() || '';
  return props.required && touched.value && (!value || !isValidPhone.value);
});

const handleBlur = () => {
  touched.value = true;
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  phoneNumber.value = target.value;
};
</script>

<template>
  <div class="w-full">
    <div
      class="flex items-center px-3 rounded-input border-2 bg-transparent shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)] transition-colors h-[42px]"
      :class="[
        error
          ? 'border-red-500 focus-within:border-red-600'
          : isPrimary
            ? 'border-primary-dark-5 focus-within:border-primary'
            : 'border-gray-300 focus-within:border-gray-500',
      ]"
      v-bind="$attrs"
    >
      <!-- Left Icon (Prepend) -->
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
        ref="inputRef"
        v-model="phoneNumber"
        :name="fieldName"
        :placeholder="placeholder"
        :required="required"
        type="tel"
        class="flex-1 min-w-0 h-full bg-transparent outline-none border-none text-base-input placeholder-gray-11"
        :class="[
          leftIcon && 'pl-0',
          rightIcon && 'pr-0',
          error ? 'text-red-500' : 'text-gray-1',
        ]"
        @blur="handleBlur"
        @input="handleInput"
      />

      <!-- Right Icon (Append) -->
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
    <div v-if="error && errorMessage" class="mt-1 px-1">
      <span class="text-sm text-red-500">{{ errorMessage }}</span>
    </div>
  </transition>
</template>
