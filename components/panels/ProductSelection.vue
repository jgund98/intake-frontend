<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useOrganizationStore } from '~/stores/organizationStore';
import { useFormStore } from '~/stores/intakeFormStore';
import type { ProductBundle } from '~/models/apiResponse.model';
import ProductCard from '~/components/cards/ProductCard.vue';
import BundleCard from '~/components/cards/BundleCard.vue';
import BundleRetentionModal from '~/components/modals/BundleRetentionModal.vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  fieldName: string;
  required?: boolean;
}>();

const modelValue = defineModel<Record<string, any>>({ default: {} });

const orgStore = useOrganizationStore();
const formStore = useFormStore();
const router = useRouter();

// State
const selectedProductId = ref<string | null>(null);
const selectedBundleId = ref<string | null>(null);
const showBundles = ref(false);
const swiperRef = ref<any>(null);
const showRetentionModal = ref(false);
const pendingBundleSelection = ref<string | null>(null);

// Swiper navigation handlers
const slidePrev = () => {
  swiperRef.value?.swiper?.slidePrev();
};

const slideNext = () => {
  swiperRef.value?.swiper?.slideNext();
};
const overviews = [
  'Price includes consult, medication, supplies, shipping, and support',
  'Payment will not be processed until approval is made',
];

const breakpoints = {
  430: {
    slidesPerView: 1.2,
    spaceBetween: 16,
  },
  640: {
    slidesPerView: 2,
    spaceBetween: 20,
  },
  768: {
    slidesPerView: 3,
    spaceBetween: 20,
  },
};

// Watch parent modelValue and restore to local state
watch(
  () => modelValue.value[props.fieldName],
  newVal => {
    if (newVal && typeof newVal === 'object') {
      if (newVal.productGroupId) {
        selectedProductId.value = newVal.productGroupId;
        showBundles.value = true;
      }
      if (newVal.bundleId) {
        selectedBundleId.value = newVal.bundleId;
      }
    }
  },
  { immediate: true, deep: true }
);

// Get stored category from organization store
const selectedCategory = computed(() => orgStore.category);

// Get all products from organization store, filtered by category
const allProducts = computed(() => {
  const bundles = orgStore.orgData?.productBundles || [];
  const category = selectedCategory.value;

  console.log(category, 'Here see this');

  // If no category selected, return all products
  if (!category) return bundles;

  // Filter bundles where at least one product has matching category
  return bundles.filter(
    bundle => bundle?.tag?.toLowerCase() === category.toLowerCase()
  );
});

// Helper function to extract base product name (without duration info)
const getBaseProductName = (name: string): string => {
  return name
    .replace(/\s*(month-to-month|3-months?|6-months?|12-months?)\s*/gi, '')
    .trim();
};

// Group products by base name - for slider (unique product families only)
interface ProductGroup {
  id: string;
  baseName: string;
  displayProduct: ProductBundle; // Product to show in slider
  variants: ProductBundle[]; // All variants including durations
}

const productGroups = computed((): ProductGroup[] => {
  const groups: Map<string, ProductGroup> = new Map();

  allProducts.value.forEach(product => {
    const baseName = getBaseProductName(product.name);

    if (!groups.has(baseName)) {
      groups.set(baseName, {
        id: baseName, // Use base name as group ID
        baseName,
        displayProduct: product, // First product as display
        variants: [product],
      });
    } else {
      const group = groups.get(baseName)!;
      group.variants.push(product);

      // Prefer the base product (without duration) as display product
      if (product.name.toLowerCase() === baseName.toLowerCase()) {
        group.displayProduct = product;
      }
    }
  });

  return Array.from(groups.values());
});

// Get selected product group
const selectedProductGroup = computed(() => {
  if (!selectedProductId.value) return null;
  return (
    productGroups.value.find(g => g.id === selectedProductId.value) || null
  );
});

// Auto-select product from stored preselectedProductId
const autoSelectFromStore = () => {
  // Skip if already has a selection from modelValue
  if (modelValue.value[props.fieldName]?.productGroupId) return;
  if (productGroups.value.length === 0) return;

  // Get preselected product ID from organization store
  const preselectedId = orgStore.preselectedProductId;
  if (!preselectedId) return;

  // Find which product group contains this bundle ID
  for (const group of productGroups.value) {
    const matchingVariant = group.variants.find(v => v.id === preselectedId);

    if (matchingVariant) {
      // Select the product group first
      selectedProductId.value = group.id;
      showBundles.value = true;

      // Then select the specific bundle after a short delay
      setTimeout(() => {
        selectedBundleId.value = preselectedId;
        // Note: Don't clear preselectedProductId - keep it for URL navigation
      }, 350);
      return;
    }
  }

  // If preselectedId not found in any group, clear it
  orgStore.clearPreselectedProduct();
};

