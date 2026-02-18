<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import SelectChip from '~/components/cards/SelectChip.vue';
import DropdownChecklist from '~/components/ui/DropdownChecklist.vue';
import type { options } from '~/models/panels.model';

const props = defineProps<{
  options: options[];
  placeholder?: string;
  fieldName: string;
  required?: boolean;
}>();

const modelValue = defineModel<Record<string, string[]>>({ default: {} });

const selected = ref<string[]>([]);
const search = ref('');
const dropdownRef = ref<InstanceType<typeof DropdownChecklist> | null>(null);
const rootRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter(
    o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
  );
});

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

const removeChip = (val: string) => {
  if (props.required && selected.value.length === 1) return;
  selected.value = selected.value.filter(v => v !== val);
};

const onInputFocus = async () => {
  await nextTick();
  dropdownRef.value?.open();
};

const onWrapperClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('input') || target.closest('.chip')) return;
  inputRef.value?.focus();
};

const handleBackspace = (e: KeyboardEvent) => {
  if (e.key === 'Backspace' && search.value === '' && selected.value.length) {
    e.preventDefault();
    const last = selected.value[selected.value.length - 1];
    if (last) removeChip(last);
  }
};
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <div
      class="w-full border-2 rounded-input px-3 py-2 flex flex-wrap items-center gap-2 cursor-text bg-primary-dark-1 border-primary-dark-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)] transition-all min-h-[42px]"
      @click="onWrapperClick"
    >
      <!-- Chips wrapped in template -->
      <template v-for="v in selected" :key="v">
        <SelectChip
          class="chip"
          :label="props.options.find(o => o.value === v)?.label ?? v"
          @remove="removeChip(v)"
        />
      </template>

      <!-- Input -->
      <input
        ref="inputRef"
        v-model="search"
        type="text"
        class="flex-1 min-w-[100px] bg-transparent outline-none placeholder-gray-300 align-middle leading-tight pt-px pb-px"
        :placeholder="
          selected.length ? '' : (props.placeholder ?? 'Type to search…')
        "
        @focus="onInputFocus"
        @keydown="handleBackspace"
      />
    </div>

    <!-- Dropdown -->
    <DropdownChecklist
      ref="dropdownRef"
      v-model="selected"
      :options="filteredOptions"
      :parent-el="rootRef"
      :required="props.required"
      @option-selected="search = ''"
    />
  </div>
</template>
