<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useFormStore } from '~/stores/intakeFormStore';
import { useUiStore } from '~/stores/uiStore';
import NmiPayment from '~/components/payment/NmiPayment.vue';
import MobileProductDetailsWrapper from '~/components/panels/MobileProductDetailsWrapper.vue';
import { preparePatientCaseData } from '~/utils/caseHelper';
import { useCaseCreation } from '~/composables/useCaseCreation';

const router = useRouter();
const formStore = useFormStore();
const uiStore = useUiStore();
const { createCase, error: caseError } = useCaseCreation();

// Screen size tracking
const isMobileScreen = ref(false);

// Mobile product details card visibility (only for screens < 1280px)
const showMobileProductCard = ref(true);

// Check screen size on mount and resize
const checkScreenSize = () => {
  isMobileScreen.value = window.innerWidth < 1280; // xl breakpoint is 1280px
};

onMounted(async () => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);

  // wait for DOM, then force scroll to top
  await nextTick();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize);
});

// Check if product is selected
const productSelection = computed(
  () => formStore.formData?.productSelection as any
);

// Redirect if no product selected OR payment already completed
onMounted(() => {
  if (!productSelection.value) {
    router.push({ path: '/products' });
    return;
  }

  // Redirect to success page if payment is already completed
  if (formStore.isPaymentCompleted) {
    router.push('/payment/success');
    return;
  }
});

// Get total price from selected product with initialDiscount applied (calculated from product.price to avoid double-discount)
const totalPrice = computed(() => {
  const product = productSelection.value?.product;
  if (!product?.price) return productSelection.value?.totalPrice || 0;

  const productPrice = product.price || 0;
  const initialDiscount = product.initialDiscount || 0;
  return initialDiscount > 0 ? productPrice - initialDiscount : productPrice;
});

// Payment state
const errorMessage = ref('');

// Payment Ready handler - receives token and form data from child
const handlePaymentReady = async (paymentData: any) => {
  // Loader is already started by NmiPayment component
  errorMessage.value = '';

  try {
    // Prepare complete payment data
    const completePaymentData = {
      ...paymentData,
      formData: formStore.formData,
    };

    // Prepare case creation payload
    const casePayload = await preparePatientCaseData(completePaymentData);

    // Call case creation API
    const response = await createCase(casePayload);

    if (!response) {
      // Error handling
      uiStore.stop();
      errorMessage.value = caseError.value || 'Failed to create case';
      return;
    }

    // Mark payment as successful in store
    formStore.setPaymentCompleted(true);

    // Store case ID
    if (response.caseId) {
      formStore.setCaseId(response.caseId);
    }

    // Redirect to success page (loader will stop on next page)
    router.push('/payment/success');
  } catch {
    uiStore.stop();
    errorMessage.value = 'Payment failed. Please try again.';
  }
};

// Error handler from child
const handlePaymentError = (message: string) => {
  errorMessage.value = message;
};

// Handle back navigation
const handleBack = () => {
  router.push({ path: '/products' });
};

// Handle mobile product card continue
const handleMobileCardContinue = async () => {
  showMobileProductCard.value = false;
  await nextTick();
};
</script>

<template>
  <div class="w-full max-w-4xl mx-auto">
    <!-- Mobile Product Details Card (only loads on screens < 1280px) -->
    <Transition v-if="isMobileScreen" name="slide-left" mode="out-in">
      <div v-if="showMobileProductCard" key="mobile-card">
        <MobileProductDetailsWrapper @continue="handleMobileCardContinue" />
      </div>
      <div v-else key="payment-form">
        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-red-600 body2">{{ errorMessage }}</p>
        </div>

        <!-- NMI Payment Component -->
        <NmiPayment
          :total-price="totalPrice"
          @payment-ready="handlePaymentReady"
          @error="handlePaymentError"
          @back="handleBack"
        />
      </div>
    </Transition>

    <!-- Desktop always shows payment form (only on xl+ screens) -->
    <div v-if="!isMobileScreen">
      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
      >
        <p class="text-red-600 body2">{{ errorMessage }}</p>
      </div>

      <!-- NMI Payment Component -->
      <NmiPayment
        :total-price="totalPrice"
        @payment-ready="handlePaymentReady"
        @error="handlePaymentError"
        @back="handleBack"
      />
    </div>
  </div>
</template>

<style scoped>
/* Slide Left - When moving to payment form */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.5s ease-in-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
