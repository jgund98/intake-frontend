<script setup lang="ts">
// Js Dependencies
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRuntimeConfig } from '#imports';

// Components
import Stepper from '~/components/ui/stepper/Stepper.vue';
import ConfirmationModal from '~/components/ui/ConfirmationModal.vue';

// Stores
import { useFormStore } from '~/stores/intakeFormStore';
import { useOrganizationStore } from '~/stores/organizationStore';

// Import form configuration
import { getCurrentFormConfig } from '~/data/forms/index';

// Types
interface Step {
  id: number;
  label: string;
}

interface FormStep {
  stepId: number;
  stepTitle: string;
  marketingId: number | null;
  subSteps: unknown[];
}

const {
  public: { projectLogoUrl, projectName, originalDomain },
} = useRuntimeConfig();

// Composables
const route = useRoute();
const router = useRouter();
const formStore = useFormStore();
const orgStore = useOrganizationStore();

// Reactive form config - uses category from organizationStore
const config = computed(() => {
  const category = orgStore.category;
  return getCurrentFormConfig(category || undefined);
});

// Steps configuration from dynamic form config
const steps = computed<Step[]>(() => {
  return (config.value.steps as FormStep[]).map(step => ({
    id: step.stepId,
    label: step.stepTitle,
  }));
});

// Get current step ID from Pinia store
const currentStepId = computed(() => formStore.currentStepId);

// Simple mode pages with titles
const simpleModePages: Record<string, string> = {
  product: 'You are almost done, {userName}',
  payment: "You're just a step away, {userName}!",
  success: 'Success',
};

// Check if route path contains simple mode keywords
const isSimpleMode = computed(() => {
  const path = route.path.toLowerCase();
  return Object.keys(simpleModePages).some(key => path.includes(key));
});

// Parse heading into segments for safe rendering
const headingSegments = computed(() => {
  if (!displayTitle.value) return [];

  const formData = formStore.getFormData as Record<string, any>;
  const basicInfo = formData?.basicInfo as Record<string, any> | undefined;
  const firstName = basicInfo?.firstName || '';

  // If no userName placeholder or no firstName, return as single segment
  if (!displayTitle.value.includes('{userName}')) {
    return [{ text: displayTitle.value, isUserName: false }];
  }

  if (!firstName) {
    return [{ text: displayTitle.value, isUserName: false }];
  }

  // Split the heading by {userName} and create segments
  const parts = displayTitle.value.split('{userName}');
  const segments: Array<{ text: string; isUserName: boolean }> = [];

  parts.forEach((part, index) => {
    if (part) {
      segments.push({ text: part, isUserName: false });
    }
    // Add userName segment between parts (but not after the last part)
    if (index < parts.length - 1) {
      segments.push({ text: firstName, isUserName: true });
    }
  });

  return segments;
});

// Get title for simple mode
const displayTitle = computed(() => {
  const path = route.path.toLowerCase();
  const matchedKey = Object.keys(simpleModePages).find(key =>
    path.includes(key)
  );
  return matchedKey ? simpleModePages[matchedKey] : '';
});

// Stepper mode is opposite of simple mode
const isStepperMode = computed(() => !isSimpleMode.value);

// Check if current page is success page
const isSuccessPage = computed(() => {
  const path = route.path.toLowerCase();
  return path.includes('success');
});

// Show Start Over button on all pages except success page
const showStartOver = computed(() => !isSuccessPage.value);

// Modal state
const showResetModal = ref(false);

// Show confirmation modal
const handleStartOverClick = () => {
  showResetModal.value = true;
};

