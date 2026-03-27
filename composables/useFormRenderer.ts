// Js Dependencies
import { computed, watch, defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

// Phone number validation
import { isValidPhoneNumber } from 'libphonenumber-js';

// Pinia store
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/stores/intakeFormStore';
import { useOrganizationStore } from '~/stores/organizationStore';
// Form configuration
import { getCurrentFormConfig } from '~/data/forms/index';
import { useGlpTracking } from '~/composables/useGlpTracking';
import { useQuizTracking } from '~/composables/useQuizTracking';

// Types
interface DependsOn {
  fieldName: string;
  condition: string;
  value?: string | number | boolean;
}

interface SubStep {
  subStepId: number;
  heading: string;
  headingPrependIcon?: string;
  caption?: string;
  question: string;
  note?: string;
  fieldName: string;
  component: string;
  required: boolean;
  props?: Record<string, unknown>;
  dependsOn?: DependsOn;
}

interface Step {
  stepId: number;
  stepTitle: string;
  marketingId: number;
  subSteps: SubStep[];
}

// Component map - define once outside the composable
const componentMap: Record<string, Component> = {
  BasicInfo: defineAsyncComponent(
    () => import('~/components/panels/BasicInfo.vue')
  ),
  BooleanSelectCard: defineAsyncComponent(
    () => import('~/components/panels/BooleanSelectCard.vue')
  ),
  SingleSelectCardList: defineAsyncComponent(
    () => import('~/components/panels/SingleSelectCardList.vue')
  ),
  MultiSelect: defineAsyncComponent(
    () => import('~/components/panels/MultiSelect.vue')
  ),
  MultiSelectWithText: defineAsyncComponent(
    () => import('~/components/panels/MultiSelectWithText.vue')
  ),
  MultiSelectWithDropdowns: defineAsyncComponent(
    () => import('~/components/panels/MultiSelectWithDropdowns.vue')
  ),
  DropdownWithMultiSelect: defineAsyncComponent(
    () => import('~/components/panels/DropdownWithMultiSelect.vue')
  ),
  CheckboxAgreements: defineAsyncComponent(
    () => import('~/components/panels/CheckboxAgreements.vue')
  ),
  BMICalculator: defineAsyncComponent(
    () => import('~/components/panels/BMICalculator.vue')
  ),
  CurrentMedication: defineAsyncComponent(
    () => import('~/components/panels/CurrentMedication.vue')
  ),
  ConsultationPreference: defineAsyncComponent(
    () => import('~/components/panels/ConsultationPreference.vue')
  ),
  UserDetails: defineAsyncComponent(
    () => import('~/components/panels/UserDetails.vue')
  ),
  ConditionDetailsWithUpload: defineAsyncComponent(
    () => import('~/components/panels/ConditionDetailsWithUpload.vue')
  ),
  TwoDropdowns: defineAsyncComponent(
    () => import('~/components/panels/TwoDropdowns.vue')
  ),
  TextArea: defineAsyncComponent(() => import('~/components/ui/TextArea.vue')),
  TextInput: defineAsyncComponent(
    () => import('~/components/ui/TextInput.vue')
  ),
  NumberInput: defineAsyncComponent(
    () => import('~/components/ui/NumberInput.vue')
  ),
  DateInput: defineAsyncComponent(
    () => import('~/components/ui/DateInput.vue')
  ),
  EmailInput: defineAsyncComponent(
    () => import('~/components/ui/EmailInput.vue')
  ),
  PhoneInput: defineAsyncComponent(
    () => import('~/components/ui/PhoneInput.vue')
  ),
  CheckList: defineAsyncComponent(
    () => import('~/components/ui/CheckList.vue')
  ),
  Dropdown: defineAsyncComponent(() => import('~/components/ui/Dropdown.vue')),
  FileUpload: defineAsyncComponent(
    () => import('~/components/cards/FileUpload.vue')
  ),
  ProductSelection: defineAsyncComponent(
    () => import('~/components/panels/ProductSelection.vue')
  ),
};

// Main composable function
export function useFormRenderer() {
  const formStore = useFormStore();
  const orgStore = useOrganizationStore();
  // const { trackLead } = useGlpTracking();
  const { trackQuizStepComplete } = useQuizTracking();

  // Lead tracking state
  const firedLeadSteps = new Set<string>();

  const leadEmail = computed(() => {
    const basicInfo = formStore.formData?.basicInfo as any;
    return basicInfo?.email || '';
  });

  const productSlug = computed(() => {
    // Use category from orgStore (already validated and decoded by init.client.ts plugin)
    const category = orgStore.category;

    if (!category) return 'unknown';
    return category.toLowerCase().replace(/\s+/g, '_'); // "Weight Loss" -> "weight_loss"
  });

  const getLeadStepName = (step: Step, subStep: any, slug: string) => {
    // Customize naming as you like – but keep it stable
    const field = subStep.fieldName || subStep.component || 'unknown';
    return `${slug}_step${step.stepId}_sub${subStep.subStepId}_${field}`;
  };

  // Get reactive refs from store
  const { formData, currentStepId, currentSubStepId } = storeToRefs(formStore);

  // Reactive form config - uses category from organizationStore
  const config = computed(() => {
    const category = orgStore.category;
    return getCurrentFormConfig(category || undefined);
  });

  const steps = computed(() => config.value.steps as Step[]);

  // Check if we should show marketing for current step (only on mobile/below xl)
  const shouldShowMarketing = computed(() => {
    const step = currentStepConfig.value;
    if (!step || !step.marketingId) return false;

    // Check if marketing already shown for this step
    return !formStore.isMarketingShown(step.stepId);
  });

  // Helper function to check if a substep's dependency is satisfied
  const checkDependency = (dependsOn: DependsOn): boolean => {
    const { fieldName, condition, value } = dependsOn;

    // Support nested field paths like "basicInfo.gender"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    const fieldValue = getNestedValue(formData.value, fieldName);

    switch (condition) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(value);
      case 'notContains':
        return Array.isArray(fieldValue) && !fieldValue.includes(value);
      case 'exists':
      case 'isNotEmpty':
        return (
          fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
        );
      case 'notExists':
      case 'isEmpty':
        return (
          fieldValue === undefined || fieldValue === null || fieldValue === ''
        );
      case 'hasLength':
        if (Array.isArray(fieldValue)) {
          return fieldValue.length > 0;
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.trim().length > 0;
        }
        return false;
      case 'greaterThan':
        return (
          typeof fieldValue === 'number' &&
          typeof value === 'number' &&
          fieldValue > value
        );
      case 'lessThan':
        return (
          typeof fieldValue === 'number' &&
          typeof value === 'number' &&
          fieldValue < value
        );
      default:
        return true;
    }
  };

  // Helper function to get visible substeps for a given step
  const getVisibleSubSteps = (subSteps: SubStep[]): SubStep[] => {
    return subSteps.filter(subStep => {
      if (!subStep.dependsOn) return true;
      return checkDependency(subStep.dependsOn);
    });
  };

  // Watch formData and save to localStorage with deep tracking
  watch(
    formData,
    newData => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('formData', JSON.stringify(newData));
      }
    },
    { deep: true }
  );

  // Watch for dependency changes and clean up hidden substep values
  watch(
    formData,
    () => {
      // Get all substeps from all steps
      const allSubSteps = steps.value.flatMap(step => step.subSteps);

      // Find substeps that have dependencies but are now hidden
      const hiddenSubSteps = allSubSteps.filter(subStep => {
        if (!subStep.dependsOn) return false;
        return !checkDependency(subStep.dependsOn);
      });

      // Collect field names to remove
      const fieldsToRemove = hiddenSubSteps
        .map(subStep => subStep.fieldName)
        .filter(fieldName => formData.value[fieldName] !== undefined);

      // Only update if there are fields to remove
      if (fieldsToRemove.length > 0) {
        const newFormData = { ...formData.value };
        fieldsToRemove.forEach(fieldName => {
          delete newFormData[fieldName];
        });
        formStore.setFormData(newFormData);
      }
    },
    { deep: true }
  );

  // Get current step config
  const currentStepConfig = computed((): Step | undefined => {
    return steps.value.find(step => step.stepId === currentStepId.value);
  });

  // Get all visible substeps (filtering by dependency)
  const visibleSubSteps = computed((): SubStep[] => {
    if (!currentStepConfig.value) return [];
    return getVisibleSubSteps(currentStepConfig.value.subSteps);
  });

  // Get current substep config based on visible substeps
  const currentSubStepConfig = computed((): SubStep | undefined => {
    return visibleSubSteps.value.find(
      subStep => subStep.subStepId === currentSubStepId.value
    );
  });

  // Get current substep index (for display purposes)
  const currentSubStepIndex = computed(() => {
    return visibleSubSteps.value.findIndex(
      subStep => subStep.subStepId === currentSubStepId.value
    );
  });

  // Total visible substeps
  const totalSubSteps = computed(() => visibleSubSteps.value.length);

  // Check if current field is valid
  const isCurrentFieldValid = computed(() => {
    if (!currentSubStepConfig.value) return false;

    const { fieldName, required, component } = currentSubStepConfig.value;
    const fieldValue = formData.value[fieldName];

    // If not required, always valid
    if (!required) return true;

    // Basic validation for strings - check non-empty after trim
    const isValidString = (value: unknown): boolean => {
      return typeof value === 'string' && value.trim().length > 0;
    };

    // Component-specific validation (only for basic input components)
    switch (component) {
      case 'EmailInput': {
        if (!isValidString(fieldValue)) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test((fieldValue as string).trim());
      }

      case 'PhoneInput': {
        if (!isValidString(fieldValue)) return false;
        try {
          const phoneStr = (fieldValue as string).trim();
          return isValidPhoneNumber(phoneStr);
        } catch {
          // If parsing fails, return false
          return false;
        }
      }

      case 'TextArea': {
        if (!isValidString(fieldValue)) return false;
        return (fieldValue as string).trim().length >= 25;
      }

      case 'TextInput':
        return isValidString(fieldValue);

      case 'NumberInput':
        return typeof fieldValue === 'number' && !isNaN(fieldValue);

      case 'DateInput':
        return isValidString(fieldValue);

      case 'FileUpload': {
        // FileUpload stores data as an array of file objects
        if (!Array.isArray(fieldValue)) return false;
        if (fieldValue.length === 0) return false;
        // Check if the first file has required properties
        const file = fieldValue[0];
        return !!(
          file &&
          typeof file === 'object' &&
          file.name &&
          file.fileUrl &&
          file.s3Key
        );
      }

      case 'ProductSelection': {
        // ProductSelection stores data as { productId, bundleId }
        if (typeof fieldValue !== 'object' || fieldValue === null) return false;
        return !!(fieldValue.productId && fieldValue.bundleId);
      }

      case 'ConditionDetailsWithUpload': {
        // ConditionDetailsWithUpload stores data as { fieldOne, fieldTwo, fieldThree }
        if (typeof fieldValue !== 'object' || fieldValue === null) return false;
        
        // Validate fieldOne (duration dropdown)
        const fieldOne = fieldValue.fieldOne;
        const isFieldOneValid = fieldOne && String(fieldOne).trim() !== '';
        
        // Validate fieldTwo (clinical diagnosis dropdown)
        const fieldTwo = fieldValue.fieldTwo;
        const isFieldTwoValid = fieldTwo && String(fieldTwo).trim() !== '';
        
        // Validate fieldThree (photo upload array)
        const fieldThree = fieldValue.fieldThree;
        const isFieldThreeValid = 
          Array.isArray(fieldThree) &&
          fieldThree.length > 0 &&
          fieldThree[0] &&
          typeof fieldThree[0] === 'object' &&
          fieldThree[0].name &&
          fieldThree[0].fileUrl &&
          fieldThree[0].s3Key;
        
        return !!(isFieldOneValid && isFieldTwoValid && isFieldThreeValid);
      }

      case 'TwoDropdowns': {
        // TwoDropdowns stores data as { fieldOne, fieldTwo }
        if (typeof fieldValue !== 'object' || fieldValue === null) return false;
        
        // Validate fieldOne
        const fieldOne = fieldValue.fieldOne;
        const isFieldOneValid = fieldOne && String(fieldOne).trim() !== '';
        
        // Validate fieldTwo
        const fieldTwo = fieldValue.fieldTwo;
        const isFieldTwoValid = fieldTwo && String(fieldTwo).trim() !== '';
        
        return !!(isFieldOneValid && isFieldTwoValid);
      }

      default: {
        // For all other components (MultiSelect, BooleanSelectCard, etc.)
        // Just check if value exists
        if (Array.isArray(fieldValue)) {
          return fieldValue.length > 0;
        }
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          return Object.keys(fieldValue).length > 0;
        }
        return (
          fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
        );
      }
    }
  });

  // Check if current component should hide Continue button
  const shouldHideContinueButton = computed(() => {
    const componentName = currentSubStepConfig.value?.component;
    return (
      componentName === 'BooleanSelectCard' ||
      componentName === 'SingleSelectCardList' ||
      componentName === 'ProductSelection'
    );
  });

  // Can go next
  const canGoNext = computed(() => {
    // Hide Continue button for BooleanSelectCard and SingleSelectCardList
    if (shouldHideContinueButton.value) return false;

    // Can go next if field is valid (or not required)
    return isCurrentFieldValid.value || !currentSubStepConfig.value?.required;
  });

  // Can go previous - hide only on first step's first substep
  const canGoPrevious = computed(() => {
    // Show back button everywhere except first step's first substep
    // First step has stepId = 1, first substep of each step has subStepId = 1
    return !(currentStepId.value === 1 && currentSubStepId.value === 1);
  });

  // Check if we should show the navigation section at all
  const shouldShowNavigation = computed(() => {
    // Hide navigation entirely for ProductSelection (it has its own)
    const componentName = currentSubStepConfig.value?.component;
    if (componentName === 'ProductSelection') {
      return false;
    }

    // Show navigation if back button is visible OR continue button is visible
    // For components that auto-select, we still show back button but not continue
    return (
      canGoPrevious.value ||
      (!shouldHideContinueButton.value && canGoNext.value)
    );
  });

  // Watch visible substeps and validate current substep ID when they change
  // This handles cases where dependencies change and make current substep invalid
  let isInitialLoad = true;
  watch(
    visibleSubSteps,
    newVisible => {
      // Skip validation on initial load to preserve saved position
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      // Check if current substep ID exists in visible substeps
      const isValidSubStep = newVisible.some(
        subStep => subStep.subStepId === currentSubStepId.value
      );

      // If current substep is not visible, set to first visible substep
      if (!isValidSubStep && newVisible.length > 0) {
        const firstSubStep = newVisible[0];
        if (firstSubStep) {
          formStore.setSubStepId(firstSubStep.subStepId);
        }
      }
    },
    { flush: 'post' }
  );

  // Get component as computed
  const getCurrentComponent = computed<Component | null>(() => {
    const componentName = currentSubStepConfig.value?.component;
    if (!componentName) return null;
    return componentMap[componentName] || null;
  });

  // Handle next - move to next visible substep
  const handleNext = () => {
    const currentIndex = currentSubStepIndex.value;
    const completedStep = steps.value.find(
      (step: Step) => step.stepId === currentStepId.value
    );
    const completedSubStep = visibleSubSteps.value[currentIndex];

    //  Fire lead tracking for the COMPLETED step BEFORE navigation
    if (completedStep && completedSubStep) {
      const slug = productSlug.value;
      const leadStepName = getLeadStepName(
        completedStep,
        completedSubStep,
        slug
      );

      if (!firedLeadSteps.has(leadStepName)) {
        firedLeadSteps.add(leadStepName);

        // trackLead({
        //   email: leadEmail.value,
        //   leadStep: leadStepName,
        //   extra: {
        //     stepId: completedStep.stepId,
        //     subStepId: completedSubStep.subStepId,
        //     stepTitle: completedStep.stepTitle,
        //     marketingId: completedStep.marketingId,
        //   },
        // });

        // Track for GTM - quiz step complete
        trackQuizStepComplete(
          completedStep.stepId,
          leadStepName,
          completedStep.stepTitle,
          completedSubStep.fieldName
        );
      } else {
        console.log('Lead already tracked for this step, skipping');
      }
    } else {
      console.log('Missing completedStep or completedSubStep');
    }

    // 🔹 Navigation logic - move to next step
    if (currentIndex < totalSubSteps.value - 1) {
      // Move to next visible substep in current step
      const nextSubStep = visibleSubSteps.value[currentIndex + 1];
      if (nextSubStep) {
        formStore.setSubStepId(nextSubStep.subStepId);
      }
    } else {
      // Move to next step if at the end of substeps
      const currentStepIndex = steps.value.findIndex(
        (step: Step) => step.stepId === currentStepId.value
      );

      if (currentStepIndex < steps.value.length - 1) {
        const nextStep = steps.value[currentStepIndex + 1];
        if (nextStep) {
          formStore.setStepId(nextStep.stepId);

          // Set to first visible substep of next step
          const nextStepVisibleSubSteps = getVisibleSubSteps(nextStep.subSteps);
          const firstSubStep = nextStepVisibleSubSteps[0];
          if (firstSubStep) {
            formStore.setSubStepId(firstSubStep.subStepId);
          }
        }
      } else {
        // If we're at the last step, mark form as completed and redirect to products page
        formStore.setFormCompleted(true);
        // eslint-disable-next-line no-undef
        navigateTo({ path: '/products' }); // Navigate without query params
      }
    }
  };

  // Handle previous - move to previous visible substep
  const handlePrevious = () => {
    const currentIndex = currentSubStepIndex.value;

    if (currentIndex > 0) {
      // Move to previous visible substep in current step
      const prevSubStep = visibleSubSteps.value[currentIndex - 1];
      if (prevSubStep) {
        formStore.setSubStepId(prevSubStep.subStepId);
      }
    } else {
      // Move to previous step if at the beginning of substeps
      const currentStepIndex = steps.value.findIndex(
        (step: Step) => step.stepId === currentStepId.value
      );

      if (currentStepIndex > 0) {
        const prevStep = steps.value[currentStepIndex - 1];
        if (prevStep) {
          formStore.setStepId(prevStep.stepId);

          // Set to last visible substep of previous step
          const prevVisibleSubSteps = getVisibleSubSteps(prevStep.subSteps);
          if (prevVisibleSubSteps.length > 0) {
            const lastSubStep =
              prevVisibleSubSteps[prevVisibleSubSteps.length - 1];
            if (lastSubStep) {
              formStore.setSubStepId(lastSubStep.subStepId);
            }
          }
        }
      }
    }
  };

  // Handle marketing continue - mark marketing as shown and show first substep
  const handleMarketingContinue = () => {
    if (currentStepConfig.value) {
      formStore.setMarketingShown(currentStepConfig.value.stepId);
    }
  };

  // Check if we're on the first step's first substep (for HeroProductCard)
  const isFirstStepFirstSubStep = computed(() => {
    return currentStepId.value === 1 && currentSubStepId.value === 1;
  });

  // Check if we're on the last substep of the last step (for finish-quiz button ID)
  const isLastStepLastSubStep = computed(() => {
    const lastStep = steps.value[steps.value.length - 1];
    if (!lastStep) return false;
    const lastVisibleSubSteps = getVisibleSubSteps(lastStep.subSteps);
    const lastSubStepId = lastVisibleSubSteps[lastVisibleSubSteps.length - 1]?.subStepId;
    return currentStepId.value === lastStep.stepId && currentSubStepId.value === lastSubStepId;
  });

  return {
    currentStepId,
    currentSubStepId,
    currentStepConfig,
    currentSubStepConfig,
    currentSubStepIndex,
    totalSubSteps,
    visibleSubSteps,
    formData,
    canGoNext,
    canGoPrevious,
    shouldShowNavigation,
    shouldShowMarketing,
    shouldHideContinueButton,
    isCurrentFieldValid,
    isFirstStepFirstSubStep,
    isLastStepLastSubStep,
    handleNext,
    handlePrevious,
    handleMarketingContinue,
    getCurrentComponent,
  };
}
