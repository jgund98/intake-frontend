<template>
  <div
    class="h-screen flex overflow-hidden"
    :class="isPaymentPage || isSuccessPage ? 'flex-col xl:flex-row' : ''"
  >
    <!-- Marketing Wrapper - Used for all pages with different modes -->
    <MarketingWrapper v-if="isPaymentPage" mode="static">
      <ProductDetailsWrapper />
    </MarketingWrapper>

    <MarketingWrapper v-else-if="isSuccessPage" mode="static">
      <SuccessDetailsWrapper />
    </MarketingWrapper>

    <MarketingWrapper v-else mode="slides" />

    <!-- Main Content Area -->
    <main
      class="flex-1 flex flex-col bg-white xl:bg-gray-10 h-screen overflow-hidden"
    >
      <!-- Header with steps (show on all pages) -->
      <Header />

      <!-- Main content - Scrollable -->
      <div
        ref="scrollContainer"
        class="flex-1 p-4 pt-2 xl:p-12 xl:pt-12 overflow-y-auto overflow-x-visible"
      >
        <div class="flex min-h-full lg:items-center justify-center">
          <div class="w-full overflow-x-visible">
            <slot />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '#app';
import MarketingWrapper from '~/components/panels/MarketingWrapper.vue';
import ProductDetailsWrapper from '~/components/panels/ProductDetailsWrapper.vue';
import SuccessDetailsWrapper from '~/components/panels/SuccessDetailsWrapper.vue';
import Header from '~/layouts/components/Header.vue';

const route = useRoute();
const orgStore = useOrganizationStore();
import { useRuntimeConfig } from '#imports';

const {
  public: { projectName },
} = useRuntimeConfig();

const scrollContainer = ref<HTMLElement | null>(null);

// Get productId from URL
const productId = computed(() => {
  return route.query.productId as string || '';
});

// Get category from URL or store
const category = computed(() => {
  return (route.query.category as string) || orgStore.category || '';
});

// Find product name from productBundles array
const productName = computed(() => {
  if (!productId.value || !orgStore.orgData?.productBundles) {
    return '';
  }
  
  const product = orgStore.orgData.productBundles.find(
    (bundle: any) => bundle.id === productId.value
  );
  
  return product?.name || '';
});

// Build page title
const pageTitle = computed(() => {  
  if (productName.value) {
    return `${projectName} | ${productName.value} Questionnaire`;
  } else if (category.value) {
    return `${projectName} | ${category.value} Questionnaire`;
  }
  
  return projectName;
});

// Set page title
useHead({
  title: pageTitle,
});

// Check if current page is payment page (but not success page)
const isPaymentPage = computed(() => {
  return route.path === '/payment' || route.path === '/payment/';
});

// Check if current page is success page
const isSuccessPage = computed(() => {
  return (
    route.path === '/payment/success' || route.path === '/payment/success/'
  );
});

// 🔁 Har route change pe inner scroll container ko top pe le jao
watch(
  () => route.fullPath,
  () => {
    if (import.meta.client && scrollContainer.value) {
      scrollContainer.value.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth', // ya 'smooth' agar animation chahiye
      });
    }
  },
  { flush: 'post' } // route render ke baad run hoga
);
</script>
