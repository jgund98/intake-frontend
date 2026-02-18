<script setup lang="ts">
import {
  ref,
  computed,
  defineAsyncComponent,
  watch,
  onMounted,
  onUnmounted,
} from 'vue';
import { marketingConfig } from '~/data/forms/index';
import { useRuntimeConfig } from '#imports';

// Store
import { useOrganizationStore } from '~/stores/organizationStore';

// Form configuration
import { getCurrentFormConfig } from '~/data/forms/index';

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

// Define props
const props = withDefaults(
  defineProps<{
    mode?: 'slides' | 'static';
  }>(),
  {
    mode: 'slides',
  }
);

const {
  public: { projectLogoUrl, projectName, originalDomain },
} = useRuntimeConfig();

const orgStore = useOrganizationStore();

// Reactive form config - uses category from organizationStore
const config = computed(() => {
  const category = orgStore.category;
  return getCurrentFormConfig(category || undefined);
});

const steps = computed(() => config.value.steps);

const slides = computed(() => {
  const ids = steps.value
    .filter(
      (step: any) => step.marketingId !== null && step.marketingId !== undefined
    )
    .map((step: any) => step.marketingId);
  return marketingConfig.marketingSlides.filter(slide =>
    ids.includes(slide.id)
  );
});
const totalSlides = computed(() => slides.value.length);

// Local slide index (0-based). We manage navigation here instead of using the store.
const slideIndex = ref(0);
const slideDirection = ref<'left' | 'right'>('right');
const animationKey = ref(0);

// Current slide data (safe fallback)
const currentSlideData = computed((): MarketingSlide => {
  const data = slides.value[slideIndex.value];
  return (
    data ?? {
      id: 1,
      badgeText: '',
      heading: '',
      statLabel: '',
      statDescription: '',
      component: 'index',
    }
  );
});

// Watch slide index to determine animation direction
// When slideIndex changes we bump animationKey to trigger Transition re-render.
// Direction is set explicitly in handlers to correctly handle wrapping.
watch(slideIndex, () => {
  animationKey.value++;
});

// Dynamically import components based on component name
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

const currentComponent = computed(() =>
  getComponent(currentSlideData.value.component)
);

// Dynamic background image based on current marketing slide
const backgroundImageUrl = computed(() => {
  return (
    currentSlideData.value.props?.backgroundImage ||
    `/images/marketing-background-${slideIndex.value + 1}.jpg`
  );
});

// Navigation handlers — no disabled checks, simple prev/next to render marketing slides
const handlePrevSlide = () => {
  // If at first slide, wrap to last; otherwise decrement.
  if (slideIndex.value === 0) {
    slideDirection.value = 'left';
    slideIndex.value = totalSlides.value - 1;
  } else {
    slideDirection.value = 'left';
    slideIndex.value -= 1;
  }
  resetAutoSlideTimer(); // Reset timer on manual interaction
};

const handleNextSlide = (resetTimer = true) => {
  // If at last slide, wrap to first; otherwise increment.
  if (slideIndex.value >= totalSlides.value - 1) {
    slideDirection.value = 'right';
    slideIndex.value = 0;
  } else {
    slideDirection.value = 'right';
    slideIndex.value += 1;
  }
  if (resetTimer) {
    resetAutoSlideTimer(); // Reset timer on manual interaction
  }
};

const handleDotClick = (index: number) => {
  const idx = index - 1; // v-for index is 1-based in template
  if (idx >= 0 && idx < totalSlides.value) {
    // Direction: moving forward -> 'right', backward -> 'left'
    slideDirection.value = idx > slideIndex.value ? 'right' : 'left';
    slideIndex.value = idx;
    resetAutoSlideTimer(); // Reset timer on manual interaction
  }
};

// Auto-slide logic: advance to next slide every 5 seconds
const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds
let autoSlideTimer: number | null = null;
const isInteracting = ref(false); // Track if user is hovering or focusing on content

const startAutoSlide = () => {
  autoSlideTimer = window.setInterval(() => {
    // Only advance if user is not interacting
    if (!isInteracting.value) {
      handleNextSlide(false); // Don't reset timer on auto-slide
    }
  }, AUTO_SLIDE_INTERVAL);
};

const stopAutoSlide = () => {
  if (autoSlideTimer !== null) {
    window.clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  }
};

const resetAutoSlideTimer = () => {
  stopAutoSlide();
  startAutoSlide();
};

// Handlers for pausing auto-slide on hover/focus
const handleMouseEnter = () => {
  isInteracting.value = true;
};

