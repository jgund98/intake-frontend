import { computed } from 'vue';
import { useGtm } from '~/composables/useGtm';
import { useOrganizationStore } from '~/stores/organizationStore';
import { useFormStore } from '~/stores/intakeFormStore';

/**
 * Composable for tracking quiz and form events in GTM
 * Includes: quiz_start, quiz_step_complete, and conversion events
 */
export const useQuizTracking = () => {
  const gtm = useGtm();
  const orgStore = useOrganizationStore();
  const formStore = useFormStore();

  // Get the product category in slug format (e.g., "weight_loss")
  const productCategory = computed(() => {
    const category = orgStore.category;
    if (!category) return 'unknown';
    return category.toLowerCase().replace(/\s+/g, '_');
  });

  // Get user email from form data
  const userEmail = computed(() => {
    const userDetails = formStore.formData?.userDetails as any;
    const basicInfo = formStore.formData?.basicInfo as any;
    return userDetails?.email || basicInfo?.email || '';
  });

  /**
   * Track when user begins the quiz
   * Fires on index page when user starts form completion
   */
  const trackQuizStart = () => {
    const payload = {
      event: 'quiz_start',
      userEmail: userEmail.value || undefined,
      productCategory: productCategory.value,
      timestamp: Date.now(),
    };
    console.log('GTM Event - Quiz Start:', payload);
    gtm.pushEvent(payload);
  };

  /**
   * Track when user completes a form step
   * Fires after each form step submission
   *
   * @param stepNumber - The step number (1, 2, 3, etc.)
   * @param stepName - The unique step identifier (e.g., "weight_loss_step1_sub1_basicInfo")
   * @param stepTitle - The display title of the step (e.g., "Basic Information")
   * @param subStepName - Optional: the substep name
   */
  const trackQuizStepComplete = (
    stepNumber: number,
    stepName: string,
    stepTitle: string,
    subStepName?: string
  ) => {
    const payload = {
      event: 'quiz_step_complete',
      userEmail: userEmail.value || undefined,
      stepNumber,
      stepName,
      stepTitle,
      subStepName: subStepName || undefined,
      productCategory: productCategory.value,
      timestamp: Date.now(),
    };
    console.log('GTM Event - Quiz Step Complete:', payload);
    gtm.pushEvent(payload);
  };

  /**
   * Track when user completes payment (conversion)
   * This is already handled by useGlpTracking, but can be called here if needed
   *
   * @param caseId - The case/conversion ID
   */
  const trackPaymentSuccess = (caseId: string) => {
    const payload = {
      event: 'glp_conversion',
      userEmail: userEmail.value || undefined,
      conversionId: caseId,
      productCategory: productCategory.value,
      timestamp: Date.now(),
    };
    console.log('GTM Event - Payment Success:', payload);
    gtm.pushEvent(payload);
  };

  return {
    trackQuizStart,
    trackQuizStepComplete,
    trackPaymentSuccess,
    productCategory,
    userEmail,
  };
};