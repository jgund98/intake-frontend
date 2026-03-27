<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFormStore } from '~/stores/intakeFormStore';
import { useFormRenderer } from '~/composables/useFormRenderer';
import { useQuizTracking } from '~/composables/useQuizTracking';
import FormCardWrapper from '~/components/cards/FormCardWrapper.vue';
import HeroProductCard from '~/components/cards/HeroProductCard.vue';
import MobileMarketingWrapper from '~/components/panels/MobileMarketingWrapper.vue';

const router = useRouter();
const formStore = useFormStore();
const { trackQuizStart } = useQuizTracking();
const quizStarted = ref(false);

// Track quiz start on initial page load (only once)
onMounted(() => {
  if (!quizStarted.value && !formStore.isPaymentCompleted) {
    trackQuizStart();
    quizStarted.value = true;
  }
});

const {
  currentStepId,
  currentStepConfig,
  currentSubStepConfig,
  currentSubStepIndex,
  totalSubSteps,
  formData,
  canGoNext,
  canGoPrevious,
  shouldShowNavigation,
  shouldShowMarketing,
  shouldHideContinueButton,
  isFirstStepFirstSubStep,
  isLastStepLastSubStep,
  handleNext,
  handlePrevious,
  handleMarketingContinue,
  getCurrentComponent,
} = useFormRenderer();

// Redirect to success page if payment is already completed
onMounted(() => {
  if (formStore.isPaymentCompleted) {
    router.push('/payment/success');
  }
});
</script>

<template>
  <div class="relative max-w-2xl mx-auto">
    <!-- Marketing Wrapper with Transition (Mobile Only) -->
    <Transition name="marketing-slide" mode="out-in">
      <MobileMarketingWrapper
        v-if="shouldShowMarketing && currentStepConfig"
        :key="'marketing-' + currentStepConfig.stepId"
        :marketing-id="currentStepConfig.marketingId"
        @continue="handleMarketingContinue"
      />
    </Transition>

    <!-- Form Step (No Transition) -->
    <div
      v-if="currentSubStepConfig"
      :class="shouldShowMarketing ? 'hidden xl:block' : ''"
      class="mb-[16%] xl:mb-[8%]"
    >
      <!-- Hero Product Card - Only on first step's first substep -->
      <HeroProductCard v-if="isFirstStepFirstSubStep" />

      <FormCardWrapper
        :id="'step-' + currentStepId + '-question-' + (currentSubStepIndex + 1)"
        :total-sub-steps="totalSubSteps"
        :current-sub-step="currentSubStepIndex + 1"
        :heading="currentSubStepConfig.heading"
        :caption="currentSubStepConfig.caption"
        :question="currentSubStepConfig.question"
        :note="currentSubStepConfig.note"
        :prepended-icon="currentSubStepConfig.headingPrependIcon"
      >
        <!-- Dynamic Component -->
        <component
          :is="getCurrentComponent"
          :key="currentSubStepConfig.fieldName"
          v-model="formData"
          :field-name="currentSubStepConfig.fieldName"
          :required="currentSubStepConfig.required"
          v-bind="currentSubStepConfig.props"
          @handleSelect="() => handleNext()"
        />
      </FormCardWrapper>

      <!-- Navigation Buttons - Sticky Bottom -->
      <div
        v-if="shouldShowNavigation"
        class="fixed bottom-0 xl:bottom-8 left-0 right-0 xl:left-auto xl:right-auto xl:max-w-2xl xl:mx-auto px-4 py-3 xl:px-0 xl:py-0 flex items-center gap-3 xl:gap-4 z-30 w-full"
      >
        <!-- Back Button -->
        <button
          v-if="canGoPrevious"
          class="group w-12 h-12 md:px-6 md:py-3 md:w-auto xl:h-auto rounded-full bg-white flex items-center justify-center border-2 border-gray-border-dark hover:border-primary hover:text-primary transition-all duration-200 flex-shrink-0 md:gap-2 md:subtitle1 md:font-medium text-gray-1 cursor-pointer"
          @click="handlePrevious"
        >
          <NuxtImg
            src="/icons/chevron-left.svg"
            alt="Go back"
            width="24"
            height="24"
            class="w-6 h-6 xl:w-5 xl:h-5 transition-all duration-200 group-hover:icon-primary"
          />
          <span class="hidden xl:inline">Go back</span>
        </button>

        <!-- Continue Button -->
        <button
          v-if="!shouldHideContinueButton"
          :id="
            isFirstStepFirstSubStep
              ? 'begin-quiz'
              : isLastStepLastSubStep
                ? 'finish-quiz'
                : undefined
          "
          :disabled="!canGoNext"
          class="flex-1 min-w-0 w-0 px-6 py-3 rounded-full transition-all duration-300 subtitle1 font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer /* 1. DISABLED: Subtle Mint Tint (Lightest) */ disabled:cursor-not-allowed disabled:bg-primary-light-4 disabled:text-primary-dark-7 disabled:shadow-none /* 2. ENABLED (Idle): Mid Green (Secondary) */ not-disabled:bg-secondary not-disabled:text-white /* 3. HOVER: Darkest Green (Primary) */ hover:not-disabled:bg-primary"
          @click="handleNext"
        >
          <span>Continue</span>
          <NuxtImg
            src="/icons/chevron-right.svg"
            alt="Continue"
            width="20"
            height="20"
            :class="canGoNext ? 'brightness-0 invert' : 'opacity-40'"
            class="w-5 h-5 transition-all duration-200"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Marketing Slide Out Animation */
.marketing-slide-enter-active,
.marketing-slide-leave-active {
  transition: all 0.5s ease-in-out;
}

.marketing-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.marketing-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.marketing-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.marketing-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
