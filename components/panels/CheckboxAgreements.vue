<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import CheckBox from '~/components/ui/CheckBox.vue';

// Props
const props = defineProps<{
  fieldName: string;
  questionOne?: string;
  questionTwo?: string;
  checkboxLabelOne?: string;
  checkboxLabelTwo?: string;
  noteOne?: string;
  noteTwo?: string;
  required?: boolean;
}>();

// Default field names - consistent across all uses
const FIELD_ONE = 'fieldOne';
const FIELD_TWO = 'fieldTwo';

// Model value
const modelValue = defineModel<Record<string, any>>({ default: {} });

// Internal state for child components (boolean for checkbox state)
const internalData = ref<Record<string, boolean>>({
  [FIELD_ONE]: false,
  [FIELD_TWO]: false,
});

// Build agreements array from props
const agreements = computed(() => {
  const items = [];

  if (props.questionOne && props.checkboxLabelOne) {
    items.push({
      fieldName: FIELD_ONE,
      question: props.questionOne,
      label: props.checkboxLabelOne,
      note: props.noteOne,
    });
  }

  if (props.questionTwo && props.checkboxLabelTwo) {
    items.push({
      fieldName: FIELD_TWO,
      question: props.questionTwo,
      label: props.checkboxLabelTwo,
      note: props.noteTwo,
    });
  }

  return items;
});

// Watch for external changes to modelValue and initialize on mount
watch(
  () => modelValue.value?.[props.fieldName],
  newData => {
    if (newData && typeof newData === 'object') {
      // Update internal data from parent (convert string to boolean)
      if (newData[FIELD_ONE] !== undefined) {
        internalData.value[FIELD_ONE] = newData[FIELD_ONE] === 'Agreed';
      }
      if (newData[FIELD_TWO] !== undefined) {
        internalData.value[FIELD_TWO] = newData[FIELD_TWO] === 'Agreed';
      }
    }
  },
  { immediate: true, deep: true }
);

// Check if all required checkboxes are agreed
const isComplete = computed(() => {
  return agreements.value.every(agreement => {
    return internalData.value[agreement.fieldName] === true;
  });
});

// Watch internal data and update parent modelValue
watch(
  internalData,
  () => {
    const currentValue = modelValue.value[props.fieldName];

    // Convert boolean to string ("Agreed" or "Not agreed")
    const newValue: Record<string, string> = {
      [FIELD_ONE]: internalData.value[FIELD_ONE] ? 'Agreed' : 'Not agreed',
      [FIELD_TWO]: internalData.value[FIELD_TWO] ? 'Agreed' : 'Not agreed',
    };

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
  <div class="flex flex-col gap-6">
    <!-- Loop through agreements -->
    <div
      v-for="agreement in agreements"
      :key="agreement.fieldName"
      class="flex flex-col gap-4"
    >
      <!-- Question Text -->
      <div
        class="body2 text-gray-2 leading-relaxed"
        v-html="agreement.question"
      />

      <!-- Checkbox -->
      <div
        class="p-4 rounded-2xl bg-primary-dark-1 border border-primary-dark-5"
      >
        <CheckBox
          v-model="internalData"
          :field-name="agreement.fieldName"
          :label="agreement.label"
          :required="required"
        />
      </div>

      <!-- Note (optional) -->
      <p v-if="agreement.note" class="body2 text-gray-11 font-medium italic">
        {{ agreement.note }}
      </p>
    </div>
  </div>
</template>