// Watch for productGroups to be loaded, then auto-select
watch(
  () => productGroups.value,
  newGroups => {
    if (newGroups.length > 0 && !selectedProductId.value) {
      autoSelectFromStore();
    }
  },
  { immediate: true }
);

// Bundle grouping logic based on product group variants
interface BundleGroup {
  id: string;
  name: string;
  duration: string; // 'month-to-month', '3-months', '6-months', '12-months'
  product: ProductBundle;
  totalPrice: number;
  pricePerMonth: number;
  savePercentage?: number;
  saveAmount?: number;
}

// Helper to get effective price after initial discount
const getEffectivePrice = (product: ProductBundle): number => {
  const initialDiscount = (product as any).initialDiscount || 0;
  return initialDiscount > 0 ? product.price - initialDiscount : product.price;
};

const availableBundles = computed((): BundleGroup[] => {
  if (!selectedProductGroup.value) return [];

  const bundles: BundleGroup[] = [];
  const variants = selectedProductGroup.value.variants;

  // Find month-to-month price for savings calculation (with discount applied)
  let monthToMonthPrice = 0;
  variants.forEach(product => {
    const name = product.name.toLowerCase();
    if (
      !name.includes('3-month') &&
      !name.includes('6-month') &&
      !name.includes('12-month')
    ) {
      monthToMonthPrice = getEffectivePrice(product);
    }
  });

  // If no month-to-month found, use first variant's price (with discount)
  if (monthToMonthPrice === 0 && variants.length > 0) {
    monthToMonthPrice = getEffectivePrice(variants[0]);
  }

  // Process each variant
  variants.forEach(product => {
    const name = product.name.toLowerCase();

    // Determine duration type
    let duration = 'month-to-month';
    let durationMonths = 1;

    if (name.includes('12-month')) {
      duration = '12-months';
      durationMonths = 12;
    } else if (name.includes('6-month')) {
      duration = '6-months';
      durationMonths = 6;
    } else if (name.includes('3-month')) {
      duration = '3-months';
      durationMonths = 3;
    }

    // Calculate pricing with initial discount applied
    const totalPrice = getEffectivePrice(product);
    const pricePerMonth = Math.round(totalPrice / durationMonths);

    const saveAmount =
      durationMonths > 1
        ? Math.max(0, monthToMonthPrice * durationMonths - totalPrice)
        : 0;

    // Calculate save percentage for display
    let savePercentage = 0;
    if (durationMonths > 1 && saveAmount > 0) {
      const fullPrice = monthToMonthPrice * durationMonths;
      savePercentage = Math.round((saveAmount / fullPrice) * 100);
    }

    bundles.push({
      id: product.id,
      name:
        duration === 'month-to-month'
          ? 'Month-to-Month'
          : `${durationMonths}-month plan`,
      duration,
      product,
      totalPrice,
      pricePerMonth,
      savePercentage: savePercentage > 0 ? savePercentage : undefined,
      saveAmount: saveAmount > 0 ? saveAmount : undefined,
    });
  });

  // Sort bundles by duration (month-to-month first, then 3, 6, 12)
  const order = ['month-to-month', '3-months', '6-months', '12-months'];
  return bundles.sort(
    (a, b) => order.indexOf(a.duration) - order.indexOf(b.duration)
  );
});

// Get selected bundle
const selectedBundle = computed(() => {
  if (!selectedBundleId.value) return null;
  return (
    availableBundles.value.find(b => b.id === selectedBundleId.value) || null
  );
});

// Calculate total and savings for summary card
const summaryTotal = computed(() => {
  if (!selectedBundle.value) return 0;
  return selectedBundle.value.totalPrice;
});

// User name from form data
const userName = computed(() => {
  const basicInfo = formStore.formData?.basicInfo as any;
  return basicInfo?.firstName;
});

