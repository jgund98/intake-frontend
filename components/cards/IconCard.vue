<script setup lang="ts">
// Js Dependecies
import { NuxtImg } from '#components';

defineProps<{
  icon: string;
  text: string;
  isSelected: boolean;
}>();
</script>
<template>
  <div
    class="flex gap-3 md:gap-5 items-center px-4 py-4.5 md:px-4.5 rounded-2xl border-2 cursor-pointer transition-all group"
    :class="[
      isSelected
        ? 'bg-primary-dark-2 border-primary text-primary'
        : 'bg-white hover:bg-primary-light-5 border-gray-7 hover:border-primary',
    ]"
    v-bind="$attrs"
  >
    <!-- Icon Container -->
    <div
      class="h-11 w-11 md:h-12 md:w-12 p-3 rounded-2xl flex items-center justify-center transition-all"
      :class="isSelected ? 'bg-primary' : 'bg-gray-9 group-hover:bg-primary'"
    >
      <!-- Nuxt Image (dynamic color via CSS filters) -->
      <NuxtImg
        :src="icon"
        alt="icon"
        width="24"
        height="24"
        class="transition-all duration-200"
        :class="[
          isSelected
            ? 'brightness-0 invert'
            : 'brightness-100 opacity-70 group-hover:brightness-0 group-hover:invert',
        ]"
      />
    </div>

    <!-- Text -->
    <div class="flex-1">
      <span
        class="subtitle1 font-medium transition-colors"
        :class="
          isSelected
            ? 'text-primary font-semibold'
            : 'text-gray-500 group-hover:text-primary'
        "
      >
        {{ text }}
      </span>
    </div>

    <!-- Radio Indicator -->
    <div class="relative w-5 h-5">
      <div
        v-if="isSelected"
        class="absolute inset-0 rounded-full bg-primary flex items-center justify-center"
      >
        <div class="w-2 h-2 rounded-full bg-white"></div>
      </div>
      <div
        v-else
        class="w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-primary"
      ></div>
    </div>
  </div>
</template>
