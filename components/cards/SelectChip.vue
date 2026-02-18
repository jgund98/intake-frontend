<script setup lang="ts">
defineProps<{ label: string }>();
const emits = defineEmits(['remove']);
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-lg py-1.5 px-3 bg-primary text-background body2 font-medium max-w-full"
  >
    <span class="truncate max-w-[140px] sm:max-w-[180px] md:max-w-[220px]">{{
      label
    }}</span>
    <NuxtImg
      src="icons/close.svg"
      class="h-4 w-4 brightness-0 invert hover:cursor-pointer shrink-0"
      alt="Remove"
      @click.stop="emits('remove')"
    />
  </div>
</template>
