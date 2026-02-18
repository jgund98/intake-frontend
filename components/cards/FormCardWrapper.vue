<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useFormStore } from '~/stores/intakeFormStore';

// Props
interface Props {
  totalSubSteps?: number;
  currentSubStep?: number;
  heading?: string;
  caption?: string;
  question?: string;
  note?: string;
  prependedIcon?: string;
  appendedIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {} as Props);

// Get form store
const formStore = useFormStore();

// Parse heading into segments for safe rendering
const headingSegments = computed(() => {
  if (!props.heading) return [];

  const formData = formStore.getFormData as Record<string, any>;
  const basicInfo = formData?.basicInfo as Record<string, any> | undefined;
  const firstName = basicInfo?.firstName || '';

  // If no userName placeholder or no firstName, return as single segment
  if (!props.heading.includes('{userName}')) {
    return [{ text: props.heading, isUserName: false }];
  }

  if (!firstName) {
    return [{ text: props.heading, isUserName: false }];
  }

  // Split the heading by {userName} and create segments
  const parts = props.heading.split('{userName}');
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

// Animation state for slot transitions
const animationKey = ref(0);

watch(
  () => props.currentSubStep,
  () => {
    animationKey.value++;
  }
);

// Transition hooks for smooth height animation based on content
function onBeforeEnter(el: Element) {
  const element = el as HTMLElement;
  element.style.opacity = '0';
  element.style.height = '0';
}

function onEnter(el: Element, done: () => void) {
  const element = el as HTMLElement;

  // Use requestAnimationFrame to ensure DOM is fully painted before measuring
  requestAnimationFrame(() => {
    // Get the actual content height
    element.style.height = 'auto';
    element.style.opacity = '0';
    const height = element.offsetHeight;

    // Set to 0 and then animate to actual height
    element.style.height = '0';

    // Force reflow
    element.offsetHeight;

    // Use another RAF to ensure the '0' height is applied before animating
    requestAnimationFrame(() => {
      // Start animation
      element.style.height = height + 'px';
      element.style.opacity = '1';

      // Call done after transition completes
      setTimeout(done, 300);
    });
  });
}

function onAfterEnter(el: Element) {
  const element = el as HTMLElement;
  // Remove inline height to let content flow naturally
  element.style.height = '';
}

function onBeforeLeave(el: Element) {
  const element = el as HTMLElement;
  // Set current height before leave animation
  element.style.height = element.offsetHeight + 'px';
}

function onLeave(el: Element, done: () => void) {
  const element = el as HTMLElement;

  // Force reflow
  element.offsetHeight;

  // Animate to 0
  element.style.height = '0';
  element.style.opacity = '0';

  // Call done after transition completes
  setTimeout(done, 300);
}
</script>

<template>
  <div
    class="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md border border-border-base p-6 md:p-8"
  >
    <!-- Dots Indicator -->
    <div
      v-if="
        totalSubSteps &&
        totalSubSteps > 0 &&
        currentSubStep &&
        currentSubStep > 0
      "
      class="flex items-center gap-1 mb-3"
    >
      <div
        v-for="dot in totalSubSteps"
        :key="dot"
        :class="[
          'h-2 rounded-full transition-all duration-300',
          dot <= currentSubStep ? 'w-2 bg-primary' : 'w-2 bg-primary-dark-5',
        ]"
      ></div>
    </div>

    <!-- Header Section -->
    <div class="mb-4">
      <!-- Heading -->
      <div class="flex items-start">
        <!-- Left Icon -->
        <NuxtImg
          v-if="prependedIcon"
          :src="prependedIcon"
          alt="right icon"
          width="32"
          height="32"
          class="mr-3 shrink-0 hidden lg:block"
        />
        <div
          v-if="heading"
          class="h4 xl:h3 !font-domine font-bold text-gray-1 mb-3"
        >
          <template v-for="(segment, index) in headingSegments" :key="index">
            <span v-if="segment.isUserName" class="text-primary">{{
              segment.text
            }}</span>
            <span v-else>{{ segment.text }}</span>
          </template>
        </div>
        <!-- Right Icon -->
        <NuxtImg
          v-if="appendedIcon"
          :src="appendedIcon"
          alt="right icon"
          width="32"
          height="32"
          class="ml-3 shrink-0 hidden lg:block"
        />
      </div>

      <!-- Caption -->
      <p
        v-if="caption"
        class="body2 sm:subtitle2 text-gray-11 mb-6 font-medium tracking-tight"
      >
        {{ caption }}
      </p>

      <!-- Question -->
      <h3 v-if="question" class="h6 text-gray-2 font-medium tracking-tight">
        {{ question }}
      </h3>
    </div>

    <!-- Content Slot: only slot fades, rest of card is static -->
    <div class="relative">
      <Transition
        name="fade"
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @after-enter="onAfterEnter"
        @before-leave="onBeforeLeave"
        @leave="onLeave"
      >
        <div :key="animationKey" class="w-full">
          <slot />
        </div>
      </Transition>
    </div>

    <!-- Note -->
    <p v-if="note" class="body2 text-gray-11 font-medium italic mt-6 lg:mt-8">
      {{ note }}
    </p>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
</style>