// Handle Reset Form using Pinia store (called after confirmation)
const handleResetForm = () => {
  // Save category and productId before reset (they're in orgStore, not formStore)
  const category = orgStore.category;
  const productId = orgStore.preselectedProductId;

  // Reset form data
  formStore.resetForm();

  // Close modal
  showResetModal.value = false;

  // Build query with preserved category and productId
  const query: Record<string, string> = {};
  if (category) {
    query.category = category;
  }
  if (productId) {
    query.productId = productId;
  }

  // Redirect to index page with query params
  router.push({ path: '/', query });
};
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-4 xl:px-[52px] xl:py-[24px] md:border-b md:border-border-base md:shadow-sm"
  >
    <div class="flex items-center justify-between">
      <!-- Mobile Layout -->
      <div class="xl:hidden flex items-center justify-between w-full 2xl:w-max">
        <!-- Logo -->
        <NuxtLink
          :to="originalDomain"
          external
          class="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg inset-shadow-2xs"
        >
          <NuxtImg
            :src="projectLogoUrl"
            :alt="projectName + ' Logo'"
            class="h-5 md:h-6 w-auto"
            loading="eager"
          />
        </NuxtLink>

        <!-- Stepper Mode: Step Counter -->
        <!-- Visible only below 1024px -->
        <div v-if="isStepperMode" class="flex lg:hidden items-center gap-3">
          <div class="body1 font-medium text-gray-1">
            Step
            <span class="text-primary font-semibold">{{ currentStepId }}</span>
            of
            {{ steps.length }}
          </div>

          <!-- Start Over Button (Mobile) -->
          <button
            v-if="showStartOver"
            class="w-10 h-10 rounded-full bg-gray-1 text-white flex items-center justify-center hover:bg-gray-2 transition-colors"
            @click="handleStartOverClick"
          >
            <NuxtImg
              src="/icons/start-over.svg"
              alt="Start Over"
              width="12"
              height="16"
              class="w-3 h-4"
            />
          </button>
        </div>

        <!-- Simple Mode: Title -->
        <div v-else-if="isSimpleMode" class="flex items-center gap-3">
          <div
            v-if="displayTitle"
            class="hidden sm:block sm:h4 lg:h2 !font-semibold !font-domine text-gray-1"
          >
            <template v-for="(segment, index) in headingSegments" :key="index">
              <span v-if="segment.isUserName" class="text-primary">{{
                segment.text
              }}</span>
              <span v-else>{{ segment.text }}</span>
            </template>
          </div>

          <!-- Start Over Button (Mobile - Simple Mode) -->
          <button
            v-if="showStartOver"
            class="w-10 h-10 rounded-full bg-gray-1 text-white flex items-center justify-center hover:bg-gray-2 transition-colors"
            @click="handleStartOverClick"
          >
            <NuxtImg
              src="/icons/start-over.svg"
              alt="Start Over"
              width="16"
              height="16"
              class="w-4 h-4"
            />
          </button>
        </div>
      </div>

      <!-- Desktop Layout: Stepper Mode -->
      <div v-if="isStepperMode" class="hidden lg:flex gap-6 items-center">
        <Stepper :steps="steps" :current-step="currentStepId" />

        <button
          v-if="showStartOver"
          class="w-10 h-10 rounded-full bg-gray-1 text-white flex items-center justify-center hover:bg-gray-2 transition-colors xl:hidden"
          @click="handleStartOverClick"
        >
          <NuxtImg
            src="/icons/start-over.svg"
            alt="Start Over"
            width="12"
            height="16"
            class="w-3 h-4"
          />
        </button>
      </div>

      <!-- Desktop Layout: Simple Mode -->
      <div v-else-if="isSimpleMode" class="hidden xl:block">
        <div
          v-if="displayTitle"
          class="h2 !font-semibold !font-domine text-gray-1"
        >
          <template v-for="(segment, index) in headingSegments" :key="index">
            <span v-if="segment.isUserName" class="text-primary">{{
              segment.text
            }}</span>
            <span v-else>{{ segment.text }}</span>
          </template>
        </div>
      </div>

      <!-- Visible over 1280px -->
      <button
        v-if="showStartOver"
        class="hidden xl:flex items-center gap-2 bg-gray-1 text-white px-6 py-2.5 rounded-full body1 font-medium hover:bg-gray-2 transition-colors"
        @click="handleStartOverClick"
      >
        <NuxtImg
          src="/icons/start-over.svg"
          alt="Start Over"
          width="12"
          height="16"
          class="w-3 h-4"
        />
        Start Over
      </button>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      v-model="showResetModal"
      title="Are your sure you want to Reset?"
      message="Hey, just a heads up! Resetting your inputs means you'll lose all your data and start fresh from step 1. Are you sure you want to do that?"
      confirm-text="Sure, I want to restart!"
      cancel-text="Don't want to restart"
      @confirm="handleResetForm"
    />
  </header>
</template>
