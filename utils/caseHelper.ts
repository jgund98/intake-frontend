/**
 * Case Creation Helper Utilities
 * Handles case creation payload preparation and transformation
 */

import { getCurrentFormConfig } from '~/data/forms/index';
import { useOrganizationStore } from '~/stores/organizationStore';

// Types
interface QuestionConfig {
  question: string;
  component?: string;
  props?: {
    options?: Array<{ value: string; label?: string }>;
  };
  [key: string]: any;
}

export interface CaseCreationPayload {
  nmiPaymentToken: string;
  cardholderName: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  promoCode?: string;
  productSelection: Record<string, unknown>;
  formData: Record<string, unknown>;
  amount: number;
  [key: string]: unknown; // Allow additional fields for future extension
}

export interface PaymentData {
  nmiPaymentToken?: string;
  cardholderName?: string;
  shippingAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  promoCode?: string;
  formData?: {
    basicInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      gender?: string;
      [key: string]: unknown;
    };
    userDetails?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      birthDate?: string;
      consent?: boolean;
      [key: string]: unknown;
    };
    productSelection?: {
      productGroupId?: string;
      productGroupName?: string;
      bundleId?: string;
      bundleName?: string;
      totalPrice?: number;
      product?: {
        id?: string;
        name?: string;
        description?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PatientCaseData {
  nmiPaymentToken: string;
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  gender: string;
  phoneNumber: string;
  formTitle?: string;
  formDescription?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentAmount: number;
  paymentDescription: string;
  productBundleId: string;
  promoCodes?: Record<string, string>;
  questions?: Array<{
    question: string;
    answer: string | any[] | Record<string, any>;
    type: string;
    options?: string[];
  }>;
}

/**
 * Prepares patient case data from payment data structure
 */
export const preparePatientCaseData = async (
  paymentData: PaymentData
): Promise<{ patientCaseData: PatientCaseData }> => {
  const { nmiPaymentToken, shippingAddress, promoCode, formData } = paymentData;

  const basicInfo = formData?.basicInfo;
  const userDetails = formData?.userDetails;
  const productSelection = formData?.productSelection;

  // Get form config based on category from organization store
  const orgStore = useOrganizationStore();
  const category = orgStore.category;
  const formConfig = getCurrentFormConfig(category as string);

  const { questions } = prepareQuestions(formData, formConfig);

  const basicDetails: PatientCaseData = {
    nmiPaymentToken: nmiPaymentToken || '',
    firstName: userDetails?.firstName || basicInfo?.firstName || '',
    lastName: userDetails?.lastName || basicInfo?.lastName || '',
    email: userDetails?.email || basicInfo?.email || '',
    dob: userDetails?.birthDate || '',
    gender: basicInfo?.gender || '',
    phoneNumber: userDetails?.phoneNumber || '',
    formTitle: `${category}-intake-form`,
    formDescription: `Intake form for ${category} program`,
    shippingAddress: {
      addressLine1: shippingAddress?.addressLine1 || '',
      addressLine2: shippingAddress?.addressLine2 || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      postalCode: shippingAddress?.postalCode || '',
      country: shippingAddress?.country || '',
    },
    paymentAmount: (() => {
      const product = productSelection?.product;
      if (!product?.price) return productSelection?.totalPrice || 0;

      const productPrice = product.price || 0;
      const initialDiscount = product.initialDiscount || 0;
      const amount = initialDiscount > 0 ? productPrice - initialDiscount : productPrice;
      return Math.round(amount * 100) / 100; // Ensure 2 decimal places
    })(),
    paymentDescription: productSelection?.product?.name || '',
    productBundleId: productSelection?.bundleId || '',
    questions: questions,
    ...(promoCode && { promoCodes: { Promo: promoCode } }),
  };

  return {
    patientCaseData: basicDetails,
  };
};

// Helper function to find question from form config by fieldName
const findQuestionFromConfig = (
  fieldName: string,
  formConfig: any
): QuestionConfig | null => {
  for (const step of formConfig.steps) {
    for (const subStep of step.subSteps) {
      if (subStep.fieldName === fieldName) {
        return subStep || null;
      }
    }
  }
  return null;
};

// Check if value is primitive (string or number)
const isPrimitive = (value: any): boolean => {
  return typeof value === 'string' || typeof value === 'number';
};

// Helper function to format answer based on value type
const formatAnswer = (value: any): any => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value;
  if (isPrimitive(value)) {
    return String(value);
  }
  return '';
};

// Check if value is valid answer
const isValidAnswer = (value: any): boolean => {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
};

/**
 * Format file data for API submission
 * Returns: [{ name: "file.pdf", data: "https://s3-url..." }]
 */
const formatFilesForSubmission = (files: any[]): any[] => {
  if (!files || files.length === 0) {
    return [];
  }

  return files
    .map(file => {
      if (file?.fileUrl) {
        return {
          name: file.name || 'uploaded_file',
          data: file.fileUrl, // S3 URL directly
        };
      }
      return null;
    })
    .filter(Boolean);
};

const prepareQuestions = (
  formData: Record<string, unknown> = {},
  formConfig?: any
) => {
  const questions: Array<{
    question: string;
    answer: string | any[] | Record<string, any>;
    type: string;
    options?: string[];
  }> = [];

  // If no form config provided, skip question extraction
  if (!formConfig) {
    return { questions };
  }

  const questionTypes = {
    SingleSelectCardList: 'SINGLESELECT',
    BooleanSelectCard: 'MULTISELECT',
  };

  // Nested object field question mappings
  const nestedFieldQuestions: Record<string, string> = {
    // BMI Calculator - age only (height/weight/bmi will be combined)
    age: 'What is your age?',

    // Current GLP1 Medication fields
    medication: 'Which GLP-1 medication are you currently taking?',
    doseMg: 'What was the strength of your last dose?',
    lastDoseDate: 'What was the approximate date of your last dose?',
    prescription: 'Please upload a copy of your current prescription',

    // Consultation Preference
    state: 'Which state do you prefer for consultation?',
    consultationType: 'What is your preferred consultation type?',
  };

  // Keys to skip from nested processing
  const skipNestedKeys = ['basicInfo', 'userDetails', 'productSelection'];

  for (const [sectionKey, sectionValue] of Object.entries(formData)) {
    // Handle string, number, or array values
    if (
      typeof sectionValue === 'string' ||
      typeof sectionValue === 'number' ||
      Array.isArray(sectionValue)
    ) {
      const questionData = findQuestionFromConfig(sectionKey, formConfig);
      const answer = formatAnswer(sectionValue);

      if (questionData && isValidAnswer(answer)) {
        if (isPrimitive(answer)) {
          questions.push({
            question: questionData.question,
            answer: String(answer),
            type: 'TEXT',
          });
        }

        if (Array.isArray(answer)) {
          if (questionData.component === 'FileUpload') {
            const formattedFiles = formatFilesForSubmission(answer);
            questions.push({
              question: questionData.question,
              answer: formattedFiles,
              type: 'FILE',
            });
          } else {
            const componentType = questionData.component || '';
            questions.push({
              question: questionData.question,
              answer: answer,
              options:
                questionData?.props?.options?.map((elem: any) => elem.value) ||
                [],
              type:
                questionTypes[componentType as keyof typeof questionTypes] ||
                'MULTISELECT',
            });
          }
        }
      }
    }
    // Handle nested objects (like bmiCalculator, currentGLP1Medication)
    else if (
      typeof sectionValue === 'object' &&
      sectionValue !== null &&
      !Array.isArray(sectionValue)
    ) {
      // Skip specific nested keys
      if (skipNestedKeys.includes(sectionKey)) continue;

      // Special handling for bmiCalculator
      if (sectionKey === 'bmiCalculation') {
        const bmiData = sectionValue as Record<string, any>;

        // Add age question separately
        if (bmiData.age) {
          questions.push({
            question: 'What is your age?',
            answer: String(bmiData.age),
            type: 'TEXT',
          });
        }

        // Combine height, weight, bmi into single object
        if (bmiData.feet !== undefined || bmiData.weight || bmiData.bmi) {
          // Format height from feet and inches
          let heightFormatted = '';
          if (bmiData.feet !== undefined) {
            const feet = bmiData.feet || 0;
            const inches = bmiData.inches || 0;
            heightFormatted = `${feet}'${inches}"`;
          }

          const bmiObject = {
            ...(heightFormatted && { height: heightFormatted }),
            ...(bmiData.weight && { weight: String(bmiData.weight) }),
            ...(bmiData.bmi && { bmi: String(bmiData.bmi) }),
          };

          questions.push({
            question: 'What is your height and weight?',
            answer: bmiObject as any,
            type: 'WIDGET_BMI',
          });
        }
        continue;
      }

      // Get question config to check component type
      const questionData = findQuestionFromConfig(sectionKey, formConfig);

      // Generic handling for composite components
      const compositeComponents = [
        'MultiSelectWithText',
        'DropdownWithMultiSelect',
        'MultiSelectWithDropdowns',
        'CheckboxAgreements',
      ];

      // Helper function to process composite component fields
      const processCompositeField = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fieldValue: any,
        fieldNumber: number,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props: any
      ) => {
        const questionKey = `question${
          fieldNumber === 1 ? 'One' : fieldNumber === 2 ? 'Two' : 'Three'
        }`;
        const optionsKey = `options${
          fieldNumber === 1 ? 'One' : fieldNumber === 2 ? 'Two' : 'Three'
        }`;

        // Handle array fields (MultiSelect)
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          questions.push({
            question: props[questionKey] || '',
            answer: fieldValue,
            options: props[optionsKey]?.map((elem: any) => elem.value) || [],
            type: 'MULTISELECT',
          });
        }
        // Handle string fields (Dropdown/TextInput/Checkbox)
        else if (typeof fieldValue === 'string' && fieldValue.trim()) {
          const answer = fieldValue.trim();
          const questionText = props[questionKey];
          const options = props[optionsKey]?.map((elem: any) => elem.value);

          if (questionText) {
            // Remove HTML tags from questionText for clean question text (for CheckboxAgreements)
            const cleanQuestionText = questionText
              .replace(/<br\s*\/?>/gi, ' ')
              .replace(/<[^>]*>/g, '')
              .trim();

            questions.push({
              question: cleanQuestionText,
              answer,
              ...(options && { options }),
              type: options ? 'SINGLESELECT' : 'TEXT',
            });
          }
        }
      };

      if (
        questionData &&
        compositeComponents.includes(questionData.component as string)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataValue = sectionValue as Record<string, any>;

        if (questionData.props) {
          // Process each field (fieldOne, fieldTwo, fieldThree)
          ['fieldOne', 'fieldTwo', 'fieldThree'].forEach((fieldName, index) => {
            if (
              dataValue[fieldName] !== undefined &&
              dataValue[fieldName] !== null
            ) {
              processCompositeField(
                dataValue[fieldName],
                index + 1,
                questionData.props
              );
            }
          });
        }
        continue;
      }

      // Iterate through nested object properties for other objects
      for (const [nestedKey, nestedValue] of Object.entries(sectionValue)) {
        const nestedAnswer = formatAnswer(nestedValue);

        // Get question from mapping
        const questionText = nestedFieldQuestions[nestedKey];

        if (questionText && isValidAnswer(nestedAnswer)) {
          if (isPrimitive(nestedAnswer)) {
            questions.push({
              question: questionText,
              answer: String(nestedAnswer),
              type: 'TEXT',
            });
          }

          if (Array.isArray(nestedAnswer)) {
            if (nestedKey === 'prescription') {
              const formattedFiles = formatFilesForSubmission(nestedAnswer);
              questions.push({
                question: questionText,
                answer: formattedFiles,
                type: 'FILE',
              });
            } else {
              questions.push({
                question: questionText,
                answer: nestedAnswer,
                type: 'MULTISELECT',
              });
            }
          }
        }
      }
    }
  }

  return { questions };
};
