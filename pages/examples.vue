<script setup lang="ts">
// Js Dependencies
import { ref } from 'vue';

// Components
import FormCardWrapper from '~/components/cards/FormCardWrapper.vue';
import BooleanSelectCard from '~/components/panels/BooleanSelectCard.vue';
import SingleSelectCardList from '~/components/panels/SingleSelectCardList.vue';
import BMICalculator from '~/components/panels/BMICalculator.vue';
import MultiSelect from '~/components/panels/MultiSelect.vue';
import CurrentMedication from '~/components/panels/CurrentMedication.vue';
import ConsultationPreference from '~/components/panels/ConsultationPreference.vue';
import Dropdown from '~/components/ui/Dropdown.vue';
import DateInput from '~/components/ui/DateInput.vue';
import TextInput from '~/components/ui/TextInput.vue';
import TextArea from '~/components/ui/TextArea.vue';
import EmailInput from '~/components/ui/EmailInput.vue';
import PhoneInput from '~/components/ui/PhoneInput.vue';

// State
const currentSubStep = ref(1);
const formData = ref<Record<string, any>>({});

// Fake data for BooleanSelectCard
const booleanOptions = [
  { icon: '/icons/medicine.svg', label: 'Yes, I am', value: 'Yes' },
  { icon: '/icons/close.svg', label: "No, I'm not", value: 'No' },
];

// Fake data for SingleSelectCardList
const singleSelectOptions = [
  {
    icon: '/icons/aim.svg',
    label: 'Losing 1–20 lbs and keeping it off',
    value: 'Losing 1–20 lbs and keeping it off',
  },
  {
    icon: '/icons/weight.svg',
    label: 'Losing 21–50 lbs for lasting change',
    value: 'Losing 21–50 lbs for lasting change',
  },
  {
    icon: '/icons/loss.svg',
    label: 'Maintaining current weight with support',
    value: 'Maintaining current weight with support',
  },
];

// Fake data for Dropdown
const dropdownOptions = [
  {
    label: "Video call consultation ($80 fee if I don't proceed)",
    value: 'video_call',
  },
  { label: 'In-person consultation ($100 fee)', value: 'in_person' },
  { label: 'Phone consultation ($50 fee)', value: 'phone' },
  { label: 'Text-based consultation (Free)', value: 'text' },
];

// Fake data for Optional Dropdown
const optionalDropdownOptions = [
  { label: 'Morning (8am - 12pm)', value: 'morning' },
  { label: 'Afternoon (12pm - 5pm)', value: 'afternoon' },
  { label: 'Evening (5pm - 8pm)', value: 'evening' },
];

// Fake data for MultiSelect
const multiSelectOptions = [
  { label: 'Semaglutide (Ozempic / Wegovy)', value: 'semaglutide' },
  {
    label:
      'Tirzepatide (Mounjaro / Zepbound) dfdffsdf sdsfsd fsfsdfdsfere sfdfdsfsf',
    value: 'tirzepatide',
  },
  { label: 'Liraglutide (Victoza / Saxenda)', value: 'liraglutide' },
  { label: 'Dulaglutide (Trulicity)', value: 'dulaglutide' },
  { label: 'Exenatide (Byetta / Bydureon)', value: 'exenatide' },
  { label: 'Lixisenatide (Adlyxin)', value: 'lixisenatide' },
];

// Fake data for CurrentMedication
const medicationOptions = [
  { label: 'Compounded Tirzepatide (injections)', value: 'tirzepatide' },
  { label: 'Semaglutide (injections)', value: 'semaglutide' },
  { label: 'Tirzepatide (commercial)', value: 'tirzepatide-commercial' },
];
</script>

