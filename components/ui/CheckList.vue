<script setup lang="ts">
import { ref, watch } from 'vue';
import type { options } from '~/models/panels.model';

const props = withDefaults(
  defineProps<{
    options: options[];
    fieldName: string;
    required?: boolean;
  }>(),
  {
    required: false,
  }
);

const emit = defineEmits<{
  'option-selected': [];
}>();

const modelValue = defineModel<Record<string, string[]>>({ default: {} });

const selected = ref<string[]>([]);

watch(selected, newVal => {
  if (props.required && newVal.length === 0) return;
  modelValue.value = { ...modelValue.value, [props.fieldName]: newVal };
});

watch(
  modelValue,
  newVal => {
    const arr = newVal?.[props.fieldName];
    if (arr && Array.isArray(arr)) selected.value = arr;
  },
  { immediate: true }
);

const isSelected = (v: string) => selected.value.includes(v);

const toggleValue = (v: string) => {
  const set = new Set(selected.value);

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

  selected.value = [...set];
  emit('option-selected');
};
</script>

<template>
  <div class="w-full">
    <div v-if="props.options.length" class="flex flex-col gap-1">
      <div
        v-for="(option, i) in props.options"
        :key="option.value ?? i"
        class="flex items-start gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-primary-dark-1 transition-colors"
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
          :class="isSelected(option.value) ? 'text-primary font-semibold' : ''"
        >
          {{ option.label }}
        </span>
      </div>
    </div>

    <!-- No options message -->
    <div v-else class="py-6 px-4 text-center">
      <p class="text-base-input text-gray-500">No options available</p>
    </div>
  </div>
</template>
