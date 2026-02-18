<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  fieldName: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: 'This field is required',
  },
});

const modelValue = defineModel({ default: {} });
const touched = ref(false);
const isChecked = ref(modelValue.value[props.fieldName] || false);

// Watch checkbox changes and update modelValue
watch(isChecked, newValue => {
  modelValue.value = {
    ...modelValue.value,
    [props.fieldName]: newValue,
  };
});

// Watch modelValue changes from parent and update local isChecked
watch(
  () => modelValue.value[props.fieldName],
  newValue => {
    if (newValue !== isChecked.value) {
      isChecked.value = newValue || false;
    }
  },
  { immediate: true }
);

// Get validation error message
const validationError = computed(() => {
  // Default required validation
  if (props.required && !isChecked.value) {
    return props.errorMessage;
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
</script>

<template>
  <div class="w-full">
    <label
      class="flex items-center gap-3 cursor-pointer group"
      @blur="handleBlur"
    >
      <!-- Custom Checkbox -->
      <div class="relative flex items-center justify-center shrink-0 mt-0.5">
        <input
          v-model="isChecked"
          type="checkbox"
          :required="required"
          class="sr-only peer"
        />
        <div
          class="w-5 h-5 border-2 rounded transition-all duration-200"
          :class="[
            error
              ? 'border-red-500'
              : isChecked
                ? 'border-primary bg-primary'
                : 'border-gray-300 group-hover:border-primary-dark-5',
          ]"
        >
          <!-- Checkmark Icon -->
          <svg
            v-if="isChecked"
            class="w-full h-full text-white"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.6667 5L7.50004 14.1667L3.33337 10"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <!-- Label -->
      <span
        class="body2 select-none"
        :class="error ? 'text-red-500' : 'text-gray-2'"
        v-html="label"
      />
    </label>

    <!-- Error Message -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="displayedError" class="mt-1 px-1 ml-8">
        <span class="text-sm text-red-500">{{ displayedError }}</span>
      </div>
    </transition>
  </div>
</template>
