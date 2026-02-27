<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFormStore } from '~/stores/intakeFormStore';
import MobileSuccessDetailsWrapper from '~/components/panels/MobileSuccessDetailsWrapper.vue';
import TextArea from '~/components/ui/TextArea.vue';
import { $fetch } from 'ofetch';
import { useGlpTracking } from '~/composables/useGlpTracking';

const { trackConversion } = useGlpTracking();
const router = useRouter();
const formStore = useFormStore();
const config = useRuntimeConfig();

// Screen size tracking
const isMobileScreen = ref(false);

// Mobile success card visibility (only for screens < 1280px)
const showMobileSuccessCard = ref(true);

// Check screen size on mount and resize
onMounted(() => {
  const checkScreenSize = () => {
    isMobileScreen.value = window.innerWidth < 1280; // xl breakpoint is 1280px
  };

  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);

  // Cleanup on unmount
  return () => window.removeEventListener('resize', checkScreenSize);
});

// Feedback state
const selectedRating = ref(0);
const feedbackData = ref({});
const isSubmitting = ref(false);
const submitError = ref('');

// Get user's first name from form data
const userName = computed(() => {
  const userDetails = formStore.formData?.userDetails as any;
  const basicInfo = formStore.formData?.basicInfo as any;
  return userDetails?.firstName || basicInfo?.firstName || 'there';
});

// Get user's email from form data
const userEmail = computed(() => {
  const userDetails = formStore.formData?.userDetails as any;
  const basicInfo = formStore.formData?.basicInfo as any;
  return userDetails?.email || basicInfo?.email || '';
});

// Get project name from environment config
const projectName = computed(() => {
  return config.public.projectName || 'Intake Form';
});

// Check if payment was completed
const isPaymentCompleted = computed(() => formStore.isPaymentCompleted);

const CALENDLY_URLS: Record<string, string> = {
  KS: 'https://calendly.com/d/cw5t-mm8-zrc/ks-english-virtual-consult',
  MS: 'https://calendly.com/d/cs78-kp4-rct/ms-english-virtual-consult',
  NM: 'https://calendly.com/d/cs9h-6ps-dzp/nm-english-virtual-consult',
  RI: 'https://calendly.com/d/cw62-d8q-78v/ri-english-virtual-consult',
  WV: 'https://calendly.com/d/csj5-w66-tpb/wv-english-virtual-consult',
};

// Get Calendly URL based on selected state
const calendlyUrl = computed(() => {
  const consultationPreference = formStore.formData
    ?.consultationPreference as any;
  const selectedState = consultationPreference?.state;
  return selectedState ? CALENDLY_URLS[selectedState] || '' : '';
});

// Check if user needs to schedule a Calendly appointment
const shouldShowCalendly = computed(() => {
  const consultationPreference = formStore.formData
    ?.consultationPreference as any;

  if (!consultationPreference) return false;

  const selectedState = consultationPreference.state;
  const consultationType = consultationPreference.consultationType;
  const phoneVideoAllowedStates = ['NM', 'MS', 'KS', 'WV', 'RI'];

  // Show Calendly only if:
  // 1. State is in the allowed list
  // 2. User selected "Phone/Video consultation"
  return (
    selectedState &&
    phoneVideoAllowedStates.includes(selectedState) &&
    consultationType === 'Phone/Video consultation'
  );
});

onMounted(() => {
  if (!isPaymentCompleted.value) {
    router.push({ path: '/payment' });
    return;
  }
  const caseId = formStore.caseId;
  const email = userEmail.value;
  if (caseId) {
    trackConversion({
      email,
      conversionId: caseId,
    });
  } else {
    console.warn('GLP conversion not fired: missing caseId');
  }
});

// Check if user wants to submit feedback (has rating - feedback text is optional)
const shouldSubmitFeedback = computed(() => {
  return selectedRating.value >= 1 && selectedRating.value <= 5;
});

// Get original domain from config
const originalDomain = computed(() => {
  return config.public.originalDomain || '';
});

