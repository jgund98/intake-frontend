<template>
  <NuxtImg
    :src="image"
    alt="Medication Graph"
    class="w-full h-full object-contain max-h-full backdrop-blur-lg"
  />
</template>

<script setup lang="ts">
interface Props {
  image?: string;
}

defineProps<Props>();
</script>
