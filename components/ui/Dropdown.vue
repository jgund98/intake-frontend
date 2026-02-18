<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

interface DropdownOption {
  label: string;
  value: string;
}

interface Props {
  options?: DropdownOption[];
  fieldName: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isPrimary?: boolean;
  errorMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  required: false,
  disabled: false,
  isPrimary: true,
  errorMessage: 'This field is required',
});

const modelValue = defineModel<Record<string, string>>({ default: {} });

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);
const touched = ref(false);
const openUpward = ref(false);

const hasValue = computed(() => {
  return !!modelValue.value[props.fieldName];
});

// Error message to display - from parent or default
const displayedError = computed(() => {
  if (!touched.value) return '';

  // Only show error when required and no value selected
  if (props.required && !hasValue.value) {
    return props.errorMessage || 'This field is required';
  }

  return '';
});

const showError = computed(() => {
  return !!displayedError.value;
});

const checkDropdownPosition = () => {
  if (!dropdownRef.value) return;

  const buttonRect = dropdownRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;

  // Estimate dropdown height (max-height is 240px = 60 * 4)
  const estimatedDropdownHeight = 240;

  // If not enough space below and more space above, open upward
  openUpward.value =
    spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;
};

const toggleDropdown = () => {
  if (props.disabled) return;

  if (!isOpen.value) {
    isOpen.value = true;
    // Check position after DOM update
    setTimeout(() => checkDropdownPosition(), 0);
  } else {
    isOpen.value = false;
    touched.value = true;
  }
};

const selectOption = (value: string) => {
  modelValue.value = {
    ...modelValue.value,
    [props.fieldName]: value,
  };
  isOpen.value = false;
  touched.value = true;
};

const clearSelection = () => {
  const newValue = { ...modelValue.value };
  delete newValue[props.fieldName];
  modelValue.value = newValue;
  isOpen.value = false;
  touched.value = true;
};

const isSelected = (value: string): boolean => {
  return modelValue.value[props.fieldName] === value;
};

const getSelectedLabel = () => {
  const selectedValue = modelValue.value[props.fieldName];
  if (!selectedValue || !props.options) return props.placeholder;

  const option = props.options.find(opt => opt.value === selectedValue);
  return option ? option.label : props.placeholder;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

// Recalculate position on scroll or resize
const handlePositionUpdate = () => {
  if (isOpen.value) {
    checkDropdownPosition();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handlePositionUpdate, true);
  window.addEventListener('resize', handlePositionUpdate);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handlePositionUpdate, true);
  window.removeEventListener('resize', handlePositionUpdate);
});
</script>

<template>
  <div class="w-full max-w-full" v-bind="$attrs">
    <div
      ref="dropdownRef"
      class="relative w-full max-w-full overflow-visible min-w-0"
    >
      <!-- Dropdown Button -->
      <button
        type="button"
        class="w-full px-3 rounded-input border-2 transition-all flex items-center gap-3 relative z-10 overflow-hidden h-[42px]"
        :class="[
          disabled
            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
            : showError
              ? 'bg-transparent border-red-500 text-red-500 hover:border-red-600 cursor-pointer'
              : isOpen || modelValue[fieldName]
                ? isPrimary
                  ? 'bg-primary-dark-2 border-primary text-gray-1 cursor-pointer'
                  : 'bg-gray-100 border-gray-500 text-gray-1 cursor-pointer'
                : isPrimary
                  ? 'bg-primary-dark-1 border-2 border-primary-dark-6 text-gray-1 hover:border-primary-dark-7 cursor-pointer'
                  : 'bg-transparent border-2 border-gray-300 text-gray-1 hover:border-gray-500 cursor-pointer',
        ]"
        :disabled="disabled"
        @click="toggleDropdown"
      >
        <div class="flex-1 min-w-0 text-left">
          <span
            class="text-base-input font-medium block overflow-hidden whitespace-nowrap text-ellipsis"
            >{{ getSelectedLabel() }}</span
          >
        </div>

        <!-- Chevron Icon -->
        <NuxtImg
          src="/icons/chevron-down.svg"
          alt="Toggle"
          width="16"
          height="16"
          class="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          :class="isOpen ? 'rotate-180' : ''"
        />
      </button>

      <!-- Dropdown List -->
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="absolute z-50 bg-white rounded-2xl shadow-md border border-gray-200 max-h-60 overflow-y-auto overflow-x-hidden left-0 right-0"
          :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
        >
          <div v-if="options && options.length > 0" class="py-2 min-w-0">
            <!-- Clear Selection Option (only for non-required fields with value) -->
            <div
              v-if="!required && hasValue"
              class="px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-200"
              @click="clearSelection"
            >
              <span
                class="text-base-input font-medium text-gray-11 block whitespace-normal break-words italic w-full"
              >
                Clear selection
              </span>
            </div>

            <!-- Regular Options -->
            <div
              v-for="(option, index) in options"
              :key="index"
              class="px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
              :class="
                isSelected(option.value)
                  ? isPrimary
                    ? 'bg-primary-dark-2'
                    : 'bg-gray-100'
                  : ''
              "
              @click="selectOption(option.value)"
            >
              <!-- Option Label -->
              <span
                class="text-base-input font-medium transition-colors block whitespace-normal break-words w-full leading-relaxed"
                :class="
                  isSelected(option.value)
                    ? isPrimary
                      ? 'text-primary font-semibold'
                      : 'text-gray-1 font-semibold'
                    : 'text-gray-1'
                "
              >
                {{ option.label }}
              </span>
            </div>
          </div>

          <!-- No options message -->
          <div v-else class="py-6 px-4 text-center">
            <p class="text-sm text-gray-11">No options available</p>
          </div>
        </div>
      </transition>
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
  </div>
</template>
