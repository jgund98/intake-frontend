<script setup lang="ts">
// Props
interface Props {
  rating?: number;
  heading?: string;
  caption?: string;
  productImage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rating: 4.5,
  heading: 'Transform Your Health Journey with Sana Vida',
  caption: 'Join a joyful community of patients with great savings!',
  productImage: '/images/default-product.png',
});

// Calculate full and half stars
const fullStars = Math.floor(props.rating);
const hasHalfStar = props.rating % 1 >= 0.5;
const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
</script>

<template>
  <div
    class="w-full max-w-2xl mx-auto rounded-2xl shadow-md border border-border-base p-8 mb-4 hero-card-gradient overflow-visible relative"
  >
    <div class="flex items-center gap-4">
      <!-- Content Section -->
      <div class="flex-1 min-w-0 pr-32 sm:pr-36 md:pr-40 lg:pr-44 relative z-10">
        <!-- Rating -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-white text-xl md:text-2xl font-bold">
            {{ rating }}/5
          </span>
          <div class="flex items-center gap-0.5">
            <!-- Full stars -->
            <svg
              v-for="i in fullStars"
              :key="'full-' + i"
              class="w-4 h-4 md:w-5 md:h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
            <!-- Half star -->
            <svg
              v-if="hasHalfStar"
              class="w-4 h-4 md:w-5 md:h-5 text-yellow-400"
              viewBox="0 0 20 20"
            >
              <defs>
                <linearGradient id="halfGradient">
                  <stop offset="50%" stop-color="currentColor" />
                  <stop offset="50%" stop-color="#ffffff" />
                </linearGradient>
              </defs>
              <path
                fill="url(#halfGradient)"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
            <!-- Empty stars -->
            <svg
              v-for="i in emptyStars"
              :key="'empty-' + i"
              class="w-4 h-4 md:w-5 md:h-5 text-gray-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>
        </div>

        <!-- Average Rating Label -->
        <p class="text-white/80 text-xs md:text-sm mb-3">Average Rating</p>

        <!-- Heading -->
        <h3
          v-if="heading"
          class="text-white text-lg md:text-xl lg:text-2xl font-bold font-domine mb-1 leading-tight"
        >
          {{ heading }}
        </h3>

        <!-- Caption -->
        <p v-if="caption" class="text-white/90 text-sm md:text-base font-lora">
          {{ caption }}
        </p>
      </div>

      <!-- Product Image - Absolute positioned at right edge -->
      <div
        class="absolute right-0 bottom-0 overflow-hidden z-0 pointer-events-none"
      >
        <NuxtImg
          :src="productImage"
          alt="Product"
          class="w-auto h-48 sm:h-52 md:h-60 object-contain object-right-bottom drop-shadow-lg translate-y-4 sm:translate-y-6 -mr-4 sm:-mr-6 md:-mr-8"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-card-gradient {
  background: linear-gradient(
    180deg,
    var(--color-primary-light) 0%,   /* Sage Green at the top */
    var(--color-primary) 60%,        /* Transition to Forest Green */
    var(--color-primary-dark-8) 100% /* Deepest Green at the bottom */
  );
}
</style>
