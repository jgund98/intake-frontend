<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import SingleSelect from '~/components/ui/SingleSelect.vue';
import Dropdown from '~/components/ui/Dropdown.vue';
import usStates from '~/data/usStates.json';

const props = defineProps<{
  fieldName: string;
  required?: boolean;
}>();

const stateOptions = usStates;

const allConsultationOptions = [
  {
    label: 'Phone/Video consultation',
    value: 'Phone/Video consultation',
  },
  {
    label: 'Email/Text Message consultation (free)',
    value: 'Email/Text Message consultation (free)',
  },
];

const phoneVideoAllowedStates = ['NM', 'MS', 'KS', 'WV', 'RI'];

const modelValue = defineModel<Record<string, any>>({ default: {} });

const formData = ref<Record<string, any>>({
  state: '',
  consultationType: '',
});

// Watch parent modelValue and restore to local formData
watch(
  () => modelValue.value[props.fieldName],
  newVal => {
    if (newVal && typeof newVal === 'object') {
      formData.value = { ...formData.value, ...newVal };
    }
  },
  { immediate: true, deep: true }
);

const consultationOptions = computed(() => {
  const selectedState = formData.value.state;

  if (!selectedState) return [];

  // If state is in phoneVideoAllowedStates, show only Phone/Video option
  if (phoneVideoAllowedStates.includes(selectedState)) {
    return allConsultationOptions.filter(
      option => option.value === 'Phone/Video consultation'
    );
  }

  // Otherwise, show only Email/Text option
  return allConsultationOptions.filter(
    option => option.value === 'Email/Text Message consultation (free)'
  );
});

const isConsultationDisabled = computed(() => {
  return !formData.value.state;
});

const isComplete = computed(() => {
  return formData.value.state && formData.value.consultationType;
});

// Watch state changes to clear consultationType if it becomes invalid
watch(
  () => formData.value.state,
  (newState, oldState) => {
    if (
      newState !== oldState &&
      formData.value.consultationType === 'Phone/Video consultation'
    ) {
      // Clear phone/video selection if new state doesn't allow it
      if (!phoneVideoAllowedStates.includes(newState)) {
        formData.value.consultationType = '';
      }
    }
  }
);

// Watch local formData and emit to parent
watch(
  formData,
  newVal => {
    const currentValue = modelValue.value[props.fieldName];

    // If required and validation fails, remove from modelValue
    if (props.required && !isComplete.value) {
      // Only remove if there's actually a value to remove
      if (currentValue !== undefined) {
        const newModelValue = { ...modelValue.value };
        delete newModelValue[props.fieldName];
        modelValue.value = newModelValue;
      }
      return;
    }

    // Check if value actually changed to prevent infinite loop
    const newValue = { ...newVal };

    if (JSON.stringify(currentValue) === JSON.stringify(newValue)) {
      return;
    }

    // Emit the complete formData as the value for this fieldName
    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: newValue,
    };
  },
  { deep: true }
);
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- State Selector -->
    <div class="flex flex-col gap-3">
      <label class="font-regular text-h6">The state I live in</label>
      <SingleSelect
        key="state-dropdown"
        v-model="formData"
        :options="stateOptions"
        fieldName="state"
        placeholder="Select your state"
        :required="true"
        error-message="Please select your state"
        class="w-full md:max-w-50"
        :is-primary="true"
      />
      <p class="text-caption text-gray-6 font-regular italic">
        This helps us identify which consultation is available based on your
        location
      </p>
    </div>

    <!-- Consultation Type -->
    <div class="flex flex-col gap-3">
      <label class="font-regular text-h6"
        >I'd prefer to consult with my provider via:</label
      >
      <Dropdown
        key="consultation-dropdown"
        v-model="formData"
        :options="consultationOptions"
        fieldName="consultationType"
        :required="true"
        :disabled="isConsultationDisabled"
        class="w-full"
      />

      <!-- Dynamic Info Section -->
      <div
        class="mt-2 p-4 md:p-6 bg-primary-light-4 rounded-lg border border-primary-dark-7"
      >
        <div class="flex flex-col gap-2 text-body-2 md:text-body-1 text-gray-4">
          <p class="leading-relaxed">
            • $80 consultation fee will apply only if your prescription is
            approved and you choose not to proceed with treatment.
          </p>
          <p class="leading-relaxed">
            • The consultation is free if you move forward with purchasing your
            prescription.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