const handleMouseLeave = () => {
  isInteracting.value = false;
};

const handleFocusIn = () => {
  isInteracting.value = true;
};

const handleFocusOut = () => {
  isInteracting.value = false;
};

onMounted(() => {
  if (props.mode === 'slides') {
    startAutoSlide();
  }
});

onUnmounted(() => {
  if (props.mode === 'slides') {
    stopAutoSlide();
  }
});
</script>

<template>
  <aside
    class="hidden xl:flex xl:w-[32%] flex-col relative overflow-hidden overflow-x-hidden h-screen"
  >
    <Transition name="fade" mode="out-in">
      <div
        :key="backgroundImageUrl"
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      ></div>
    </Transition>

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

    <!-- Sidebar content -->
    <div class="relative z-10 h-full w-full overflow-x-hidden">
      <!-- Logo - Absolute at top -->
      <div class="absolute top-10 left-10 z-20">
        <NuxtLink
          :to="originalDomain"
          external
          class="inline-flex items-center bg-white rounded-full px-6 py-3"
        >
          <NuxtImg
            :src="projectLogoUrl"
            :alt="projectName + ' Logo'"
            class="h-6 w-auto"
            loading="eager"
          />
        </NuxtLink>
      </div>

      <!-- Marketing content - Full height with sticky footer -->
      <div class="h-full flex flex-col">
        <!-- Content area - Scrollable container -->
        <div
          class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 justify-center"
        >
          <!-- Slides Mode -->
          <div
            v-if="mode === 'slides'"
            class="flex flex-col px-10 pt-30 pb-24 min-h-0"
          >
            <!-- Animated content wrapper -->
            <Transition
              :name="slideDirection === 'right' ? 'slide-left' : 'slide-right'"
              mode="out-in"
            >
              <div :key="animationKey" class="flex flex-col gap-4">
                <!-- Badge -->
                <div class="inline-block flex-shrink-0">
                  <span
                    class="flex justify-center items-center text-white bg-white/20 border border-white/30 rounded-full body2 !font-semibold py-2 px-4 w-max"
                  >
                    {{ currentSlideData.badgeText }}
                  </span>
                </div>

                <!-- Heading -->
                <h1
                  class="text-white font-domine h2 font-bold leading-tight tracking-[0.33px] flex-shrink-0"
                >
                  {{ currentSlideData.heading }}
                </h1>

                <!-- Dynamic component -->
                <div
                  class="flex-shrink-0"
                  @mouseenter="handleMouseEnter"
                  @mouseleave="handleMouseLeave"
                  @focusin="handleFocusIn"
                  @focusout="handleFocusOut"
                >
                  <component
                    :is="currentComponent"
                    v-bind="currentSlideData.props"
                  />
                </div>

                <!-- Statistics -->
                <div class="flex-shrink-0 space-y-2">
                  <h2 class="h2 font-bold text-white">
                    {{ currentSlideData.statLabel }}
                  </h2>
                  <p class="text-white/80 body2 !font-medium mt-1">
                    {{ currentSlideData.statDescription }}
                  </p>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Static Mode with Slot -->
          <div
            v-else
            class="flex-1 flex flex-col justify-center overflow-hidden"
          >
            <slot />
          </div>
        </div>

        <!-- Navigation dots with arrows - Sticky at bottom (Only for slides mode) -->
        <div
          v-if="mode === 'slides'"
          class="sticky bottom-0 flex items-center justify-between px-12 py-4 bg-transparent"
        >
          <!-- Dots -->
          <div class="flex items-center gap-2">
            <div
              v-for="index in totalSlides"
              :key="index"
              class="h-1 rounded-full transition-all"
              :class="[
                index === slideIndex + 1 ? 'w-8 bg-white' : 'w-6 bg-white/30',
                'cursor-pointer hover:bg-white/50',
              ]"
              @click="handleDotClick(index)"
            ></div>
          </div>

          <!-- Navigation arrows -->
          <div class="flex items-center gap-2">
            <!-- Previous button -->
            <button
              class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              @click="handlePrevSlide"
            >
              <NuxtImg
                src="/icons/chevron-left.svg"
                alt="Previous"
                class="h-5 w-5 brightness-0 invert"
              />
            </button>

            <!-- Next button -->
            <button
              class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              @click="() => handleNextSlide()"
            >
              <NuxtImg
                src="/icons/chevron-right.svg"
                alt="Next"
                class="h-5 w-5 brightness-0 invert"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Fade transition for background image */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Slide Left - When going to next (right direction) */
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

/* Slide Right - When going to previous (left direction) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.5s ease-in-out;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
