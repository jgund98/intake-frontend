import { defineStore } from 'pinia';

type FormDataType = Record<string, unknown>;

const STORAGE_KEY = 'currentStepId';
const MAX_VISITED_KEY = 'maxVisitedStepId';
const SUBSTEP_KEY = 'currentSubStepId';
const MAX_SUBSTEP_KEY = 'maxSubStepId';
const FORMDATA_KEY = 'formData';
const MARKETING_SHOWN_KEY = 'marketingShownSteps';
const FORM_COMPLETED_KEY = 'isFormCompleted';
const PAYMENT_COMPLETED_KEY = 'isPaymentCompleted';
const CASE_ID_KEY = 'caseId';

export const useFormStore = defineStore('formStore', {
  state: () => ({
    currentStepId: 1,
    maxVisitedStepId: 1,
    currentSubStepId: 1,
    maxSubStepId: 1,
    bundlePopupShown: false, // Track if bundle retention popup has been shown this session
    formData: {} as FormDataType,
    marketingShownSteps: {} as Record<number, boolean>, // Track which steps have shown their marketing
    isFormCompleted: false, // Track if user has completed the form
    isPaymentCompleted: false, // Track if payment and case creation was successful
    caseId: '', // Store case ID after successful payment
    promoDiscount: null as {
      flatDiscount?: number;
      percentDiscount?: number;
    } | null, // Store promo code discount data
  }),

  actions: {
    initializeFromLocalStorage() {
      // Load from localStorage or use defaults
      const storedStepId = localStorage.getItem(STORAGE_KEY);
      const storedMaxVisitedId = localStorage.getItem(MAX_VISITED_KEY);
      const storedSubStepId = localStorage.getItem(SUBSTEP_KEY);
      const storedMaxSubStepId = localStorage.getItem(MAX_SUBSTEP_KEY);
      const storedFormData = localStorage.getItem(FORMDATA_KEY);
      const storedMarketingShown = localStorage.getItem(MARKETING_SHOWN_KEY);
      const storedFormCompleted = localStorage.getItem(FORM_COMPLETED_KEY);
      const storedPaymentCompleted = localStorage.getItem(
        PAYMENT_COMPLETED_KEY
      );
      const storedCaseId = localStorage.getItem(CASE_ID_KEY);

      this.currentStepId = storedStepId ? parseInt(storedStepId, 10) : 1;
      this.maxVisitedStepId = storedMaxVisitedId
        ? parseInt(storedMaxVisitedId, 10)
        : 1;
      this.currentSubStepId = storedSubStepId
        ? parseInt(storedSubStepId, 10)
        : 1;
      this.maxSubStepId = storedMaxSubStepId
        ? parseInt(storedMaxSubStepId, 10)
        : 1;
      this.formData = storedFormData ? JSON.parse(storedFormData) : {};
      this.marketingShownSteps = storedMarketingShown
        ? JSON.parse(storedMarketingShown)
        : {};
      this.isFormCompleted = storedFormCompleted === 'true';
      this.isPaymentCompleted = storedPaymentCompleted === 'true';
      this.caseId = storedCaseId || '';
      // promoDiscount is not loaded from localStorage - stays as null on refresh
    },

    setStepId(stepId: number) {
      this.currentStepId = stepId;
      localStorage.setItem(STORAGE_KEY, stepId.toString());

      // Update maxVisitedStepId if we're moving forward
      if (stepId > this.maxVisitedStepId) {
        this.maxVisitedStepId = stepId;
        localStorage.setItem(MAX_VISITED_KEY, stepId.toString());
      }
    },

    setSubStepId(subStepId: number) {
      this.currentSubStepId = subStepId;
      localStorage.setItem(SUBSTEP_KEY, subStepId.toString());

      // Update maxSubStepId if we're moving forward
      if (subStepId > this.maxSubStepId) {
        this.maxSubStepId = subStepId;
        localStorage.setItem(MAX_SUBSTEP_KEY, subStepId.toString());
      }
    },

    setFormData(data: FormDataType | null) {
      this.formData = data || {};
      if (data) {
        localStorage.setItem(FORMDATA_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(FORMDATA_KEY);
      }
    },

    setMarketingShown(stepId: number) {
      this.marketingShownSteps[stepId] = true;
      localStorage.setItem(
        MARKETING_SHOWN_KEY,
        JSON.stringify(this.marketingShownSteps)
      );
    },

    isMarketingShown(stepId: number): boolean {
      return this.marketingShownSteps[stepId] === true;
    },

    setBundlePopupShown(shown: boolean) {
      this.bundlePopupShown = shown;
      // Note: Not persisting to localStorage - only per session
    },

    isBundlePopupShown(): boolean {
      return this.bundlePopupShown;
    },

    setFormCompleted(completed: boolean) {
      this.isFormCompleted = completed;
      localStorage.setItem(FORM_COMPLETED_KEY, completed.toString());
    },

    setPaymentCompleted(completed: boolean) {
      this.isPaymentCompleted = completed;
      localStorage.setItem(PAYMENT_COMPLETED_KEY, completed.toString());
    },

    setCaseId(caseId: string) {
      this.caseId = caseId;
      localStorage.setItem(CASE_ID_KEY, caseId);
    },

    setPromoDiscount(
      discount: { flatDiscount?: number; percentDiscount?: number } | null
    ) {
      // Store in state only, not in localStorage
      // This ensures discount is cleared on page refresh
      this.promoDiscount = discount;
    },

    resetForm() {
      this.currentStepId = 1;
      this.maxVisitedStepId = 1;
      this.currentSubStepId = 1;
      this.maxSubStepId = 1;
      this.formData = {};
      this.marketingShownSteps = {};
      this.isFormCompleted = false;
      this.isPaymentCompleted = false;
      this.caseId = '';
      this.promoDiscount = null;
      localStorage.setItem(STORAGE_KEY, '1');
      localStorage.setItem(MAX_VISITED_KEY, '1');
      localStorage.setItem(SUBSTEP_KEY, '1');
      localStorage.setItem(MAX_SUBSTEP_KEY, '1');
      localStorage.removeItem(FORMDATA_KEY);
      localStorage.removeItem(MARKETING_SHOWN_KEY);
      localStorage.removeItem(FORM_COMPLETED_KEY);
      localStorage.removeItem(PAYMENT_COMPLETED_KEY);
      localStorage.removeItem(CASE_ID_KEY);
    },
  },

  getters: {
    getCurrentStepId: state => state.currentStepId,
    getMaxVisitedStepId: state => state.maxVisitedStepId,
    getCurrentSubStepId: state => state.currentSubStepId,
    getMaxSubStepId: state => state.maxSubStepId,
    getFormData: state => state.formData,
  },
});
