<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { marketingConfig } from '~/data/forms/index';
import { useFormStore } from '~/stores/intakeFormStore';
import { useOrganizationStore } from '~/stores/organizationStore';
import { storeToRefs } from 'pinia';

interface MarketingSlide {
  id: number;
  badgeText: string;
  heading: string;
  statLabel: string;
  statDescription: string;
  component: string;
  props?: {
    image?: string;
    backgroundImage?: string;
    beforeImage?: string;
    afterImage?: string;
    beforeAlt?: string;
    afterAlt?: string;
  };
}

const props = defineProps<{
  marketingId: number;
}>();

const emit = defineEmits<{
  continue: [];
}>();

const formStore = useFormStore();
const orgStore = useOrganizationStore();
const { currentStepId } = storeToRefs(formStore);

// Category name mapping for display
const categoryDisplayNames: Record<string, string> = {
  'weight loss': 'weight loss',
  'hair growth': 'hair growth',
  'skin care': 'skin care',
  "men's health": "men's health",
  wellness: 'wellness',
};

// Get marketing slide data based on marketingId
const marketingSlideData = computed((): MarketingSlide | null => {
  const slides = marketingConfig.marketingSlides as MarketingSlide[];
  return slides.find(slide => slide.id === props.marketingId) || null;
});

// Dynamically import marketing component
const getComponent = (componentName: string) => {
  // BeforeAfterCard is in cards directory
  if (componentName === 'BeforeAfterCard') {
    return defineAsyncComponent(
      () => import(`~/components/cards/${componentName}.vue`)
    );
  }
  // Other marketing components
  return defineAsyncComponent(
    () => import(`~/components/marketings/${componentName}.vue`)
  );
};

const currentComponent = computed(() => {
  if (!marketingSlideData.value) return null;
  return getComponent(marketingSlideData.value.component);
});

const handleContinue = () => {
  emit('continue');
};

// Button text based on current step and category
const buttonText = computed(() => {
  if (currentStepId.value === 1) {
    const category = orgStore.category || 'weight loss';
    // Normalize category and get display name
    const normalizedCategory = category.toLowerCase().trim();
    const displayName =
      categoryDisplayNames[normalizedCategory] || 'weight loss';
    return `Start my ${displayName} journey`;
  }
  return 'Continue';
});
</script>

<template>
  <div v-if="marketingSlideData" class="xl:hidden">
    <!-- Mobile Marketing Card -->
    <div
      class="relative bg-primary rounded-3xl p-6 pb-8 overflow-hidden min-h-[calc(100vh-120px)] flex flex-col"
    >
      <!-- Gradient overlay - primary to secondary from bottom-left to top-right -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-secondary/90 to-primary/90"
      ></div>
      <!-- Background decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <!-- Decorative circles -->
        <div
          class="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full opacity-5"
        ></div>
        <div
          class="absolute bottom-0 -left-20 w-80 h-80 bg-white rounded-full opacity-5"
        ></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col gap-4 flex-1">
        <!-- Badge -->
        <div class="inline-block">
          <span
            class="flex justify-start items-center text-white bg-white/20 border border-white/30 rounded-full body2 w-max !font-semibold py-2 px-4 text-wrap whitespace-normal"
          >
            {{ marketingSlideData.badgeText }}
          </span>
        </div>

        <!-- Heading -->
        <h1
          class="text-white font-domine h4 sm:h3 xl:h2 font-bold leading-tight"
        >
          {{ marketingSlideData.heading }}
        </h1>

        <!-- Dynamic Marketing Component -->
        <div
          class="flex items-center justify-start max-h-[258px] overflow-hidden"
        >
          <component
            :is="currentComponent"
            v-bind="marketingSlideData.props"
            class="w-full"
          />
        </div>

        <!-- Statistics -->
        <div>
          <h2 class="h4 xl:h3 font-bold text-white">
            {{ marketingSlideData.statLabel }}
          </h2>
          <p class="text-white/90 body2 !font-medium mt-1">
            {{ marketingSlideData.statDescription }}
          </p>
        </div>

        <!-- CTA Button -->
        <button
          class="w-full p-4 rounded-full bg-white text-gray-2 hover:bg-white/90 transition-all duration-200 subtitle1 !font-semibold flex items-center justify-between gap-2 shadow-lg mt-auto"
          @click="handleContinue"
        >
          <span>{{ buttonText }}</span>
          <NuxtImg
            src="/icons/chevron-right.svg"
            alt="Continue"
            width="20"
            height="20"
            class="w-5 h-5"
          />
        </button>
      </div>
    </div>
  </div>
</template>
