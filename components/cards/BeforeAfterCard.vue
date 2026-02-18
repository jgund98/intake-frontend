<template>
  <div class="flex flex-col max-h-[346px] xl:h-[346px] max-xl:h-[258px]">
    <!-- Image slider container -->
    <div
      class="shrink-0 p-3 rounded-2xl border border-gray-300 bg-white w-max max-h-full"
    >
      <!-- Inner slider div -->
      <div
        class="relative max-h-[310px] xl:h-[320px] max-xl:h-[234px] aspect-[266/322.04] rounded-lg overflow-hidden select-none"
        :style="{
          '--slider-position': `${sliderPosition}%`,
        }"
      >
        <!-- After image (background - full width) -->
        <div
          class="absolute inset-0 select-none"
          :style="{
            clipPath: `inset(0 0 0 ${sliderPosition}%)`,
          }"
        >
          <NuxtImg
            :src="props.afterImage"
            :alt="props.afterAlt || 'After'"
            class="w-full h-full object-cover select-none pointer-events-none"
          />
          <!-- After badge - only show when after image is visible -->
          <div
            v-if="sliderPosition < 100"
            class="absolute right-2 bottom-2 flex px-4 py-0.5 justify-center items-center gap-2.5 rounded-lg border border-white/30 bg-white/20 backdrop-blur-lg z-10"
          >
            <span class="text-sm text-white">After</span>
          </div>
        </div>

        <!-- Before image (foreground - clipped based on slider position) -->
        <div
          class="absolute inset-0 select-none"
          :style="{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }"
        >
          <NuxtImg
            :src="props.beforeImage"
            :alt="props.beforeAlt || 'Before'"
            class="w-full h-full object-cover select-none pointer-events-none"
          />
          <!-- Before badge - only show when before image is visible -->
          <div
            v-if="sliderPosition > 0"
            class="absolute left-2 bottom-2 flex px-4 py-0.5 justify-center items-center gap-2.5 rounded-lg border border-white/30 bg-white/20 backdrop-blur-lg z-10"
          >
            <span class="text-sm text-white">Before</span>
          </div>
        </div>

        <!-- Slider divider -->
        <div
          class="absolute top-0 bottom-0 w-0.5 bg-white/50 cursor-ew-resize z-20 flex items-center justify-center touch-none"
          :style="{ left: `${sliderPosition}%` }"
          @mousedown="startDrag"
          @touchstart.prevent="startDrag"
        >
          <div
            class="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/40 hover:border-white/60 transition-colors aspect-square"
          >
            <NuxtImg
              src="/icons/arrows-horizontal.svg"
              alt="Drag to compare"
              class="w-4 h-4"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
  initialPosition?: number;
}

const props = withDefaults(defineProps<Props>(), {
  beforeAlt: 'Before',
  afterAlt: 'After',
  initialPosition: 50,
});

const sliderPosition = ref(props.initialPosition);
const isDragging = ref(false);

const startDrag = (event: MouseEvent | globalThis.TouchEvent) => {
  // Prevent default behavior and stop propagation to avoid scrolling
  event.preventDefault();
  event.stopPropagation();

  isDragging.value = true;

  // Get the slider container element
  const sliderContainer = (event.target as HTMLElement).closest('.relative');
  if (!sliderContainer) return;

  const handleMove = (e: MouseEvent | globalThis.TouchEvent) => {
    if (!isDragging.value || !sliderContainer) return;

    // Prevent scrolling while dragging
    e.preventDefault();
    e.stopPropagation();

    const clientX =
      'touches' in e && e.touches[0]
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;

    const rect = sliderContainer.getBoundingClientRect();
    const percentage = ((clientX - rect.left) / rect.width) * 100;
    sliderPosition.value = Math.max(0, Math.min(100, percentage));
  };

  const handleEnd = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
  };

  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleEnd);
};
</script>
