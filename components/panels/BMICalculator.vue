<script setup lang="ts">
// Js Dependencies
import { ref, computed, watch } from 'vue';

// Components
import NumberInput from '~/components/ui/NumberInput.vue';

// Props
const props = defineProps<{ fieldName: string }>();

// Model value
const modelValue = defineModel<Record<string, any>>();

// Form state - separate objects for each NumberInput
const ageData = ref<Record<string, any>>({});
const feetData = ref<Record<string, any>>({});
const inchesData = ref<Record<string, any>>({});
const weightData = ref<Record<string, any>>({});

// Computed values for easier access
const age = computed(() => ageData.value.age ?? null);
const feet = computed(() => feetData.value.feet ?? null);
const inches = computed(() => inchesData.value.inches ?? null);
const weight = computed(() => weightData.value.weight ?? null);

// Watch for external changes to modelValue and initialize on mount
watch(
  () => modelValue.value?.[props.fieldName],
  newData => {
    if (newData && typeof newData === 'object') {
      // Only update if values are different to avoid infinite loops
      if (newData.age !== undefined && newData.age !== age.value) {
        ageData.value = { age: newData.age };
      }
      if (newData.feet !== undefined && newData.feet !== feet.value) {
        feetData.value = { feet: newData.feet };
      }
      if (newData.inches !== undefined && newData.inches !== inches.value) {
        inchesData.value = { inches: newData.inches };
      }
      if (newData.weight !== undefined && newData.weight !== weight.value) {
        weightData.value = { weight: newData.weight };
      }
    }
  },
  { immediate: true }
);

// Error Message
const errorMessage = ref<string | null>(null);

// BMI Calculation (Imperial)
const bmi = computed(() => {
  const feetVal = feet.value;
  const inchesVal = inches.value;
  const weightVal = weight.value;

  if (!feetVal || weightVal === null) return null;

  const totalInches = feetVal * 12 + (inchesVal || 0);
  if (totalInches === 0) return null;

  const value = (703 * weightVal) / totalInches ** 2;
  return parseFloat(value.toFixed(1));
});

// Methods
const handleValidation = (age: number | null, bmi: number | null): boolean => {
  const isAgeComplete = age && age > 0 && age <= 100;
  const isBmiComplete = bmi && bmi >= 0;
  const isComplete = isAgeComplete && isBmiComplete;
  if (!isComplete) {
    modelValue.value = { ...modelValue.value, [props.fieldName]: {} };
    if (!isAgeComplete) {
      errorMessage.value = 'Please enter a valid age.';
      return false;
    }
    if (!isBmiComplete) {
      errorMessage.value = 'Please enter a valid BMI.';
      return false;
    }
  }

  errorMessage.value = null;
  return true;
};

// Watch all input changes
watch(
  [ageData, feetData, inchesData, weightData],
  () => {
    const ageVal = age.value;
    const feetVal = feet.value;
    const inchesVal = inches.value;
    const weightVal = weight.value;

    // If feet is provided but inches is null, set inches to 0
    if (feetVal !== null && inchesVal === null) {
      inchesData.value = { inches: 0 };
    }

    // Handle Validation
    if (!handleValidation(ageVal, bmi.value)) return;

    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: {
        age: ageVal,
        feet: feetVal,
        inches: inchesVal || 0,
        weight: weightVal,
        bmi: bmi.value,
      },
    };
  },
  { deep: true }
);
</script>

<template>
  <div
    class="w-full bg-primary-dark-1 rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4"
  >
    <!-- Age -->
    <div class="flex flex-wrap items-center gap-3">
      <span class="subtitle1">I'm</span>
      <NumberInput
        v-model="ageData"
        field-name="age"
        placeholder="23"
        :max="100"
        name="age"
        class="w-30 h-12"
      />
      <span class="subtitle1">years old</span>
    </div>

    <!-- Height -->
    <div class="flex flex-wrap items-center gap-3">
      <span class="subtitle1">My height is</span>
      <NumberInput
        v-model="feetData"
        field-name="feet"
        placeholder="5"
        :max="9"
        name="feet"
        class="w-30 h-12"
      />
      <span class="subtitle1">feet</span>
      <NumberInput
        v-model="inchesData"
        field-name="inches"
        placeholder="10"
        :max="11"
        name="inches"
        class="w-30 h-12"
      />
      <span class="subtitle1">inches</span>
    </div>

    <!-- Weight -->
    <div class="flex flex-wrap items-center gap-3">
      <span class="subtitle1">I currently weigh</span>
      <NumberInput
        v-model="weightData"
        field-name="weight"
        placeholder="160"
        :max="600"
        name="weight"
        class="w-30 h-12"
      />
      <span class="subtitle1">pounds</span>
    </div>

    <!-- BMI -->
    <div class="flex items-center gap-3 border-t border-primary-dark-3 pt-4">
      <span class="text-subtitle2 font-normal">My BMI is approximately</span>
      <div
        class="flex items-center justify-center w-12 h-10 rounded-[10px] bg-background font-bold text-primary text-h5"
      >
        {{ bmi ?? 0 }}
      </div>
    </div>
  </div>
</template>
