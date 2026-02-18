<script setup lang="ts">
interface Props {
  icon?: string;
  text?: string;
  selected?: boolean;
}

withDefaults(defineProps<Props>(), {
  selected: false,
});
</script>

<template>
  <div
    class="px-4 pt-4 pb-3 rounded-2xl border-2 transition-all cursor-pointer h-full w-full flex flex-col group"
    :class="[
      selected
        ? 'bg-primary-light-5 border-primary'
        : 'bg-white hover:bg-primary-light-5 border-gray-7 hover:border-primary',
    ]"
  >
    <div class="flex flex-col items-center gap-2 w-full flex-1">
      <div
        class="w-16 h-16 rounded-full inline-flex justify-center items-center transition-colors"
        :class="selected ? 'bg-primary' : 'bg-gray-9 group-hover:bg-primary'"
      >
        <div class="w-8 h-8 relative flex items-center justify-center">
          <NuxtImg
            :src="icon"
            width="32"
            height="32"
            :alt="text"
            class="transition-all duration-200"
            :class="[
              selected
                ? 'brightness-0 invert'
                : 'brightness-100 opacity-70 group-hover:brightness-0 group-hover:invert',
            ]"
          />
        </div>
      </div>
      <div class="text-center px-2">
        <p
          class="subtitle2 font-medium transition-colors"
          :class="
            selected
              ? 'text-primary font-semibold'
              : 'text-gray-500 group-hover:text-primary'
          "
        >
          {{ text }}
        </p>
      </div>
    </div>
  </div>
</template>
