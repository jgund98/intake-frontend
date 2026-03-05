<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import TextInput from '~/components/ui/TextInput.vue';
import EmailInput from '~/components/ui/EmailInput.vue';
import PhoneInput from '~/components/ui/PhoneInput.vue';
import DatePicker from '~/components/ui/DatePicker.vue';

const props = defineProps<{
  fieldName: string;
  required?: boolean;
  basicInfoFieldName?: string; // Field name to get BasicInfo data from
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

// Get BasicInfo data if fieldName is provided
const basicInfoData = computed(() => {
  if (props.basicInfoFieldName && modelValue.value[props.basicInfoFieldName]) {
    return modelValue.value[props.basicInfoFieldName];
  }
  return {};
});

// Form data - initialize with BasicInfo values if available
const formData = ref<Record<string, any>>({
  firstName: basicInfoData.value.firstName || '',
  lastName: basicInfoData.value.lastName || '',
  email: basicInfoData.value.email || '',
  phoneNumber: '',
  birthDate: '',
  consent: false,
});

// Watch BasicInfo data and update formData when it changes
watch(
  basicInfoData,
  newBasicInfo => {
    if (newBasicInfo && typeof newBasicInfo === 'object') {
      formData.value.firstName =
        newBasicInfo.firstName || formData.value.firstName;
      formData.value.lastName =
        newBasicInfo.lastName || formData.value.lastName;
      formData.value.email = newBasicInfo.email || formData.value.email;
    }
  },
  { immediate: true, deep: true }
);

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

// Date range for birth date
const currentYear = new Date().getFullYear();

// Zod validation schema
const userDetailsSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .regex(/^[A-Za-z\s']+$/, 'First name must contain only letters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .regex(/^[A-Za-z\s']+$/, 'Last name must contain only letters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().refine(val => {
    if (!val || val.trim().length === 0) return false;
    try {
      return isValidPhoneNumber(val.trim());
    } catch {
      return false;
    }
  }, 'Please enter a valid phone number'),
  birthDate: z.string().min(1, 'Birth date is required'),
  consent: z
    .boolean()
    .refine(val => val === true, 'You must agree to continue'),
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
  const result = userDetailsSchema.safeParse(formData.value);
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

// Sync firstName, lastName, and email changes back to BasicInfo
watch(
  () => [
    formData.value.firstName,
    formData.value.lastName,
    formData.value.email,
  ],
  ([newFirstName, newLastName, newEmail]) => {
    if (!props.basicInfoFieldName) return;

    const basicInfo = modelValue.value[props.basicInfoFieldName];
    if (!basicInfo) return;

    // Check if any of the synced fields have changed
    const hasChanged =
      basicInfo.firstName !== newFirstName ||
      basicInfo.lastName !== newLastName ||
      basicInfo.email !== newEmail;

    if (hasChanged) {
      modelValue.value = {
        ...modelValue.value,
        [props.basicInfoFieldName]: {
          ...basicInfo,
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
        },
      };
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- First Name & Last Name -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">First Name</label>
        <TextInput
          v-model="formData"
          fieldName="firstName"
          placeholder="First Name"
          :is-primary="false"
          :validator="validateFirstName"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">Last Name</label>
        <TextInput
          v-model="formData"
          fieldName="lastName"
          placeholder="Last Name"
          :is-primary="false"
          :validator="validateLastName"
        />
      </div>
    </div>

    <!-- Email, Phone Number, and Date of Birth -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">Email</label>
        <EmailInput
          v-model="formData"
          fieldName="email"
          placeholder="you@example.com"
          :required="true"
          :is-primary="false"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="font-regular text-body1 text-gray-2">Phone Number</label>
        <PhoneInput
          v-model="formData"
          fieldName="phoneNumber"
          placeholder="+1 xxx xxx xxxx"
          :required="true"
          :is-primary="false"
        />
      </div>

      <div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
        <label class="font-regular text-body1 text-gray-2"
          >Your date of birth</label
        >
        <DatePicker
          v-model="formData"
          fieldName="birthDate"
          placeholder="Select date of birth"
          :min-date="`${currentYear - 100}-01-01`"
          :max-date="new Date().toISOString().split('T')[0]"
          :required="true"
          :is-primary="false"
        />
      </div>
    </div>

    <!-- Consent Section -->
    <div
      class="flex flex-col gap-4 p-4 md:p-6 rounded-2xl bg-yellow-50 text-accent-dark"
    >
      <h3 class="font-semibold subtitle1">
        Please attest to the following confirming that all information you have
        provided to us is true and complete. If you do not agree, you may not
        submit this form.
      </h3>
      <label
        class="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-xl transition-all"
        :class="
          formData.consent
            ? 'border-yellow-300 bg-primary-dark-2'
            : 'border-yellow-300 hover:border-yellow-400'
        "
      >
        <input
          v-model="formData.consent"
          type="checkbox"
          class="w-5 h-5 mt-0.5 rounded border-2 border-yellow-400 text-primary focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer accent-yellow-400"
        />
        <span class="text-body2 font-medium text-gray-1">
          I confirm that I am the patient completing this intake form and have
          reviewed all questions carefully. I attest that my answers are true,
          accurate, and complete to the best of my knowledge. I understand the
          importance of providing my doctor with complete and accurate health
          information for my care.
        </span>
      </label>
    </div>
  </div>
</template>
