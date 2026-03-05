<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dropdown from '~/components/ui/Dropdown.vue';
import FileUpload from '~/components/cards/FileUpload.vue';

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
  questionThree: string;
  noteOne?: string;
  noteTwo?: string;
  noteThree?: string;
  placeholderOne?: string;
  placeholderTwo?: string;
  maxFiles?: number;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  required?: boolean;
}>();

// Default field names - consistent across all uses
const FIELD_ONE = 'fieldOne'; // Duration
const FIELD_TWO = 'fieldTwo'; // Clinical Diagnosis
const FIELD_THREE = 'fieldThree'; // Photos

// Model value
const modelValue = defineModel<Record<string, any>>({ default: {} });

// Internal state for child components
const internalData = ref<Record<string, any>>({
  [FIELD_ONE]: '',
  [FIELD_TWO]: '',
  [FIELD_THREE]: [],
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
      if (newData[FIELD_THREE] && Array.isArray(newData[FIELD_THREE])) {
        internalData.value[FIELD_THREE] = newData[FIELD_THREE];
      }
    }
  },
  { immediate: true, deep: true }
);

// Check if all three fields are complete
const isComplete = computed(() => {
  const fieldOneValue = internalData.value[FIELD_ONE];
  const fieldTwoValue = internalData.value[FIELD_TWO];
  const fieldThreeValue = internalData.value[FIELD_THREE];

  const isFieldOneValid =
    fieldOneValue !== null &&
    fieldOneValue !== undefined &&
    String(fieldOneValue).trim() !== '';

  const isFieldTwoValid =
    fieldTwoValue !== null &&
    fieldTwoValue !== undefined &&
    String(fieldTwoValue).trim() !== '';

  const isFieldThreeValid =
    Array.isArray(fieldThreeValue) &&
    fieldThreeValue.length > 0 &&
    fieldThreeValue[0] &&
    typeof fieldThreeValue[0] === 'object' &&
    fieldThreeValue[0].name &&
    fieldThreeValue[0].fileUrl &&
    fieldThreeValue[0].s3Key;

  return isFieldOneValid && isFieldTwoValid && isFieldThreeValid;
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
      [FIELD_THREE]: internalData.value[FIELD_THREE],
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
    <!-- First Field: Dropdown (Duration) -->
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

    <!-- Second Field: Dropdown (Clinical Diagnosis) -->
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

    <!-- Third Field: File Upload -->
    <div>
      <label class="block body2 text-gray-2 mb-2">
        {{ questionThree }}
      </label>

      <FileUpload
        v-model="internalData"
        :field-name="FIELD_THREE"
        :max-files="maxFiles ?? 5"
        :accepted-file-types="acceptedFileTypes ?? 'image/*'"
        :max-file-size="maxFileSize ?? 10485760"
      />

      <!-- Note for third field -->
      <p v-if="noteThree" class="mt-2 body2 text-gray-11 font-medium italic">
        {{ noteThree }}
      </p>
    </div>
  </div>
</template>
