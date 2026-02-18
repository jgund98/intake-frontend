<template>
  <div
    class="flex flex-col items-start gap-3 p-4 rounded-[36px] border border-white bg-white/44 max-h-full"
  >
    <div
      class="relative rounded-3xl border border-white/52 w-full overflow-hidden aspect-video"
    >
      <NuxtImg
        :src="image"
        alt="Frame card image"
        class="w-full h-full object-cover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  image?: string;
}

defineProps<Props>();
</script>