<template>
  <FormCardWrapper
    :total-sub-steps="3"
    :current-sub-step="currentSubStep"
    heading="Tell me about your journey"
    caption="Let's start by understanding what brings you here today"
    question="Right now, I'm focused on some"
  >
    <div class="flex flex-col gap-8 relative">
      <!-- ============================================= -->
      <!-- SELECTION COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">Selection Components</h2>
        </div>

        <!-- Boolean Select Card -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Boolean Select Card - Are you currently taking any medications?
          </h3>
          <BooleanSelectCard
            v-model="formData"
            field-name="takingMedications"
            :options="booleanOptions"
          />
        </div>

        <!-- Single Select Card List -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Single Select Card List - What's your primary goal?
          </h3>
          <SingleSelectCardList
            v-model="formData"
            field-name="primaryGoal"
            :options="singleSelectOptions"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- DROPDOWN COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">Dropdown Components</h2>
        </div>

        <!-- Dropdown (Optional) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Dropdown (Optional)</h3>
          <Dropdown
            v-model="formData"
            field-name="preferredTime"
            :options="optionalDropdownOptions"
            placeholder="Select your preferred time (optional)"
            :required="false"
          />
        </div>

        <!-- Dropdown (Required) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Dropdown (Required)</h3>
          <Dropdown
            v-model="formData"
            field-name="consultationType"
            :options="dropdownOptions"
            placeholder="Choose your preferred consultation method"
            :required="true"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- DATEINPUT COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">DateInput Components</h2>
        </div>

        <!-- DateInput (No restrictions) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            DateInput (No restrictions) - Select any date
          </h3>
          <DateInput
            v-model="formData"
            field-name="anyDate"
            placeholder="Pick any date"
          />
        </div>

        <!-- DateInput (Past dates only - Date of Birth) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            DateInput (Past dates only) - What's your date of birth?
          </h3>
          <DateInput
            v-model="formData"
            field-name="dateOfBirth"
            :max-date="new Date().toISOString().split('T')[0]"
            placeholder="Select your date of birth"
          />
        </div>

        <!-- DateInput (Future dates only) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            DateInput (Future dates only) - Preferred appointment date
          </h3>
          <DateInput
            v-model="formData"
            field-name="appointmentDate"
            :min-date="new Date().toISOString().split('T')[0]"
            placeholder="Select appointment date"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- TEXT INPUT COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">Text Input Components</h2>
        </div>

        <!-- TextInput (Optional with Icon) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Text Input (Optional with Icon)
          </h3>
          <TextInput
            v-model="formData"
            field-name="fullName"
            placeholder="Enter your full name"
            name="fullName"
            left-icon="/icons/aim.svg"
          />
        </div>

        <!-- TextInput (Required) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Text Input (Required - try blur without value)
          </h3>
          <TextInput
            v-model="formData"
            field-name="address"
            placeholder="Enter your address"
            name="address"
            :required="true"
            error-message="Address is required"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- EMAIL INPUT COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">Email Input Components</h2>
        </div>

        <!-- EmailInput (Optional) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Email Input (Optional - test format validation)
          </h3>
          <EmailInput
            v-model="formData"
            field-name="emailOptional"
            placeholder="Enter your email address"
            name="emailOptional"
          />
        </div>

        <!-- EmailInput (Required) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Email Input (Required - test both required and format validation)
          </h3>
          <EmailInput
            v-model="formData"
            field-name="emailRequired"
            placeholder="Enter your email address"
            name="emailRequired"
            :required="true"
            required-message="Please provide your email address"
            invalid-message="That doesn't look like a valid email"
          />
        </div>

        <!-- EmailInput (With Icon) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Email Input (With Icon)</h3>
          <EmailInput
            v-model="formData"
            field-name="emailWithIcon"
            placeholder="Enter your work email"
            name="emailWithIcon"
            left-icon="/icons/aim.svg"
            :required="true"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- PHONE INPUT COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">Phone Input Components</h2>
        </div>

        <!-- PhoneInput (Optional) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Phone Input (Optional)</h3>
          <PhoneInput
            v-model="formData"
            field-name="phoneOptional"
            placeholder="+1 XXX XXX XXXX"
            name="phoneOptional"
          />
        </div>

        <!-- PhoneInput (Required) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Phone Input (Required - test validation)
          </h3>
          <PhoneInput
            v-model="formData"
            field-name="phoneRequired"
            placeholder="+1 XXX XXX XXXX"
            name="phoneRequired"
            :required="true"
            error-message="Please enter a valid phone number"
          />
        </div>

        <!-- PhoneInput (With Icon) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Phone Input (With Icon)</h3>
          <PhoneInput
            v-model="formData"
            field-name="phoneWithIcon"
            placeholder="+1 XXX XXX XXXX"
            name="phoneWithIcon"
            left-icon="/icons/aim.svg"
            :required="true"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- TEXTAREA COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">TextArea Components</h2>
        </div>

        <!-- TextArea (Optional) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            TextArea (Optional - Additional Notes)
          </h3>
          <TextArea
            v-model="formData"
            field-name="notes"
            placeholder="Enter any additional notes..."
            name="notes"
            :rows="4"
          />
        </div>

        <!-- TextArea (Required with Character Limit) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            TextArea (Required with 200 char limit - Medical History)
          </h3>
          <TextArea
            v-model="formData"
            field-name="medicalHistory"
            placeholder="Please describe your medical history..."
            name="medicalHistory"
            :required="true"
            :rows="5"
            :max-length="200"
            error-message="Medical history is required"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- BMI CALCULATOR COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">
            BMI Calculator Component
          </h2>
        </div>

        <!-- BMI Calculator -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            BMI Calculator - Enter height and weight
          </h3>
          <BMICalculator v-model="formData" field-name="bmiCalculation" />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- MULTISELECT COMPONENTS -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">MultiSelect Component</h2>
        </div>

        <!-- MultiSelect (Required) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            MultiSelect (Required) - Select GLP-1 medications
          </h3>
          <MultiSelect
            v-model="formData"
            field-name="glp1Medications"
            :options="multiSelectOptions"
            placeholder="Select GLP-1 or related symptoms..."
            required
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- CURRENT MEDICATION COMPONENT -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">
            Current Medication Component
          </h2>
        </div>

        <!-- Current Medication (Required) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Current Medication (Required) - Complete form with medication
            details
          </h3>
          <CurrentMedication
            v-model="formData"
            field-name="currentMedication"
            :medication-options="medicationOptions"
            :required="true"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- CONSULTATION PREFERENCE COMPONENT -->
      <!-- ============================================= -->
      <div class="space-y-6">
        <div class="border-b-2 border-primary pb-2">
          <h2 class="text-xl font-bold text-primary">
            Consultation Preference Component
          </h2>
        </div>

        <!-- Consultation Preference (Required) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">
            Consultation Preference (Required) - Select state and consultation
            type
          </h3>
          <ConsultationPreference
            v-model="formData"
            field-name="consultationPreference"
            :required="true"
          />
        </div>
      </div>

      <!-- ============================================= -->
      <!-- DEBUG OUTPUT -->
      <!-- ============================================= -->
      <div class="mt-4 p-4 bg-gray-100 rounded">
        <h2 class="text-lg font-bold mb-2">Form Data Debug:</h2>
        <pre class="text-xs text-gray-600 overflow-auto">{{
          JSON.stringify(formData, null, 2)
        }}</pre>
      </div>
    </div>
  </FormCardWrapper>
</template>
