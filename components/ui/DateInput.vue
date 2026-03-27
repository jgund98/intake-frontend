<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import IMask from 'imask';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface Props {
  name?: string;
  placeholder?: string;
  minDate?: string; // Format: YYYY-MM-DD
  maxDate?: string; // Format: YYYY-MM-DD
  fieldName: string;
  isPrimary?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'MM/DD/YYYY',
  isPrimary: true,
});

const modelValue = defineModel<Record<string, string>>({ default: {} });

const inputRef = ref<HTMLInputElement | null>(null);
const displayValue = ref('');
const error = ref('');
let maskInstance: any = null;

const currentYear = new Date().getFullYear();

// Initialize display value from model
watch(
  () => modelValue.value[props.fieldName],
  (newVal) => {
    if (newVal && !displayValue.value) {
      const date = dayjs(newVal, 'YYYY-MM-DD', true);
      if (date.isValid()) {
        displayValue.value = date.format('MM/DD/YYYY');
      }
    }
  },
  { immediate: true }
);

const dynamicPlaceholder = computed(() => {
  return displayValue.value.length > 0 ? '' : 'MM/DD/YYYY';
});

const parseAndValidateDate = (
  dateStr: string
): { valid: boolean; message: string; isoDate?: string } => {
  if (!dateStr) {
    return { valid: false, message: '' };
  }

  const numbers = dateStr.replace(/\D/g, '');
  if (numbers.length !== 8) {
    return { valid: false, message: 'Invalid date' };
  }

  const date = dayjs(dateStr, 'MM/DD/YYYY', true);
  if (!date.isValid()) {
    return { valid: false, message: 'Invalid date' };
  }

  const year = date.year();
  if (year < 1900 || year > currentYear) {
    return { valid: false, message: 'Invalid date' };
  }

  if (props.minDate) {
    const minDate = dayjs(props.minDate, 'YYYY-MM-DD', true);
    if (date.isBefore(minDate, 'day')) {
      return { valid: false, message: 'Invalid date' };
    }
  }

  if (props.maxDate) {
    const maxDate = dayjs(props.maxDate, 'YYYY-MM-DD', true);
    if (date.isAfter(maxDate, 'day')) {
      return { valid: false, message: 'Invalid date' };
    }
  }

  return { valid: true, message: '', isoDate: date.format('YYYY-MM-DD') };
};

const updateModelValue = () => {
  const validation = parseAndValidateDate(displayValue.value);

  if (validation.valid && validation.isoDate) {
    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: validation.isoDate,
    };
    error.value = '';
  } else {
    const newModel = { ...modelValue.value };
    delete newModel[props.fieldName];
    modelValue.value = newModel;

    const numbers = displayValue.value.replace(/\D/g, '');
    if (numbers.length === 8) {
      error.value = validation.message;
    } else {
      error.value = '';
    }
  }
};

const handleBlur = () => {
  if (!displayValue.value) {
    error.value = '';
    const newModel = { ...modelValue.value };
    delete newModel[props.fieldName];
    modelValue.value = newModel;
    return;
  }

  const validation = parseAndValidateDate(displayValue.value);
  error.value = validation.message;

  if (validation.valid && validation.isoDate) {
    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: validation.isoDate,
    };
  } else {
    const newModel = { ...modelValue.value };
    delete newModel[props.fieldName];
    modelValue.value = newModel;
  }
};

onMounted(() => {
  if (inputRef.value) {
    maskInstance = IMask(inputRef.value, {
      mask: 'MM/DD/YYYY',
      blocks: {
        MM: {
          mask: IMask.MaskedRange,
          from: 1,
          to: 12,
          maxLength: 2,
        },
        DD: {
          mask: IMask.MaskedRange,
          from: 1,
          to: 31,
          maxLength: 2,
        },
        YYYY: {
          mask: '0000',
          placeholderChar: 'Y',
        },
      },
      lazy: true,
      autofix: 'pad',
    });

    maskInstance.on('accept', () => {
      displayValue.value = maskInstance?.value || '';
      updateModelValue();
    });

    if (displayValue.value) {
      maskInstance.value = displayValue.value;
    }
  }
});

onBeforeUnmount(() => {
  if (maskInstance) {
    maskInstance.destroy();
    maskInstance = null;
  }
});
</script>

<template>
  <div v-bind="$attrs">
    <div class="relative">
      <div
        class="absolute inset-0 px-3 rounded-input pointer-events-none flex items-center h-10.5 overflow-hidden"
      >
        <span class="text-base-input text-gray-11 select-none">{{
          dynamicPlaceholder
        }}</span>
      </div>
      <input
        ref="inputRef"
        type="text"
        :name="fieldName"
        placeholder=""
        class="relative w-full px-3 rounded-input border-2 bg-transparent shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)] text-base-input text-gray-1 outline-none transition-colors h-10.5"
        :class="[
          error
            ? 'border-red-500 focus:border-red-500'
            : isPrimary
              ? 'border-primary-dark-5 focus:border-primary hover:border-primary'
              : 'border-gray-300 focus:border-gray-500 hover:border-gray-500',
        ]"
        @blur="handleBlur"
      />
      <div
        v-if="error"
        class="absolute left-0 top-full mt-1 text-xs text-red-500"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>
