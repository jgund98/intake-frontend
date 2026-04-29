import { ref } from 'vue';
import { $fetch } from 'ofetch';
import { useUiStore } from '~/stores/uiStore';
import type { ApiResp, OrgVariables } from '~/models/apiResponse.model';
// import { ResponseType } from '~/models/apiResponse.model';

export function useOrgData() {
  const uiStore = useUiStore();

  const orgData = ref<OrgVariables | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  const fetchOrgData = async (): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    uiStore.start();

    try {
      const response = await $fetch<ApiResp<OrgVariables>>('/api/getOrgData');

      if (response.ok) {
        // Success
        orgData.value = response.data;

        // Debug: Log raw product bundles from API
        // console.log('🔍 RAW API RESPONSE - Product Bundles:', response.data.productBundles);

        return true;
      }

      // Error response
      error.value = response.message;
      console.warn('[useOrgData] API returned error:', response.message);
      // uiStore.showToast('Error', response.message, ResponseType.ERROR);
      return false;
    } catch (e: Error | any) {
      error.value = e ? e?.data?.message : 'Failed to fetch organization data';
      console.warn('[useOrgData] Failed to fetch org data:', error.value);
      // uiStore.showToast('Error', error.value, ResponseType.ERROR);
      return false;
    } finally {
      loading.value = false;
      // Always stop the loader, even on error
      uiStore.stop();
    }
  };

  const clearOrgData = () => {
    orgData.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    orgData,
    loading,
    error,
    fetchOrgData,
    clearOrgData,
  };
}
