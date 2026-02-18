<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  fieldName: {
    type: String,
    required: true,
  },
  name: String,
  placeholder: String,
  required: {
    type: Boolean,
    default: false,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: Infinity,
  },
});

const modelValue = defineModel<Record<string, any>>({ default: {} });
const numberValue = ref<string | number | null>(
  modelValue.value[props.fieldName] ?? null
);

// Watch numberValue changes and update modelValue with validation
watch(numberValue, newVal => {
  // 1. Handle empty/null
  if (newVal == null || newVal === '' || String(newVal).trim() === '') {
    modelValue.value = { ...modelValue.value, [props.fieldName]: null };
    return;
  }

  // 2. Sanitize: Allow digits and one dot
  let sanitized = String(newVal).replace(/[^0-9.]/g, '');

  // 3. Enforce max 1 decimal place
  const parts = sanitized.split('.');
  if (parts.length > 1) {
    sanitized = parts[0] + '.' + parts.slice(1).join('').slice(0, 1);
  }

  let n = parseFloat(sanitized);

  if (isNaN(n)) {
    modelValue.value = { ...modelValue.value, [props.fieldName]: null };
    return;
  }

  // 4. NEW: Snap to nearest 0.5 if a decimal digit exists
  // We check /\.\d/ to ensure we don't snap "5." before the user types the digit
  if (/\.\d/.test(sanitized)) {
    n = Math.round(n * 2) / 2;
    // Update sanitized string to match the new snapped number so the input updates
    sanitized = String(n);
  }

  // 5. Clamp values (min/max)
  if (n < props.min) n = props.min;
  if (n > props.max) n = props.max;

  modelValue.value = { ...modelValue.value, [props.fieldName]: n };

  // 6. Force update the input box if the value changed (snapped or clamped)
  // This physically changes "5.2" -> "5" or "5.3" -> "5.5" in the box
  if (String(newVal) !== String(n) && String(newVal) !== sanitized) {
    // We compare against 'sanitized' to allow trailing dots like "5." to remain
    // But if we snapped (e.g. 5.2 -> 5), 'sanitized' is now "5", so we update.
    numberValue.value = n;
  }
});

// Watch modelValue changes from parent and update local numberValue
watch(
  () => modelValue.value[props.fieldName],
  newValue => {
    if (newValue !== numberValue.value) {
      numberValue.value = newValue ?? null;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div
    class="flex items-center px-3 rounded-input border-2 border-primary-dark-5 bg-transparent shadow-[0_1px_3px_0_rgba(0,0,0,0.10),0_1px_2px_-1px_rgba(0,0,0,0.10)] h-[42px]"
    v-bind="$attrs"
  >
    <input
      v-model="numberValue"
      :name="fieldName"
      :placeholder="placeholder"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      class="flex-1 min-w-0 bg-transparent outline-none border-none text-base-input text-gray-1 placeholder-gray-11 appearance-none"
    />
  </div>
</template>
