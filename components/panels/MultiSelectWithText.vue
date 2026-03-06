<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import MultiSelect from '~/components/panels/MultiSelect.vue';
import TextInput from '~/components/ui/TextInput.vue';
import type { options } from '~/models/panels.model';

// Props
const props = defineProps<{
  fieldName: string;
  options: options[];
  questionOne: string;
  questionTwo: string;
  noteOne?: string;
  noteTwo?: string;
  placeholderOne?: string;
  placeholderTwo?: string;
  required?: boolean;
}>();

// Default field names - consistent across all uses
const FIELD_ONE = 'fieldOne';
const FIELD_TWO = 'fieldTwo';

// Model value
const modelValue = defineModel<Record<string, any>>({ default: {} });

// Internal state for child components
const internalData = ref<Record<string, any>>({
  [FIELD_ONE]: [],
  [FIELD_TWO]: '',
});

// Watch for external changes to modelValue and initialize on mount
watch(
  () => modelValue.value?.[props.fieldName],
  newData => {
    if (newData && typeof newData === 'object') {
      // Update internal data from parent
      if (newData[FIELD_ONE] && Array.isArray(newData[FIELD_ONE])) {
        internalData.value[FIELD_ONE] = newData[FIELD_ONE];
      }
      if (newData[FIELD_TWO] !== undefined) {
        internalData.value[FIELD_TWO] = newData[FIELD_TWO];
      }
    }
  },
  { immediate: true, deep: true }
);

// Check if both fields are complete
const isComplete = computed(() => {
  const fieldOneValue = internalData.value[FIELD_ONE];
  const fieldTwoValue = internalData.value[FIELD_TWO];

  return (
    Array.isArray(fieldOneValue) &&
    fieldOneValue.length > 0 &&
    fieldTwoValue !== null &&
    fieldTwoValue !== undefined &&
    String(fieldTwoValue).trim() !== ''
  );
});

// Watch internal data and update parent modelValue
watch(
  internalData,
  () => {
    const currentValue = modelValue.value[props.fieldName];

    // If required and not complete, reset to empty object
    if (props.required && !isComplete.value) {
      // Only update to empty object if it's not already an empty object
      if (
        !currentValue ||
        typeof currentValue !== 'object' ||
        Object.keys(currentValue).length > 0
      ) {
        modelValue.value = { ...modelValue.value, [props.fieldName]: {} };
      }
      return;
    }

    // Build the new value
    const newValue = {
      [FIELD_ONE]: internalData.value[FIELD_ONE],
      [FIELD_TWO]: internalData.value[FIELD_TWO],
    };

    // Check if value actually changed to prevent infinite loop
    if (JSON.stringify(currentValue) === JSON.stringify(newValue)) {
      return;
    }

    // Update with complete data
    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: newValue,
    };
  },
  { deep: true }
);
</script>

<template>
  <div
    class="flex flex-col gap-6 p-4 md:p-6 rounded-2xl bg-primary-dark-1 text-gray-2"
  >
    <!-- First Field: Multi-Select -->
    <div>
      <label class="block body2 text-gray-2 mb-2">
        {{ questionOne }}
      </label>

      <MultiSelect
        v-model="internalData"
        :field-name="FIELD_ONE"
        :options="options"
        :placeholder="placeholderOne"
        :required="required"
      />

      <!-- Note for first field -->
      <p v-if="noteOne" class="mt-2 body2 text-gray-11 font-medium italic">
        {{ noteOne }}
      </p>
    </div>

    <!-- Second Field: Text Input -->
    <div>
      <label class="block body2 text-gray-2 mb-2">
        {{ questionTwo }}
      </label>

      <TextInput
        v-model="internalData"
        :field-name="FIELD_TWO"
        :placeholder="placeholderTwo ?? 'Text field'"
        :required="required"
        :is-primary="true"
        :allow-n-a="true"
      />

      <!-- Note for second field -->
      <p v-if="noteTwo" class="mt-2 body2 text-gray-11 font-medium italic">
        {{ noteTwo }}
      </p>
    </div>
  </div>
</template>
