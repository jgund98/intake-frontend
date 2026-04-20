<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { z } from 'zod';
import TextInput from '~/components/ui/TextInput.vue';
import EmailInput from '~/components/ui/EmailInput.vue';
import Dropdown from '~/components/ui/Dropdown.vue';

const props = defineProps<{
  fieldName: string;
  required?: boolean;
  showMarketingConsent?: boolean;
  marketingConsentText?: string;
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
  marketingConsent: false,
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
const basicInfoSchema = computed(() => {
  const baseSchema = {
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
  };

  // Add marketingConsent validation if showMarketingConsent is true
  if (props.showMarketingConsent) {
    return z.object({
      ...baseSchema,
      marketingConsent: z.boolean().refine(val => val === true, {
        message: 'You must agree to receive marketing communications',
      }),
    });
  }

  return z.object(baseSchema);
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
  const result = basicInfoSchema.value.safeParse(formData.value);
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

    <!-- Marketing Consent Checkbox -->
    <div
      v-if="showMarketingConsent"
      class="flex items-start gap-3 p-4 rounded-2xl bg-[#FFF9E6] border border-[#FFE999]"
    >
      <input
        id="marketingConsent"
        v-model="formData.marketingConsent"
        type="checkbox"
        class="mt-0.5 w-4 h-4 rounded border-2 border-yellow-400 text-primary focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer flex-shrink-0 accent-yellow-400"
      />
      <label
        for="marketingConsent"
        class="body2 font-regular text-gray-900 leading-relaxed cursor-pointer select-none"
      >
        {{
          marketingConsentText ||
          'I agree to receive emails and text messages for marketing, updates, and promotional purposes from Nyxara. I understand I can opt out at any time.'
        }}
      </label>
    </div>
  </div>
</template>
