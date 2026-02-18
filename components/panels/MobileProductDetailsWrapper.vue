<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useFormStore } from '~/stores/intakeFormStore';

const formStore = useFormStore();

const emit = defineEmits<{
  continue: [];
}>();

// Progress bar animation
const progress = ref(0);
const TOTAL_DURATION = 15000; // 15 seconds in milliseconds
const INTERVAL = 50; // Update every 50ms for smooth animation
let progressInterval: number | null = null;

const startProgressBar = () => {
  const increment = (INTERVAL / TOTAL_DURATION) * 100;

  progressInterval = window.setInterval(() => {
    progress.value += increment;

    if (progress.value >= 100) {
      progress.value = 100;
      stopProgressBar();
      // Auto-trigger skip after 15 seconds
      handleContinue();
    }
  }, INTERVAL);
};

const stopProgressBar = () => {
  if (progressInterval !== null) {
    window.clearInterval(progressInterval);
    progressInterval = null;
  }
};

// Get product data from store
const productData = computed(() => {
  return formStore.formData?.productSelection as any;
});

// Get user's first name
const userName = computed(() => {
  const userDetails = formStore.formData?.userDetails as any;
  const basicInfo = formStore.formData?.basicInfo as any;
  return userDetails?.firstName || basicInfo?.firstName || 'John';
});

// Product details
const productName = computed(() => {
  return (
    productData.value?.productGroupName ||
    productData.value?.product?.name ||
    'Product'
  );
});

const productImage = computed(() => {
  return productData.value?.product?.imageUrl || '/images/product-default.png';
});

// Pricing details with initialDiscount applied (calculated from product.price to avoid double-discount)
const totalPrice = computed(() => {
  const product = productData.value?.product;
  if (!product?.price) return productData.value?.totalPrice || 0;

  const productPrice = product.price || 0;
  const initialDiscount = product.initialDiscount || 0;
  return initialDiscount > 0 ? productPrice - initialDiscount : productPrice;
});

const pricePerMonth = computed(() => {
  const product = productData.value?.product;
  if (!product?.price) return productData.value?.pricePerMonth || 0;

  const duration = productData.value?.duration || 'month-to-month';

  // Calculate duration months
  let durationMonths = 1;
  if (duration.includes('12')) durationMonths = 12;
  else if (duration.includes('6')) durationMonths = 6;
  else if (duration.includes('3')) durationMonths = 3;

  const productPrice = product.price || 0;
  const initialDiscount = product.initialDiscount || 0;
  const effectiveTotal = initialDiscount > 0 ? productPrice - initialDiscount : productPrice;
  return Math.round(effectiveTotal / durationMonths);
});
const bundleName = computed(
  () => productData.value?.bundleName || 'Month-to-Month'
);
const saveAmount = computed(() => productData.value?.saveAmount || 0);

// Promo code discount
const promoDiscount = computed(() => formStore.promoDiscount);

// Calculate discount amount
const discountAmount = computed(() => {
  if (!promoDiscount.value) return 0;

  if (promoDiscount.value.flatDiscount !== undefined) {
    return promoDiscount.value.flatDiscount;
  }

  if (promoDiscount.value.percentDiscount !== undefined) {
    return (totalPrice.value * promoDiscount.value.percentDiscount) / 100;
  }

  return 0;
});

// Final price after discount
const finalPrice = computed(() => {
  return Math.max(0, totalPrice.value - discountAmount.value);
});

const handleContinue = () => {
  stopProgressBar();
  emit('continue');
};

// Start progress bar on mount
onMounted(() => {
  startProgressBar();
});

// Cleanup on unmount
onUnmounted(() => {
  stopProgressBar();
});
</script>

<template>
  <div class="xl:hidden h-[calc(100vh-120px)]">
    <!-- Mobile Product Details Card -->
    <div
      class="relative bg-primary rounded-3xl p-6 overflow-hidden h-full flex flex-col"
    >
      <!-- Gradient overlay - primary to secondary from bottom-left to top-right -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-secondary/90 to-primary/90"
      ></div>

      <!-- Background decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full opacity-5"
        ></div>
        <div
          class="absolute bottom-0 -left-20 w-80 h-80 bg-white rounded-full opacity-5"
        ></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col h-full">
        <!-- Scrollable content area -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden pb-4">
          <div class="flex flex-col gap-5">
            <!-- Header with buttons -->
            <div class="flex items-center justify-between gap-3">
              <div
                class="inline-flex items-center bg-white/20 border border-white/30 rounded-full px-4 py-2"
              >
                <span
                  class="body2 text-white !font-semibold text-wrap whitespace-normal"
                  >{{ userName }}'s Plan</span
                >
              </div>
              <button
                class="inline-flex border border-gray-border-dark items-center bg-white rounded-full px-6 py-3 hover:bg-gray-50 transition-all duration-200"
                @click="handleContinue"
              >
                <span class="body1 text-gray-2 !font-semibold">Skip</span>
              </button>
            </div>

            <!-- Heading -->
            <h1 class="text-white font-domine h2 !font-bold leading-tight">
              Great job on your progress!
            </h1>

            <!-- Product Card -->
            <div
              class="bg-white border-2 border-primary/30 rounded-2xl p-4 space-y-3"
            >
              <div class="flex items-start gap-3">
                <div class="w-[66px] h-[100px] flex-shrink-0">
                  <NuxtImg
                    :src="productImage"
                    :alt="productName"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="flex-1">
                  <h2 class="h5 !font-bold text-primary mb-2">
                    {{ productName }}
                  </h2>
                  <p class="caption text-gray-11 !font-medium leading-3">
                    A provider will review your information to determine if
                    treatment is right for you. Prescription is not guaranteed.
                  </p>
                </div>
              </div>
            </div>

            <!-- Order Summary Card -->
            <div
              class="bg-primary-light-5 border-2 border-primary/30 rounded-2xl p-6 space-y-3"
            >
              <h3 class="body1 !font-semibold text-gray-1">Order Summary</h3>

              <!-- Summary Items -->
              <div class="space-y-2.5">
                <div class="flex justify-between items-center">
                  <span class="body2 text-gray-2 !font-regular">Price</span>
                  <span class="body1 !font-semibold text-gray-1"
                    >${{ pricePerMonth }}/mo</span
                  >
                </div>

                <div class="flex justify-between items-center">
                  <span class="body2 text-gray-2 !font-regular">Plan</span>
                  <span class="body1 !font-semibold text-gray-1">{{
                    bundleName
                  }}</span>
                </div>

                <div
                  v-if="saveAmount > 0"
                  class="flex justify-between items-center"
                >
                  <span class="body2 text-gray-2 !font-regular">Savings</span>
                  <span class="body1 !font-semibold text-gray-1"
                    >${{ saveAmount }}</span
                  >
                </div>

                <div
                  v-if="promoDiscount"
                  class="flex justify-between items-center"
                >
                  <span class="body2 text-gray-2 !font-regular"
                    >Promo ({{ formStore.formData?.promoCode || 'code' }})</span
                  >
                  <span class="body1 !font-semibold text-primary"
                    >-${{ discountAmount.toFixed(2) }}</span
                  >
                </div>

                <!-- Divider -->
                <div class="border-t border-gray-border-light"></div>

                <!-- Total -->
                <div class="flex justify-between items-center">
                  <span class="body1 font-semibold text-gray-1">Total</span>
                  <span class="text-2xl font-bold text-primary"
                    >${{
                      promoDiscount ? finalPrice.toFixed(2) : totalPrice
                    }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar - Sticky at bottom -->
        <div class="sticky bottom-0 py-4">
          <div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              class="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