// Get 6-month bundle for modal save amount display
const sixMonthBundle = computed(() => {
  return availableBundles.value.find(b => b.duration === '6-months') || null;
});

// Handle product selection
const handleProductSelect = (productId: string) => {
  selectedProductId.value = productId;
  selectedBundleId.value = null;

  // Show bundles with animation after a short delay
  setTimeout(() => {
    showBundles.value = true;

    // Auto-select 6-months by default, fallback to 3-months, then month-to-month
    const defaultBundle =
      availableBundles.value.find(b => b.duration === '6-months') ||
      availableBundles.value.find(b => b.duration === '3-months') ||
      availableBundles.value.find(b => b.duration === 'month-to-month');
    if (defaultBundle) {
      selectedBundleId.value = defaultBundle.id;
    }
  }, 300);
};

// Handle bundle selection with retention popup logic
const handleBundleSelect = (bundleId: string) => {
  const selectedBundleData = availableBundles.value.find(
    b => b.id === bundleId
  );
  const currentBundleData = availableBundles.value.find(
    b => b.id === selectedBundleId.value
  );

  // Check if switching from 6-month to a shorter plan
  if (
    currentBundleData?.duration === '6-months' &&
    selectedBundleData &&
    selectedBundleData.duration !== '6-months' &&
    !formStore.isBundlePopupShown()
  ) {
    // Store the pending selection and show modal
    pendingBundleSelection.value = bundleId;
    showRetentionModal.value = true;
    return;
  }

  selectedBundleId.value = bundleId;
};

// Handle keeping 6-month plan from modal
const handleKeepSixMonth = () => {
  pendingBundleSelection.value = null;
  formStore.setBundlePopupShown(true);
  // Keep current selection (already 6-month)
};
// Handle continuing with selected shorter plan from modal
const handleContinueWithSelected = () => {
  if (pendingBundleSelection.value) {
    selectedBundleId.value = pendingBundleSelection.value;
    pendingBundleSelection.value = null;
  }
  formStore.setBundlePopupShown(true);
};

// Validation
const isComplete = computed(() => {
  return !!(selectedProductId.value && selectedBundleId.value);
});

// Watch selection changes and emit to parent
watch(
  [selectedProductId, selectedBundleId],
  () => {
    // If required and validation fails, remove from modelValue
    if (props.required && !isComplete.value) {
      const currentValue = modelValue.value[props.fieldName];
      if (currentValue !== undefined) {
        const newModelValue = { ...modelValue.value };
        delete newModelValue[props.fieldName];
        modelValue.value = newModelValue;
      }
      return;
    }

    // Get full product details for the selected bundle
    const selectedBundleData = selectedBundle.value;
    if (!selectedBundleData || !selectedProductGroup.value) return;

    const newValue = {
      // Product group info
      productGroupId: selectedProductGroup.value.id,
      productGroupName: selectedProductGroup.value.baseName,
      // Selected bundle/variant full details
      bundleId: selectedBundleData.id,
      bundleName: selectedBundleData.name,
      duration: selectedBundleData.duration,
      totalPrice: selectedBundleData.totalPrice,
      pricePerMonth: selectedBundleData.pricePerMonth,
      savePercentage: selectedBundleData.savePercentage,
      saveAmount: selectedBundleData.saveAmount,
      // Original product data
      product: selectedBundleData.product,
    };

    // Check if value actually changed to prevent infinite loop
    const currentValue = modelValue.value[props.fieldName];
    if (JSON.stringify(currentValue) === JSON.stringify(newValue)) {
      return;
    }

    // Emit the selection as the value for this fieldName
    modelValue.value = {
      ...modelValue.value,
      [props.fieldName]: newValue,
    };
  },
  { deep: true }
);

// Watch for product selection to reset bundle visibility (but not the selection itself)
watch(selectedProductId, (newVal, oldVal) => {
  // Only reset if product actually changed (not on initial load)
  if (oldVal !== null && newVal !== oldVal) {
    showBundles.value = false;
    selectedBundleId.value = null;
  }
});

// Navigation handlers
const handleBackClick = () => {
  // Build query with category and productId if available
  const query: Record<string, string> = {};
  if (orgStore.category) {
    query.category = orgStore.category;
  }
  if (orgStore.preselectedProductId) {
    query.productId = orgStore.preselectedProductId;
  }
  router.push({ path: '/', query });
};