// Redirect if payment not completed (separate onMounted for clarity)
onMounted(() => {
  if (!isPaymentCompleted.value) {
    router.push({ path: '/payment' });
    return;
  }
});

// Handle star rating (toggle if same star is clicked)
const handleStarClick = (rating: number) => {
  if (selectedRating.value === rating) {
    selectedRating.value = 0; // Deselect if clicking the same star
  } else {
    selectedRating.value = rating;
  }
};

// Handle mobile success card continue
const handleMobileCardContinue = () => {
  showMobileSuccessCard.value = false;
};

// Handle form submission
const handleComplete = async () => {
  isSubmitting.value = true;
  submitError.value = '';

  try {
    const feedbackText = feedbackData.value?.feedback || '';
    const hasRating = selectedRating.value >= 1 && selectedRating.value <= 5;
    const hasFeedbackText = feedbackText.trim().length > 0;

    // Validation: If user has feedback text but no rating, ask for rating
    if (hasFeedbackText && !hasRating) {
      submitError.value = 'Please provide a rating to submit your feedback.';
      isSubmitting.value = false;
      return;
    }

    // Check if user wants to submit feedback (rating is provided)
    if (shouldSubmitFeedback.value) {
      // Submit feedback via API
      const response = await $fetch('/api/send-feedback', {
        method: 'POST',
        body: {
          email: userEmail.value,
          projectName: projectName.value,
          rating: selectedRating.value,
          feedback: feedbackText.trim(),
        },
      });

      // Check if submission was successful
      if (response && (response as any).ok) {
        // Reset form and redirect to originalDomain or home
        formStore.resetForm();
        if (originalDomain.value) {
          window.location.href = originalDomain.value;
        } else {
          router.push({ path: '/' });
        }
      } else {
        // Handle validation errors
        const errors = (response as any).errors;
        if (errors && Object.keys(errors).length > 0) {
          submitError.value = Object.values(errors).join(', ');
        } else {
          submitError.value =
            (response as any).message || 'Failed to submit feedback.';
        }
      }
    } else {
      // No feedback provided, just redirect to originalDomain
      formStore.resetForm();
      if (originalDomain.value) {
        window.location.href = originalDomain.value;
      } else {
        router.push({ path: '/' });
      }
    }
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    submitError.value =
      error?.data?.message || 'Failed to submit feedback. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <!-- Mobile Success Card (only loads on screens < 1280px) -->
    <Transition v-if="isMobileScreen" name="slide-left" mode="out-in">
      <div v-if="showMobileSuccessCard" key="mobile-card">
        <MobileSuccessDetailsWrapper @continue="handleMobileCardContinue" />
      </div>
      <div
        v-else
        key="success-form"
        class="space-y-6 flex flex-col items-center"
      >
        <div
          class="w-full rounded-2xl bg-primary-dark-1 p-4 border-2 border-primary-dark-5 shadow-md"
        >
          <!-- Main Heading -->
          <h1
            v-if="shouldShowCalendly && calendlyUrl"
            class="h5 font-bold text-gray-1 mb-4"
          >
            Hey {{ userName }}! Let’s chat about the next steps for your
            phone/video consultation.
          </h1>
          <h1 v-else class="h5 font-bold text-gray-1 mb-4">
            Hey {{ userName }}! Let’s chat about the next steps for your email
            and text consultation.
          </h1>

          <!-- Calendly Scheduling Section (Conditional) -->
          <div
            v-if="shouldShowCalendly && calendlyUrl"
            class="bg-primary-light-4 border-2 border-primary-light-3 rounded-xl p-4 mb-4 body2 !font-semibold"
          >
            <div class="flex items-center gap-2 mb-2">
              <NuxtImg
                src="/icons/calendly-link.svg"
                alt="Complete"
                width="20"
                height="20"
                class="w-5 h-5 icon-primary"
              />
              <h2 class="text-primary !font-bold">
                Schedule your consultation
              </h2>
            </div>
            <p class="body2 text-gray-2 mb-4">
              Based on your state selection, you're eligible for a phone/video
              consultation. Please schedule your appointment using the link
              below.
            </p>
            <a
              :href="calendlyUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary transition-all duration-200 subtitle1 font-semibold"
            >
              <span>Schedule consultation</span>
              <NuxtImg
                src="/icons/right-arrow.svg"
                alt="Schedule"
                width="20"
                height="20"
                class="w-5 h-5"
              />
            </a>
          </div>

          <!-- Great Choice Section -->
          <div
            v-else
            class="bg-primary-light-4 border-2 border-primary-light-3 rounded-xl p-4 mb-4 body2 !font-semibold"
          >
            <div class="flex items-center gap-2 mb-2">
              <NuxtImg
                src="/icons/chat.svg"
                alt="Complete"
                width="20"
                height="20"
                class="w-5 h-5 icon-primary"
              />
              <h2 class="text-primary !font-bold">Great choice!</h2>
            </div>
            <p class="!font-medium mb-3 text-gray-2">
              You'll receive email and text updates from your provider. No
              additional appointment needed - your provider will review your
              intake within 24 hours.
            </p>
          </div>

          <!-- Feedback Section -->
          <div class="mb-6">
            <h2 class="h6 !font-bold text-gray-1 mb-3">
              How was your experience, {{ userName }}?
            </h2>
            <p class="body2 text-gray-3 !font-medium mb-4">
              Your feedback helps us improve our service for everyone
            </p>

            <!-- Star Rating -->
            <div class="flex justify-center gap-3 mb-4">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="transition-all duration-200 hover:scale-110"
                @click="handleStarClick(star)"
              >
                <svg
                  class="w-10 h-10"
                  :class="
                    star <= selectedRating
                      ? 'fill-yellow-400 stroke-yellow-400'
                      : 'fill-none stroke-primary/30'
                  "
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
              </button>
            </div>

            <!-- Feedback Textarea -->
            <div>
              <label class="block body2 text-gray-2 !font-semibold mb-2">
                Tell us more (optional)
              </label>
              <TextArea
                v-model="feedbackData"
                field-name="feedback"
                placeholder="What did you like? What could we improve? Your thoughts help us serve you better..."
                :rows="4"
                :required="false"
                class="bg-white rounded-input"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="submitError"
            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p class="body2 text-red-600">{{ submitError }}</p>
          </div>
        </div>
        <!-- Complete Button -->
        <button
          type="button"
          :disabled="isSubmitting"
          class="w-full px-6 py-4 rounded-full bg-primary text-white hover:bg-secondary disabled:bg-gray-6 disabled:cursor-not-allowed transition-all duration-200 subtitle1 font-semibold flex items-center justify-center gap-2 mb-3 shadow-lg"
          @click="handleComplete"
        >
          <NuxtImg
            v-if="!isSubmitting"
            src="/icons/feedback.svg"
            alt="Complete"
            width="20"
            height="20"
            class="w-5 h-5 brightness-0 invert"
          />
          <span v-if="isSubmitting">{{
            shouldSubmitFeedback ? 'Submitting...' : 'Redirecting...'
          }}</span>
          <span v-else> Complete & Go to Home </span>
        </button>
      </div>
    </Transition>

    <!-- Desktop always shows success form (only on xl+ screens) -->
    <div v-if="!isMobileScreen" class="space-y-16">
      <div
        class="w-full rounded-2xl bg-primary-dark-1 p-8 border-2 border-primary-dark-5 shadow-md"
      >
        <!-- Main Heading -->
        <h1
          v-if="shouldShowCalendly && calendlyUrl"
          class="h5 font-bold text-gray-1 mb-4"
        >
          Hey {{ userName }}! Let’s chat about the next steps for your
          phone/video consultation.
        </h1>
        <h1 v-else class="h5 font-bold text-gray-1 mb-4">
          Hey {{ userName }}! Let’s chat about the next steps for your email and
          text consultation.
        </h1>

        <!-- Calendly Scheduling Section (Conditional) -->
        <div
          v-if="shouldShowCalendly && calendlyUrl"
          class="bg-primary-light-4 border-2 border-primary-light-3 rounded-xl p-4 mb-4 body2 !font-semibold"
        >
          <div class="flex items-center gap-2 mb-2">
            <NuxtImg
              src="/icons/calendly-link.svg"
              alt="Complete"
              width="20"
              height="20"
              class="w-5 h-5 icon-primary"
            />
            <h2 class="text-primary !font-bold">Schedule your consultation</h2>
          </div>
          <p class="body2 text-gray-2 mb-4">
            Based on your state selection, you're eligible for a phone/video
            consultation. Please schedule your appointment using the link below.
          </p>
          <a
            :href="calendlyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary transition-all duration-200 subtitle1 font-semibold"
          >
            <span>Schedule consultation</span>
            <NuxtImg
              src="/icons/right-arrow.svg"
              alt="Schedule"
              width="20"
              height="20"
              class="w-5 h-5"
            />
          </a>
        </div>

        <!-- Great Choice Section -->
        <div
          v-else
          class="bg-primary-light-4 border-2 border-primary-light-3 rounded-xl p-4 mb-4 body2 !font-semibold"
        >
          <div class="flex items-center gap-2 mb-2">
            <NuxtImg
              src="/icons/chat.svg"
              alt="Complete"
              width="20"
              height="20"
              class="w-5 h-5 icon-primary"
            />
            <h2 class="text-primary !font-bold">Great choice!</h2>
          </div>
          <p class="!font-medium text-gray-2">
            You'll receive email and text updates from your provider. No
            additional appointment needed - your provider will review your
            intake soon.
          </p>
        </div>

        <!-- Feedback Section -->
        <div class="mb-6">
          <h2 class="h6 !font-bold text-gray-1 mb-3">
            How was your experience, {{ userName }}?
          </h2>
          <p class="body2 text-gray-3 !font-medium mb-4">
            Your feedback helps us improve our service for everyone
          </p>

          <!-- Star Rating -->
          <div class="flex justify-center gap-3 mb-4">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="transition-all duration-200 hover:scale-110"
              @click="handleStarClick(star)"
            >
              <svg
                class="w-10 h-10"
                :class="
                  star <= selectedRating
                    ? 'fill-yellow-400 stroke-yellow-400'
                    : 'fill-none stroke-primary/30'
                "
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                />
              </svg>
            </button>
          </div>

          <!-- Feedback Textarea -->
          <div>
            <label class="block body2 text-gray-2 !font-semibold mb-2">
              Tell us more (optional)
            </label>
            <TextArea
              v-model="feedbackData"
              field-name="feedback"
              placeholder="What did you like? What could we improve? Your thoughts help us serve you better..."
              :rows="4"
              :required="false"
              class="bg-white rounded-input"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="submitError"
          class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="body2 text-red-600">{{ submitError }}</p>
        </div>
      </div>
      <!-- Complete Button -->
      <button
        type="button"
        :disabled="isSubmitting"
        class="w-full px-6 py-4 rounded-full bg-primary text-white hover:bg-secondary disabled:bg-gray-6 disabled:cursor-not-allowed transition-all duration-200 subtitle1 font-semibold flex items-center justify-center gap-2 mb-3 shadow-lg"
        @click="handleComplete"
      >
        <NuxtImg
          v-if="!isSubmitting"
          src="/icons/feedback.svg"
          alt="Complete"
          width="20"
          height="20"
          class="w-5 h-5 brightness-0 invert"
        />
        <span v-if="isSubmitting">{{
          shouldSubmitFeedback ? 'Submitting...' : 'Redirecting...'
        }}</span>
        <span v-else>Complete & Go to Home</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Slide Left - When moving to success form */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.5s ease-in-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Custom scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

textarea::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
