<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { z } from 'zod';
import TextInput from '~/components/ui/TextInput.vue';
import EmailInput from '~/components/ui/EmailInput.vue';
import Dropdown from '~/components/ui/Dropdown.vue';

const props = defineProps<{
  fieldName: string;
  required?: boolean;
}>();

const modelValue = defineModel<Record<string, any>>({ default: {} });

// Helper function to capitalize names
const capitalizeName = (name: string): string => {
  if (!name) return name;

  return name
    .split(' ')
    .map(word => {
      if (!word) return word;
      // Handle names with apostrophes (e.g., O'Brien)
      return word
        .split("'")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join("'");
    })
    .join(' ');
};

// Form data
const formData = ref<Record<string, any>>({
  firstName: '',
  lastName: '',
  email: '',
  gender: '',
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

// Watch and capitalize firstName
watch(
  () => formData.value.firstName,
  (newValue, oldValue) => {
    if (newValue && newValue !== oldValue) {
      const capitalized = capitalizeName(newValue);
      if (capitalized !== newValue) {
        formData.value.firstName = capitalized;
      }
    }
  }
);

// Watch and capitalize lastName
watch(
  () => formData.value.lastName,
  (newValue, oldValue) => {
    if (newValue && newValue !== oldValue) {
      const capitalized = capitalizeName(newValue);
      if (capitalized !== newValue) {
        formData.value.lastName = capitalized;
      }
    }
  }
);

// Gender options
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

// Zod validation schema
const basicInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .regex(/^[A-Za-z\s']+$/, 'First name must contain only letters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .regex(/^[A-Za-z\s']+$/, 'Last name must contain only letters'),
  email: z.string().email('Invalid email address'),
  gender: z.string().min(1, 'Gender is required'),
});

// Validator functions for TextInput
const validateFirstName = (value: string): string => {
  const schema = z
    .string()
    .min(1, 'First name is required')
    .regex(/^[A-Za-z\s']+$/, 'First name must contain only letters');

  const result = schema.safeParse(value);
  if (result.success) return '';
  return result.error.issues[0]?.message || '';
};

const validateLastName = (value: string): string => {
  const schema = z
    .string()
    .min(1, 'Last name is required')
    .regex(/^[A-Za-z\s']+$/, 'Last name must contain only letters');

  const result = schema.safeParse(value);
  if (result.success) return '';
  return result.error.issues[0]?.message || '';
};

// Validation function
const isComplete = computed(() => {
  const result = basicInfoSchema.safeParse(formData.value);
  return result.success;
});

// Watch formData and update modelValue
watch(
  formData,
  newVal => {
    const currentValue = modelValue.value[props.fieldName];

    // If required and validation fails, remove from modelValue
    if (props.required && !isComplete.value) {
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

    // Update modelValue with validated data
    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: newValue,
    };
  },
  { deep: true }
);
</script>

<template>
  <div class="flex flex-col gap-5 p-6 bg-primary-dark-1 rounded-[14px]">
    <!-- First Name & Last Name -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">First Name</label>
        <TextInput
          v-model="formData"
          fieldName="firstName"
          placeholder="First Name"
          :validator="validateFirstName"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">Last Name</label>
        <TextInput
          v-model="formData"
          fieldName="lastName"
          placeholder="Last Name"
          :validator="validateLastName"
        />
      </div>
    </div>

    <!-- Email & Gender -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">Email</label>
        <EmailInput
          v-model="formData"
          fieldName="email"
          placeholder="you@example.com"
          :required="true"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">Gender</label>
        <Dropdown
          v-model="formData"
          fieldName="gender"
          :options="genderOptions"
          placeholder="Gender assigned at birth"
          :required="true"
          error-message="Gender is required"
        />
      </div>
    </div>
  </div>
</template>
