<template>
  <transition name="fade">
    <div
      v-if="ui.isLoading"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-900"
    >
      <div class="flex flex-col items-center space-y-4">
        <ClientOnly>
          <Vue3Lottie
            v-if="animationData"
            :animation-data="animationData"
            :height="200"
            :width="200"
          />
          <div
            v-else
            class="h-16 w-16 border-4 border-t-transparent border-[#4f826b] rounded-full animate-spin"
          />
        </ClientOnly>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Vue3Lottie } from 'vue3-lottie';
import { useUiStore } from '~/stores/uiStore';

const ui = useUiStore();
const animationData = ref(null);

// Convert hex color to normalized RGB (0-1 range)
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1,
      ]
    : [0, 0, 0, 1];
};

// Replace colors in Lottie animation
const replaceColors = (obj: any, primaryColor: number[]) => {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    if (key === 'c' && obj[key] && typeof obj[key] === 'object') {
      // Check if 'c' is an object with 'k' property (keyframe color)
      if (obj[key].k && Array.isArray(obj[key].k) && obj[key].k.length === 4) {
        obj[key].k = primaryColor;
      }
    } else if (
      key === 'c' &&
      Array.isArray(obj[key]) &&
      obj[key].length === 4
    ) {
      // Direct color array
      obj[key] = primaryColor;
    } else if (typeof obj[key] === 'object') {
      replaceColors(obj[key], primaryColor);
    }
  }
};

// Lazy load the animation data
onMounted(async () => {
  try {
    const data = await import('~/public/icons/Loading animation primary.json');
    const animData = JSON.parse(JSON.stringify(data.default || data));

    // Convert brand primary color to RGB
    const brandPrimary = hexToRgb('#4f826b');

    // Replace all colors with brand primary
    replaceColors(animData, brandPrimary);

    animationData.value = animData;
  } catch (error) {
    console.error('Failed to load animation:', error);
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
