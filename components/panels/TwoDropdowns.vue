<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dropdown from '~/components/ui/Dropdown.vue';

interface DropdownOption {
  label: string;
  value: string;
}

// Props
const props = defineProps<{
  fieldName: string;
  optionsOne: DropdownOption[];
  optionsTwo: DropdownOption[];
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
  [FIELD_ONE]: '',
  [FIELD_TWO]: '',
});

// Watch for external changes to modelValue and initialize on mount
watch(
  () => modelValue.value?.[props.fieldName],
  newData => {
    if (newData && typeof newData === 'object') {
      // Update internal data from parent
      if (newData[FIELD_ONE] !== undefined) {
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

  const isFieldOneValid =
    fieldOneValue !== null &&
    fieldOneValue !== undefined &&
    String(fieldOneValue).trim() !== '';

  const isFieldTwoValid =
    fieldTwoValue !== null &&
    fieldTwoValue !== undefined &&
    String(fieldTwoValue).trim() !== '';

  return isFieldOneValid && isFieldTwoValid;
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
    <!-- First Field: Dropdown -->
    <div>
      <label class="block body2 text-gray-2 mb-2">
        {{ questionOne }}
      </label>

      <Dropdown
        v-model="internalData"
        :field-name="FIELD_ONE"
        :options="optionsOne"
        :placeholder="placeholderOne ?? 'Select an option'"
        :required="required"
        :is-primary="true"
      />

      <!-- Note for first field -->
      <p v-if="noteOne" class="mt-2 body2 text-gray-11 font-medium italic">
        {{ noteOne }}
      </p>
    </div>

    <!-- Second Field: Dropdown -->
    <div>
      <label class="block body2 text-gray-2 mb-2">
        {{ questionTwo }}
      </label>

      <Dropdown
        v-model="internalData"
        :field-name="FIELD_TWO"
        :options="optionsTwo"
        :placeholder="placeholderTwo ?? 'Select an option'"
        :required="required"
        :is-primary="true"
      />

      <!-- Note for second field -->
      <p v-if="noteTwo" class="mt-2 body2 text-gray-11 font-medium italic">
        {{ noteTwo }}
      </p>
    </div>
  </div>
</template>