const handleContinueClick = () => {
  router.push({ path: '/payment' });
};
</script>

<template>
  <!-- Product Selection Section -->
  <div class="mb-8">
    <h2 class="h3 font-bold font-domin text-gray-1 mb-2">
      Select your preferred medication
    </h2>
    <p class="text-gray-11 body2 font-mdedium">
      Please select the product you are most interested in.
    </p>
  </div>

  <!-- Product Swiper - Shows unique product groups only -->
  <div class="relative mb-8">
    <ClientOnly>
      <swiper-container
        ref="swiperRef"
        :slides-per-view="1"
        :space-between="16"
        :centered-slides="false"
        :loop="true"
        :breakpoints="breakpoints"
        :auto-height="false"
        class="product-swiper"
      >
        <swiper-slide
          v-for="group in productGroups"
          :key="group.id"
          class="!h-auto"
        >
          <ProductCard
            :product="group.displayProduct"
            :is-selected="selectedProductId === group.id"
            @select="() => handleProductSelect(group.id)"
          />
        </swiper-slide>
      </swiper-container>
    </ClientOnly>

    <!-- Navigation Buttons -->
    <div
      class="flex items-center justify-end gap-4 mt-4 custom-swiper-nav"
      :data-count="productGroups.length"
    >
      <button
        class="group w-10 h-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center transition-all duration-200 hover:bg-primary cursor-pointer"
        @click="slidePrev"
      >
        <NuxtImg
          src="/icons/chevron-left.svg"
          alt="Previous"
          width="20"
          height="20"
          class="w-5 h-5 transition-all duration-200 group-hover:brightness-0 group-hover:invert"
        />
      </button>

      <button
        class="group w-10 h-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center transition-all duration-200 hover:bg-primary cursor-pointer"
        @click="slideNext"
      >
        <NuxtImg
          src="/icons/chevron-right.svg"
          alt="Next"
          width="20"
          height="20"
          class="w-5 h-5 transition-all duration-200 group-hover:brightness-0 group-hover:invert"
        />
      </button>
    </div>
  </div>

  <!-- Bundle Selection Section with Animation -->
  <Transition name="bundle-slide">
    <div v-if="showBundles && availableBundles.length > 0" class="mb-8">
      <h3 class="body1 !font-semibold text-gray-1 mb-3">Choose your bundle</h3>

      <!-- Bundle Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <BundleCard
          v-for="(bundle, index) in availableBundles"
          :key="bundle.id"
          :bundle-id="bundle.id"
          :bundle-name="bundle.name"
          :total-price="bundle.totalPrice"
          :price-per-month="bundle.pricePerMonth"
          :save-percentage="bundle.savePercentage"
          :save-amount="bundle.saveAmount"
          :is-max-savings="
            index === availableBundles.length - 1 && availableBundles.length > 1
          "
          :is-selected="selectedBundleId === bundle.id"
          @select="handleBundleSelect"
        />
      </div>

      <!-- Overview Section -->
      <div class="bg-gray-9 rounded-2xl p-6 mb-6">
        <h4 class="!font-semibold body1 text-gray-1 mb-3">
          Here's a simple overview
        </h4>
        <ul class="space-y-2 body2 !font-medium text-gray-2">
          <li v-for="value in overviews" :key="value" class="flex items-start">
            <span class="text-primary mr-2">•</span>
            <span>{{ value }}</span>
          </li>
        </ul>
      </div>

      <!-- Alice's Plan Section -->
      <div v-if="selectedBundle && selectedProductGroup">
        <!-- Heading outside card -->
        <h4 class="body1 !font-semibold text-gray-1 mb-3">
          {{ userName }}'s Plan
        </h4>

        <!-- Plan Summary Card -->
        <div
          class="bg-primary-dark-2 border-2 border-primary/50 rounded-2xl p-5 border border-primary-dark-1"
        >
          <div
            class="flex flex-col md:flex-row items-center lg:items-center gap-4"
          >
            <!-- Product Image -->
            <NuxtImg
              v-if="selectedProductGroup.displayProduct.imageUrl"
              :src="selectedProductGroup.displayProduct.imageUrl"
              :alt="selectedProductGroup.baseName"
              class="w-[200px] lg:w-[180px] object-contain flex-shrink-0"
            />

            <!-- Product Details -->
            <div class="flex-1 min-w-0">
              <!-- Product Name and Badges -->
              <div class="flex flex-wrap items-center gap-2 mb-3">
                <h5 class="!font-bold text-primary h5">
                  {{ selectedProductGroup.baseName }}
                </h5>
                <span
                  class="px-2 lg:px-3 py-1 border border-primary/50 bg-white text-gray-2 caption lg:body2 !font-semibold rounded-full"
                >
                  {{ selectedBundle.name }}
                </span>
                <span
                  class="px-2 lg:px-3 py-1 border border-primary/50 bg-white text-gray-2 caption lg:body2 !font-semibold rounded-full"
                >
                  ${{ selectedBundle.pricePerMonth }}/mo
                </span>
                <span
                  v-if="
                    selectedBundle.saveAmount && selectedBundle.saveAmount > 0
                  "
                  class="px-2 lg:px-3 py-1 border border-primary/50 bg-primary text-white caption lg:body2 !font-semibold rounded-full"
                >
                  Saving ${{ selectedBundle.saveAmount }}
                </span>
              </div>

              <!-- Total -->
              <p class="h4 !font-bold text-gray-1 mb-2">
                Total ${{ summaryTotal }}
              </p>

              <!-- Disclaimer -->
              <p class="caption text-gray-11 italic">
                *Prices are based on lowest dosage rates. Higher dosages may
                reflect a higher rate. Please review product descriptions for
                dosage pricing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Navigation Buttons -->
  <div class="flex items-center gap-4 mt-8">
    <button
      class="group w-12 h-12 md:px-6 md:py-3 md:w-auto xl:h-auto rounded-full bg-white flex items-center justify-center border-2 border-gray-border-dark hover:border-primary hover:text-primary transition-all duration-200 flex-shrink-0 md:gap-2 md:subtitle1 md:font-medium text-gray-1 cursor-pointer"
      @click="handleBackClick"
    >
      <NuxtImg
        src="/icons/chevron-left.svg"
        alt="Go back"
        width="24"
        height="24"
        class="w-6 h-6 xl:w-5 xl:h-5 group-hover:icon-primary transition-all duration-200"
      />
      <span class="hidden xl:inline">Go back</span>
    </button>

    <button
      v-if="isComplete"
      :disabled="!isComplete"
      class="flex-1 min-w-0 w-0 px-6 py-3 rounded-full bg-primary text-white hover:bg-secondary disabled:bg-primary-light disabled:cursor-not-allowed transition-all duration-200 subtitle1 font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
      @click="handleContinueClick"
    >
      <span>Continue to Payment</span>
      <NuxtImg
        src="/icons/chevron-right.svg"
        alt="Continue"
        width="20"
        height="20"
        class="w-5 h-5 brightness-0 invert"
      />
    </button>
  </div>

  <!-- Bundle Retention Modal -->
  <BundleRetentionModal
    v-model="showRetentionModal"
    :save-amount="sixMonthBundle?.saveAmount || 0"
    :six-month-bundle-name="sixMonthBundle?.name || ''"
    @keep-six-month="handleKeepSixMonth"
    @continue-with-selected="handleContinueWithSelected"
  />
</template>

<style scoped>
/* Product Swiper - Equal Height Slides */
/* Disable slider buttons when all products are visible */
.custom-swiper-nav[data-count='0'],
.custom-swiper-nav[data-count='1'] {
  opacity: 0.4;
  pointer-events: none;
}

/* Tablet (640px+): shows 2 slides. Disable if 2 or fewer products */
@media (min-width: 640px) {
  .custom-swiper-nav[data-count='2'] {
    opacity: 0.4;
    pointer-events: none;
  }
}

/* Desktop (768px+): shows 3 slides. Disable if 3 or fewer products */
@media (min-width: 768px) {
  .custom-swiper-nav[data-count='3'] {
    opacity: 0.4;
    pointer-events: none;
  }
}

.product-swiper {
  display: flex;
  align-items: stretch;
}

.product-swiper swiper-slide {
  height: auto;
  display: flex;
}

/* Bundle Slide Animation */
.bundle-slide-enter-active,
.bundle-slide-leave-active {
  transition: all 0.4s ease-in-out;
}

.bundle-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.bundle-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.bundle-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.bundle-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Group hover for white icons */
.group:hover .group-hover\:icon-white {
  filter: brightness(0) invert(1);
}
</style>
