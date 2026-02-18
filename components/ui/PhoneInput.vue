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

// Extract country code length from the input
const getCountryCodeLength = (value: string): number => {
  if (!value.startsWith('+')) return 0;

  // Extract digits after + until we can determine country code
  const digits = value.substring(1).replace(/\D/g, '');

  // Most country codes are 1-3 digits
  // Try to determine from common patterns
  if (digits.startsWith('1')) return 2; // +1 (US, Canada)
  if (digits.startsWith('7')) return 2; // +7 (Russia, Kazakhstan)
  if (digits.length >= 2) {
    const firstTwo = digits.substring(0, 2);
    // Common 2-digit country codes
    if (
      [
        '20',
        '27',
        '30',
        '31',
        '32',
        '33',
        '34',
        '36',
        '39',
        '40',
        '41',
        '43',
        '44',
        '45',
        '46',
        '47',
        '48',
        '49',
        '51',
        '52',
        '53',
        '54',
        '55',
        '56',
        '57',
        '58',
        '60',
        '61',
        '62',
        '63',
        '64',
        '65',
        '66',
        '81',
        '82',
        '84',
        '86',
        '90',
        '91',
        '92',
        '93',
        '94',
        '95',
        '98',
      ].includes(firstTwo)
    ) {
      return 3; // +XX format
    }
  }
  if (digits.length >= 3) return 4; // +XXX format

  return value.length; // Still typing country code
};

// Format and validate phone number
const formatPhoneNumber = (value: string): string => {
  if (!value) return '';

  // Remove any non-numeric characters except +
  let cleaned = value.replace(/[^\d+]/g, '');

  // US-only: If user starts with "1" (without +), auto-add "+" prefix
  if (cleaned.startsWith('1') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  // If starts with +, apply dynamic length based on country code
  if (cleaned.startsWith('+')) {
    const countryCodeLength = getCountryCodeLength(cleaned);

    // Max length = country code length + 10 digits for phone number
    const maxLength = countryCodeLength + 10;

    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    // Format using AsYouType
    const formatter = new AsYouType();
    return formatter.input(cleaned);
  }

  // If user typed 10 digits without +, auto-prepend US country code
  if (cleaned.length === 10) {
    cleaned = props.defaultCountryCallingCode + cleaned;
    const formatter = new AsYouType();
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

// Validate phone number
const isValidPhone = computed(() => {
  const value = phoneNumber.value?.trim() || '';
  if (!value) return true;

  // If has country code, validate fully
  if (value.startsWith('+')) {
    try {
      return isValidPhoneNumber(value);
    } catch {
      return false;
    }
  }

  // If just digits, should be exactly 10 digits
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length === 10;
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
