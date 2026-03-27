<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import FileUpload from '~/components/cards/FileUpload.vue';
import NumberInput from '~/components/ui/NumberInput.vue';
import DateInput from '~/components/ui/DateInput.vue';
import Dropdown from '~/components/ui/Dropdown.vue';

interface MedicationOption {
  label: string;
  value: string;
}

const props = defineProps<{
  medicationOptions: MedicationOption[];
  fieldName: string;
  required?: boolean;
}>();

const modelValue = defineModel<Record<string, any>>({ default: {} });

const formData = ref<Record<string, any>>({
  medication: '',
  lastDoseDate: '',
  doseMg: null,
  prescription: null,
});

watch(
  () => modelValue.value[props.fieldName],
  newVal => {
    if (newVal && typeof newVal === 'object') {
      formData.value = { ...formData.value, ...newVal };
    }
  },
  { immediate: true, deep: true }
);

const isComplete = computed(() => {
  return (
    formData.value.medication &&
    formData.value.lastDoseDate &&
    formData.value.doseMg !== null &&
    formData.value.doseMg !== '' &&
    formData.value.doseMg > 0 &&
    formData.value.prescription
  );
});

watch(
  formData,
  newVal => {
    const currentValue = modelValue.value[props.fieldName];

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
    const newValue = { ...newVal };

    if (JSON.stringify(currentValue) === JSON.stringify(newValue)) {
      return;
    }

    modelValue.value = { ...modelValue.value, [props.fieldName]: newValue };
  },
  { deep: true }
);
</script>

<template>
  <div
    class="flex flex-col gap-5 p-5 rounded-2xl bg-primary-dark-1 text-gray-2"
  >
    <!-- Medication Dropdown -->
    <div class="flex flex-col gap-3 w-full max-w-61 md:max-w-100">
      <label class="font-regular text-subtitle1 text-gray-2"
        >The medication I'm currently taking is:</label
      >
      <Dropdown
        v-model="formData"
        fieldName="medication"
        :options="medicationOptions"
        :required="true"
      />
    </div>

    <!-- Date Picker -->
    <div class="flex md:flex-row flex-col gap-3 md:items-center">
      <label class="font-regular text-subtitle1 text-gray-2"
        >My last dose was on:</label
      >
      <DateInput
        v-model="formData"
        placeholder="Date"
        :max-date="new Date().toISOString().split('T')[0]"
        fieldName="lastDoseDate"
        class="w-full max-w-61 md:max-w-36"
      />
    </div>

    <!-- Number Input -->
    <div class="flex items-center gap-3">
      <label class="font-regular text-subtitle1 text-gray-2"
        >The dose was:</label
      >
      <NumberInput
        v-model="formData"
        fieldName="doseMg"
        placeholder="23"
        class="w-21"
      />
      <span class="font-regular text-subtitle1 text-gray-2">mg</span>
    </div>

    <!-- File Upload -->
    <div class="flex flex-col gap-3">
      <label class="font-regular text-subtitle1 text-gray-2"
        >I can share my current prescription:</label
      >
      <FileUpload v-model="formData" fieldName="prescription" />
      <p class="text-caption text-gray-6 font-regular italic">
        Please ensure it shows your name, medication, and strength clearly
      </p>
    </div>
  </div>
</template>
