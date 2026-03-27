<script setup lang="ts">
import { computed } from 'vue';
import type { ProductBundle } from '~/models/apiResponse.model';

interface Props {
  product: ProductBundle;
  isSelected: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [productId: string];
}>();

// Calculate effective price after initial discount
const effectivePrice = computed(() => {
  const initialDiscount = (props.product as any).initialDiscount || 0;
  return initialDiscount > 0
    ? props.product.price - initialDiscount
    : props.product.price;
});

const handleSelect = (productId: string) => {
  emit('select', productId);
};
</script>

<template>
  <div
    :id="'select-product-' + product.id"
    class="relative flex flex-col items-center p-4 border rounded-4xl cursor-pointer transition-all duration-200 h-full w-full border-primary-dark-4"
    :class="isSelected ? 'bg-primary-dark-2 selected-product' : 'bg-white'"
    @click="handleSelect(product.id)"
  >
    <!-- Radio Button -->
    <div class="absolute top-3 right-3">
      <div
        class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        :class="
          isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
        "
      >
        <div v-if="isSelected" class="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    </div>

    <!-- Product Image -->
    <div
      class="w-full h-[110px] md:h-[150px] mb-3 flex-shrink-0 flex items-center justify-center"
    >
      <NuxtImg
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        class="h-full object-contain"
      />
    </div>

    <!-- Pricing -->
    <div class="text-center mb-2">
      <p class="body2 text-gray-1 mb-2 font-medium">Starting at</p>
      <span class="h6 md:h4 font-bold text-primary font-regular">
        ${{ effectivePrice }}
      </span>
    </div>

    <!-- Product Name -->
    <p
      class="text-center body2 md:h6 font-regular text-gray-1 leading-tight px-2"
    >
      {{ product.name }}
    </p>
  </div>
</template>
