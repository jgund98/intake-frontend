import { ref } from 'vue';
import { $fetch } from 'ofetch';
import { useUiStore } from '~/stores/uiStore';
import type { ApiResp } from '~/models/apiResponse.model';

export interface CaseCreationResponse {
  caseId: string;
  status: string;
  [key: string]: any;
}

export function useCaseCreation() {
  const uiStore = useUiStore();

  const caseData = ref<CaseCreationResponse | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  const createCase = async (
    patientCaseData: any
  ): Promise<CaseCreationResponse | null> => {
    loading.value = true;
    error.value = null;
    uiStore.start();

    try {
      const response = await $fetch<ApiResp<CaseCreationResponse>>(
        '/api/create-case',
        {
          method: 'POST',
          body: patientCaseData,
        }
      );

      if (response.ok) {
        // Success
        caseData.value = response.data;
        return response.data;
      }

      // Error response
      error.value = response.message;
      return null;
    } catch (e: Error | any) {
      error.value = e?.data?.message || 'Failed to create patient case';
      return null;
    } finally {
      loading.value = false;
      uiStore.stop();
    }
  };

  const clearCaseData = () => {
    caseData.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    caseData,
    loading,
    error,
    createCase,
    clearCaseData,
  };
}
