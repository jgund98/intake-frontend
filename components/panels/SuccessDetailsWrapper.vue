<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '~/stores/intakeFormStore';

const formStore = useFormStore();

// Get product data from store
const productData = computed(() => {
  return formStore.formData?.productSelection as any;
});

// Get case ID
const caseId = computed(() => formStore.caseId || 'N/A');

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
</script>

<template>
  <!-- Content for Desktop (shown in MarketingWrapper slot) -->
  <div class="p-10 pt-32 space-y-6 flex-1 h-full flex flex-col justify-end">
    <!-- Heading -->
    <h1 class="text-white font-domine h1 !font-bold">
      Great job on your progress!
    </h1>

    <!-- Product Card -->
    <div class="bg-white border-2 border-primary/30 rounded-2xl p-5 space-y-3">
      <div class="flex items-center gap-4">
        <div class="w-16 h-[77px] flex-shrink-0">
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
            A provider will review your information to determine if treatment is
            right for you. Prescription is not guaranteed.
          </p>
        </div>
      </div>
    </div>

    <!-- Order Summary Card -->
    <div
      class="bg-primary-light-5 border-2 border-primary/30 rounded-2xl p-6 space-y-4"
    >
      <h3 class="body !font-semibold text-gray-1">Order Summary</h3>

      <!-- Summary Items -->
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="body2 text-gray-2">Price</span>
          <span class="body2 !font-semibold text-gray-1"
            >${{ pricePerMonth }}/mo</span
          >
        </div>

        <div class="flex justify-between items-center">
          <span class="body2 text-gray-2">Plan</span>
          <span class="body2 !font-semibold text-gray-1">{{ bundleName }}</span>
        </div>

        <div v-if="saveAmount > 0" class="flex justify-between items-center">
          <span class="body2 text-gray-2">Savings</span>
          <span class="body2 !font-semibold text-gray-1"
            >${{ saveAmount }}</span
          >
        </div>

        <div v-if="promoDiscount" class="flex justify-between items-center">
          <span class="body2 text-gray-2"
            >Promo ({{ formStore.formData?.promoCode || 'code' }})</span
          >
          <span class="body2 !font-semibold text-primary"
            >-${{ discountAmount.toFixed(2) }}</span
          >
        </div>

        <!-- Divider -->
        <div class="border-t border-primary/40"></div>

        <!-- Total -->
        <div class="flex justify-between items-center">
          <span class="h6 !font-semibold text-gray-1">Total</span>
          <span class="h3 !font-bold text-primary"
            >${{ promoDiscount ? finalPrice.toFixed(2) : totalPrice }}</span
          >
        </div>
      </div>
    </div>

    <!-- Payment Completed Card -->
    <div class="bg-white rounded-2xl p-6 space-y-4">
      <div class="flex items-center gap-3">
        <div
          class="w-13 h-13 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
        >
          <NuxtImg
            src="/icons/payment-success.svg"
            alt="Success"
            class="w-13 h-13"
          />
        </div>
        <h3 class="h2 !font-bold text-primary">Payment Completed</h3>
      </div>

      <div class="space-y-4">
        <p class="h5 !font-bold text-primary">Your case has been received</p>
        <p class="caption text-gray-4">Case ID: {{ caseId }}</p>
      </div>
    </div>
  </div>
</template>
