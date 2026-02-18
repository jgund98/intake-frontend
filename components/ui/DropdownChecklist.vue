<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineExpose } from 'vue';
import type { options } from '~/models/panels.model';

const props = withDefaults(
  defineProps<{
    options: options[];
    maxDropdownPx?: number;
    parentEl?: HTMLElement | null;
    required?: boolean;
  }>(),
  {
    maxDropdownPx: 240,
    required: false,
  }
);

const emit = defineEmits<{
  'option-selected': [];
}>();

const modelValue = defineModel<string[]>({ default: [] });

const dropdownRef = ref<HTMLDivElement | null>(null);
const isOpen = ref(false);
const openUpward = ref(false);

const isSelected = (v: string) => modelValue.value.includes(v);

const toggleValue = (v: string) => {
  const set = new Set(modelValue.value);

  // Check if the clicked option is "None of above"
  const clickedOption = props.options.find(opt => opt.value === v);
  const isNoneOfAbove =
    clickedOption?.label.toLowerCase().includes('none of') || false;

  // Check if "None of above" is currently selected
  const noneOfAboveOption = props.options.find(opt =>
    opt.label.toLowerCase().includes('none of')
  );
  const noneOfAboveValue = noneOfAboveOption?.value;
  const hasNoneOfAbove = noneOfAboveValue && set.has(noneOfAboveValue);

  if (isNoneOfAbove) {
    // If clicking "None of above", clear all and add only this
    if (set.has(v)) {
      // If already selected, just remove it
      set.delete(v);
    } else {
      // Clear all and add only "None of above"
      set.clear();
      set.add(v);
    }
  } else {
    // If clicking any other option
    if (hasNoneOfAbove && noneOfAboveValue) {
      // Remove "None of above" first
      set.delete(noneOfAboveValue);
    }

    // Toggle the clicked option
    if (set.has(v)) {
      set.delete(v);
    } else {
      set.add(v);
    }
  }

  if (props.required && set.size === 0) return;

  modelValue.value = [...set];
  emit('option-selected');
};

const checkDropdownPosition = () => {
  if (!dropdownRef.value || !props.parentEl) return;
  const rect = props.parentEl.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom;
  const above = rect.top;
  openUpward.value = below < props.maxDropdownPx && above > below;
};

const open = () => {
  if (isOpen.value) return;
  isOpen.value = true;
  setTimeout(() => checkDropdownPosition(), 0);
};

const close = () => (isOpen.value = false);
const toggle = () => (isOpen.value ? close() : open());

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  if (props.parentEl?.contains(target)) return;
  if (!dropdownRef.value?.contains(target)) close();
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', checkDropdownPosition);
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', checkDropdownPosition);
});

defineExpose({ open, close, toggle });
</script>

<template>
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
      ref="dropdownRef"
      class="absolute z-50 bg-background rounded-2xl shadow-md border border-primary-dark-6 overflow-y-auto left-0 right-0"
      :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
      :style="{ maxHeight: `${maxDropdownPx}px` }"
    >
      <div v-if="props.options.length" class="py-2">
        <div
          v-for="(option, i) in props.options"
          :key="option.value ?? i"
          class="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-primary-dark-1"
          @click.stop="toggleValue(option.value)"
        >
          <!-- Checkbox -->
          <span
            class="inline-flex items-center justify-center w-5 h-5 rounded-sm border border-primary-dark-6 shrink-0 mt-0.5"
            :class="isSelected(option.value) ? 'bg-primary' : 'bg-background'"
          >
            <NuxtImg
              v-if="isSelected(option.value)"
              src="/icons/check.svg"
              alt="Checked"
              class="w-4 h-4 brightness-0 invert"
            />
          </span>

          <span
            class="text-base-input font-medium text-gray-800 wrap-break-word leading-snug"
            :class="
              isSelected(option.value) ? 'text-primary font-semibold' : ''
            "
          >
            {{ option.label }}
          </span>
        </div>
      </div>

      <!-- No results message -->
      <div v-else class="py-6 px-4 text-center">
        <p class="text-base-input text-gray-500">
          No options found matching your search
        </p>
      </div>
    </div>
  </transition>
</template>
