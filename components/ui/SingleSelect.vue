<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import type { options } from '~/models/panels.model';

const props = defineProps<{
  options: options[];
  placeholder?: string;
  fieldName: string;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  isPrimary?: boolean;
}>();

const modelValue = defineModel<Record<string, string>>({ default: {} });

const selected = ref<string>('');
const search = ref('');
const isOpen = ref(false);
const isTouched = ref(false);
const rootRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);

const showError = computed(() => {
  return isTouched.value && props.required && !selected.value;
});

const errorText = computed(() => {
  if (!showError.value) return '';
  return props.errorMessage || 'This field is required';
});

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter(
    o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
  );
});

const selectedLabel = computed(() => {
  if (!selected.value) return '';
  const option = props.options.find(o => o.value === selected.value);
  return option?.label || selected.value;
});

watch(selected, newVal => {
  if (props.required && !newVal) return;
  modelValue.value = { ...modelValue.value, [props.fieldName]: newVal };
});

watch(
  modelValue,
  newVal => {
    const value = newVal?.[props.fieldName];
    if (value && typeof value === 'string') {
      selected.value = value;
    }
  },
  { immediate: true }
);

const openDropdown = async () => {
  if (props.disabled) return;
  isOpen.value = true;
  await nextTick();
  inputRef.value?.focus();
};

const closeDropdown = () => {
  isOpen.value = false;
  search.value = '';
  isTouched.value = true;
};

const selectOption = (value: string) => {
  selected.value = value;
  isTouched.value = true;
  closeDropdown();
};

const onWrapperClick = () => {
  if (!isOpen.value) {
    openDropdown();
  }
};

const handleClickOutside = (e: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    closeDropdown();
  }
};

// Handle click outside
watch(isOpen, newVal => {
  if (newVal) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<template>
  <div ref="rootRef" class="relative w-full" v-bind="$attrs">
    <div
      class="w-full border-2 rounded-input px-3 py-2 flex items-center gap-2 cursor-pointer transition-all min-h-[42px]"
      :class="{
        'opacity-50 cursor-not-allowed': disabled,
        'bg-primary-dark-1 border-primary-dark-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)]':
          isPrimary !== false,
        'bg-white border-gray-300': isPrimary === false,
        'border-primary': isOpen && !showError && isPrimary !== false,
        'border-red-500': showError,
      }"
      @click="onWrapperClick"
    >
      <!-- Show search input when dropdown is open -->
      <input
        v-if="isOpen"
        ref="inputRef"
        v-model="search"
        type="text"
        class="flex-1 bg-transparent outline-none placeholder-gray-11 align-middle leading-tight text-base-input text-gray-1"
        placeholder="Type to search…"
        @click.stop
      />

      <!-- Show selected value or placeholder when closed -->
      <div
        v-else
        class="flex-1 align-middle leading-tight text-base-input"
        :class="selected ? 'text-gray-1' : 'text-gray-11'"
      >
        {{ selected ? selectedLabel : (placeholder ?? 'Select an option') }}
      </div>

      <!-- Dropdown icon -->
      <svg
        class="w-5 h-5 transition-transform"
        :class="{
          'rotate-180': isOpen,
          'text-gray-5': !showError,
          'text-red-500': showError,
        }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>

    <!-- Dropdown List -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute z-50 w-full mt-2 bg-white border-2 rounded-input shadow-lg max-h-60 overflow-y-auto"
        :class="
          isPrimary !== false ? 'border-primary-dark-6' : 'border-gray-300'
        "
      >
        <div
          v-if="filteredOptions.length === 0"
          class="px-4 py-3 text-gray-11 text-center text-base-input"
        >
          No options found
        </div>
        <div
          v-for="option in filteredOptions"
          :key="option.value"
          class="px-4 py-2 hover:bg-primary-light-4 cursor-pointer transition-colors text-base-input text-gray-1"
          :class="{
            'bg-primary-light-3': selected === option.value,
          }"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </div>
      </div>
    </Transition>
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
    <div v-if="showError" class="mt-1 px-1">
      <span class="text-sm text-red-500">{{ errorText }}</span>
    </div>
  </transition>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
