<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useFormStore } from '~/stores/intakeFormStore';

const formStore = useFormStore();

const emit = defineEmits<{
  continue: [];
}>();

// Progress bar animation
const progress = ref(0);
const TOTAL_DURATION = 15000; // 15 seconds in milliseconds
const INTERVAL = 50; // Update every 50ms for smooth animation
let progressInterval: number | null = null;

const startProgressBar = () => {
  const increment = (INTERVAL / TOTAL_DURATION) * 100;

  progressInterval = window.setInterval(() => {
    progress.value += increment;

    if (progress.value >= 100) {
      progress.value = 100;
      stopProgressBar();
      // Auto-trigger skip after 15 seconds
      handleContinue();
    }
  }, INTERVAL);
};

const stopProgressBar = () => {
  if (progressInterval !== null) {
    window.clearInterval(progressInterval);
    progressInterval = null;
  }
};

// Get user's first name
const userName = computed(() => {
  const userDetails = formStore.formData?.userDetails as any;
  const basicInfo = formStore.formData?.basicInfo as any;
  return userDetails?.firstName || basicInfo?.firstName || 'John';
});

// Get case ID
const caseId = computed(() => formStore.caseId || 'N/A');

const handleContinue = () => {
  stopProgressBar();
  emit('continue');
};

// Start progress bar on mount
onMounted(() => {
  startProgressBar();
});

// Cleanup on unmount
onUnmounted(() => {
  stopProgressBar();
});
</script>

<template>
  <div class="xl:hidden h-[calc(100vh-120px)]">
    <!-- Mobile Success Card -->
    <div
      class="relative bg-primary rounded-3xl p-6 overflow-hidden h-full flex flex-col"
    >
      <!-- Gradient overlay - primary to secondary from bottom-left to top-right -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-secondary/90 to-primary/90"
      ></div>

      <!-- Background decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full opacity-5"
        ></div>
        <div
          class="absolute bottom-0 -left-20 w-80 h-80 bg-white rounded-full opacity-5"
        ></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full">
        <!-- Scrollable content area -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden pb-4">
          <div class="flex flex-col gap-5">
            <!-- Header with buttons -->
            <div class="flex items-center justify-between gap-3">
              <div
                class="inline-flex items-center bg-white/20 border border-white/30 rounded-full px-4 py-2"
              >
                <span
                  class="body2 text-white !font-semibold text-wrap whitespace-normal"
                  >{{ userName }}'s Plan</span
                >
              </div>
              <button
                class="inline-flex border border-gray-border-dark items-center bg-white rounded-full px-6 py-3 hover:bg-gray-50 transition-all duration-200"
                @click="handleContinue"
              >
                <span class="body1 text-gray-2 !font-semibold">Skip</span>
              </button>
            </div>

            <!-- Heading -->
            <h1 class="text-white font-domine h2 !font-bold leading-tight">
              Great job on your progress!
            </h1>

            <!-- Payment Completed Card -->
            <div class="bg-white rounded-2xl p-5 space-y-4">
              <div class="flex flex-col items-start gap-3">
                <div
                  class="w-13 h-13 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                >
                  <NuxtImg
                    src="/icons/payment-success.svg"
                    alt="Success"
                    class="w-13 h-13"
                  />
                </div>
                <h3 class="h2 !font-bold text-primary">Payment Completed</h3>
              </div>

              <div class="space-y-4">
                <p class="h5 text-primary !font-bold">
                  Your case has been received
                </p>
                <p class="caption text-gray-11 !font-medium">
                  Case ID: {{ caseId }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar - Sticky at bottom -->
        <div class="sticky bottom-0 py-4">
          <div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              class="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
