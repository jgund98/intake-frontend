import { ref } from 'vue';
import { $fetch } from 'ofetch';

interface PromoCodeData {
  flatDiscount?: number;
  percentDiscount?: number;
}

interface PromoCodeApiResp {
  ok: boolean;
  data: PromoCodeData[];
  message: string;
}

export function usePromoCode() {
  const promoCodeData = ref<PromoCodeData | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);
  const isApplied = ref(false);

  const applyPromoCode = async (
    code: string,
    productBundleId: string
  ): Promise<boolean> => {
    if (!code || !productBundleId) {
      error.value = 'Promo code and product bundle ID are required';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<PromoCodeApiResp>(`/api/v1/promo-codes`, {
        method: 'GET',
        params: {
          code: code,
          product_bundle_id: productBundleId,
        },
      });

      if (response.ok && response.data && response.data.length > 0) {
        promoCodeData.value = response.data[0];
        isApplied.value = true;
        return true;
      }

      error.value = response.message || 'Invalid promo code';
      isApplied.value = false;
      return false;
    } catch (e: unknown) {
      console.error('Promo code validation error:', e);
      const errorMsg =
        (e as { data?: { message?: string } })?.data?.message ||
        'Invalid promo code';
      error.value = errorMsg;
      isApplied.value = false;
      return false;
    } finally {
      loading.value = false;
    }
  };

  const clearPromoCode = () => {
    promoCodeData.value = null;
    error.value = null;
    loading.value = false;
    isApplied.value = false;
  };

  const getDiscountAmount = (totalAmount: number): number => {
    if (!promoCodeData.value || !isApplied.value) return 0;

    if (promoCodeData.value.flatDiscount !== undefined) {
      return promoCodeData.value.flatDiscount;
    }

    if (promoCodeData.value.percentDiscount !== undefined) {
      return (totalAmount * promoCodeData.value.percentDiscount) / 100;
    }

    return 0;
  };

  const calculateDiscountedPrice = (
    originalPrice: number,
    discountData: PromoCodeData | null
  ): number => {
    if (!discountData) {
      return originalPrice;
    }

    if (discountData.flatDiscount) {
      return Math.max(0, originalPrice - discountData.flatDiscount);
    }

    if (discountData.percentDiscount) {
      const discountAmount =
        (originalPrice * discountData.percentDiscount) / 100;
      return Math.max(0, originalPrice - discountAmount);
    }

    return originalPrice;
  };

  return {
    promoCodeData,
    loading,
    error,
    isApplied,
    applyPromoCode,
    clearPromoCode,
    getDiscountAmount,
    calculateDiscountedPrice,
  };
}
