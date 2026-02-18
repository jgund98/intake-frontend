<template>
  <div>
    <AppLoader />
    <Toast />

    <!-- Render GTM noscript only on client -->
    <ClientOnly>
      <noscript v-if="gtmNoscriptSrc">
        <iframe
          :src="gtmNoscriptSrc"
          height="0"
          width="0"
          style="display: none; visibility: hidden"
        ></iframe>
      </noscript>

      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Js Dependencies
import { computed } from 'vue';
import { useRuntimeConfig } from '#imports';

// Components
import AppLoader from './components/ui/AppLoader.vue';
import Toast from './components/ui/Toast.vue';

const {
  public: { gtmId },
} = useRuntimeConfig();

const gtmNoscriptSrc = computed(() =>
  gtmId ? `https://www.googletagmanager.com/ns.html?id=${gtmId}` : null
);
</script>
