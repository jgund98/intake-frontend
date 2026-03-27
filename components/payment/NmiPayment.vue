<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFormStore } from '~/stores/intakeFormStore';
import { useUiStore } from '~/stores/uiStore';
import { usePromoCode } from '~/composables/usePromoCode';
import TextInput from '~/components/ui/TextInput.vue';
import SingleSelect from '~/components/ui/SingleSelect.vue';
import Dropdown from '~/components/ui/Dropdown.vue';
import { useRuntimeConfig } from '#imports';
import { $fetch } from 'ofetch';

const {
  public: { privacyPolicy },
} = useRuntimeConfig();

const config = useRuntimeConfig();
const route = useRoute();
const formStore = useFormStore();
const uiStore = useUiStore();

// Promo code composable
const {
  promoCodeData,
  loading: promoCodeLoading,
  error: promoCodeError,
  isApplied: isPromoCodeApplied,
  applyPromoCode,
  clearPromoCode,
} = usePromoCode();

// US States list
const usStates = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

// Dropdown options
const stateOptions = usStates.map(state => ({
  label: state.name,
  value: state.code,
}));

const countryOptions = [{ label: 'United States', value: 'US' }];

// US Postal code validation regex (5 digits or 5+4 format: 12345 or 12345-6789)
const postalCodeRegex = /^(\d{5}|\d{5}-\d{4})$/;

// Emits
const emit = defineEmits<{
  paymentReady: [data: PaymentData];
  error: [message: string];
  back: [];
  discountApplied: [discount: { amount: number; finalPrice: number }];
}>();

// Payment Data Interface
interface PaymentData {
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
  promoCode: string;
}

// Initialize form state with cardholder name from form store
const getInitialCardholderName = () => {
  const userDetails = (formStore.formData?.userDetails || {}) as any;
  const firstName = userDetails?.firstName || '';
  const lastName = userDetails?.lastName || '';
  return `${firstName} ${lastName}`.trim();
};

// Form state - using object structure for TextInput and Dropdown
const formData = ref({
  cardholderName: getInitialCardholderName(),
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'US', // Default to US
  postalCode: '',
  promoCode: '',
});
const consentChecked = ref(false);

// Promo code state
const promoCodeInput = ref('');

// Watch for postal code changes - validate in real-time
watch(
  formData,
  newValue => {
    const trimmed = newValue.postalCode?.trim() || '';
    if (trimmed === '') {
      // Clear error if empty (required validation happens on submit)
      delete errors.value.postalCode;
    } else if (!postalCodeRegex.test(trimmed)) {
      errors.value.postalCode =
        'Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)';
    } else {
      delete errors.value.postalCode;
    }
  },
  { deep: true }
);

// Watch for promo code input changes - clear applied state if user modifies the code
watch(promoCodeInput, newValue => {
  // If promo code was applied and user changes it to a different code, clear the applied state
  const trimmedNewValue = newValue.trim();
  const appliedCode = formData.value.promoCode.trim();

  if (
    isPromoCodeApplied.value &&
    trimmedNewValue !== appliedCode &&
    trimmedNewValue !== ''
  ) {
    clearPromoCode();
    formData.value.promoCode = '';
    // Clear discount from store
    formStore.setPromoDiscount(null);
  }
});

// Component state
const isNmiReady = ref(false);
const isNmiLoading = ref(true);
const errors = ref<Record<string, string>>({});

// NMI field validation state
const cardFieldsValid = ref({
  ccnumber: false,
  ccexp: false,
  cvv: false,
});

// Individual card field errors
const cardFieldErrors = ref({
  ccnumber: '',
  ccexp: '',
  cvv: '',
});

// Props
const props = defineProps<{
  totalPrice: number;
}>();

// Computed: Discount amount
const discountAmount = computed(() => {
  if (!isPromoCodeApplied.value || !promoCodeData.value) return 0;

  if (promoCodeData.value.flatDiscount !== undefined) {
    return promoCodeData.value.flatDiscount;
  }

  if (promoCodeData.value.percentDiscount !== undefined) {
    return (props.totalPrice * promoCodeData.value.percentDiscount) / 100;
  }

  return 0;
});

// Computed: Final price after discount
const finalPrice = computed(() => {
  return Math.max(0, props.totalPrice - discountAmount.value);
});

// Check if all card fields are valid
const areCardFieldsValid = computed(() => {
  return (
    cardFieldsValid.value.ccnumber &&
    cardFieldsValid.value.ccexp &&
    cardFieldsValid.value.cvv
  );
});

// Check if promo code needs to be applied
const isPromoCodePending = computed(() => {
  // If user has entered a promo code but hasn't applied it yet
  return promoCodeInput.value.trim() !== '' && !isPromoCodeApplied.value;
});

// Check if form is valid
const isFormValid = computed(() => {
  return (
    formData.value.cardholderName.trim() !== '' &&
    formData.value.addressLine1.trim() !== '' &&
    formData.value.city.trim() !== '' &&
    formData.value.state.trim() !== '' &&
    formData.value.country.trim() !== '' &&
    formData.value.postalCode.trim() !== '' &&
    postalCodeRegex.test(formData.value.postalCode.trim()) && // Valid US ZIP format
    consentChecked.value &&
    isNmiReady.value &&
    areCardFieldsValid.value &&
    !isPromoCodePending.value // Promo code must be applied if entered
  );
});

// NMI CollectJS initialization
const initializeCollectJS = () => {
  const script = document.createElement('script');
  script.src = 'https://secure.networkmerchants.com/token/Collect.js';
  script.setAttribute(
    'data-tokenization-key',
    config.public.nmiCollectJSKey as string
  );
  script.setAttribute('data-variant', 'inline');
  script.async = true;

  script.onload = () => {
    const checkCollectJS = window.setInterval(() => {
      if (window.CollectJS) {
        window.clearInterval(checkCollectJS);
        configureCollectJS();
      }
    }, 100);
  };

  script.onerror = () => {
    isNmiLoading.value = false;
    const errorMsg = 'Failed to load payment system. Please refresh the page.';
    errors.value.nmi = errorMsg;
    emit('error', errorMsg);

    // ERROR: Log to server
    logNmiErrorToServer('initialization', errorMsg, {
      scriptSrc: script.src,
    });
  };

  document.head.appendChild(script);
};

// Configure CollectJS
const configureCollectJS = () => {
  if (!window.CollectJS) return;

  window.CollectJS.configure({
    variant: 'inline',
    styleSniffer: false,
    fields: {
      ccnumber: {
        selector: '#nmi-cc-number',
        title: 'Card Number',
        placeholder: '1234 1234 1234 1234',
      },
      ccexp: {
        selector: '#nmi-cc-exp',
        title: 'Expiration Date',
        placeholder: 'MM / YY',
      },
      cvv: {
        selector: '#nmi-cc-cvv',
        title: 'CVV',
        placeholder: 'CVC',
      },
    },
    customCss: {
      'font-family': 'var(--font-lora)',
      'font-size': '1rem',
      'font-weight': 'var(--font-weight-regular)',
      color: 'var(--color-gray-1)',
      padding: '0 12px',
      margin: '0',
      border: 'none',
      'border-radius': '0',
      'line-height': 'normal',
      height: '42px',
      'box-sizing': 'border-box',
      outline: 'none',
    },
    focusCss: {
      'font-family': 'var(--font-lora)',
      'font-size': '1rem',
      'font-weight': 'var(--font-weight-regular)',
      color: 'var(--color-gray-1)',
      padding: '0 12px',
      margin: '0',
      border: 'none',
      'border-radius': '0',
      'line-height': 'normal',
      height: '42px',
      'box-sizing': 'border-box',
      outline: 'none',
      'box-shadow': 'none',
    },
    invalidCss: {
      color: '#ef4444',
    },
    validCss: {
      color: 'var(--color-gray-1)',
    },
    placeholderCss: {
      color: 'var(--color-gray-6)',
      'font-weight': 'var(--font-weight-regular)',
    },
    callback: (response: any) => {
      if (response.token) {
        // SUCCESS: Log to server
        logNmiSuccessToServer(response.token);
        handleTokenSuccess(response.token);
      } else {
        // Stop loader on error
        uiStore.stop();
        const errorMsg = 'Invalid card information. Please check your details.';
        errors.value.card = errorMsg;
        emit('error', errorMsg);

        // ERROR: Log to server
        logNmiErrorToServer('tokenization', errorMsg, {
          responseMessage: response?.message,
          responseError: response?.error,
        });
      }
    },
    fieldsAvailableCallback: () => {
      isNmiReady.value = true;
      isNmiLoading.value = false;
    },
    validationCallback: (field: string, status: boolean, message: string) => {
      // Update field validation state
      if (field === 'ccnumber' || field === 'ccexp' || field === 'cvv') {
        cardFieldsValid.value[field] = status;

        // Set individual field error messages
        if (!status) {
          // Map NMI messages to user-friendly messages
          let errorMessage = '';

          if (field === 'ccnumber') {
            if (message === 'Field is empty') {
              errorMessage = 'Card number is required';
            } else if (message && message.toLowerCase().includes('invalid')) {
              errorMessage = 'Please enter a valid card number';
            } else if (message) {
              errorMessage = message;
            } else {
              errorMessage = 'Card number is required';
            }
            cardFieldErrors.value.ccnumber = errorMessage;
          } else if (field === 'ccexp') {
            if (message === 'Field is empty') {
              errorMessage = 'Expiration date is required';
            } else if (message && message.toLowerCase().includes('expired')) {
              errorMessage = 'Card has expired';
            } else if (message && message.toLowerCase().includes('invalid')) {
              errorMessage = 'Please enter a valid expiration date (MM/YY)';
            } else if (message) {
              errorMessage = message;
            } else {
              errorMessage = 'Expiration date is required';
            }
            cardFieldErrors.value.ccexp = errorMessage;
          } else if (field === 'cvv') {
            if (message === 'Field is empty') {
              errorMessage = 'CVV is required';
            } else if (message && message.toLowerCase().includes('invalid')) {
              errorMessage = 'Please enter a valid CVV';
            } else if (message) {
              errorMessage = message;
            } else {
              errorMessage = 'CVV is required';
            }
            cardFieldErrors.value.cvv = errorMessage;
          }
        } else {
          cardFieldErrors.value[field] = '';
        }
      }
    },
  });
};

// Handle successful tokenization
const handleTokenSuccess = (token: string) => {
  const paymentData: PaymentData = {
    nmiPaymentToken: token,
    cardholderName: formData.value.cardholderName,
    shippingAddress: {
      addressLine1: formData.value.addressLine1,
      addressLine2: formData.value.addressLine2,
      city: formData.value.city,
      state: formData.value.state,
      country: formData.value.country,
      postalCode: formData.value.postalCode,
    },
    promoCode: formData.value.promoCode,
  };

  // Emit payment data to parent
  emit('paymentReady', paymentData);
};

// Form validation
const validateForm = (): boolean => {
  errors.value = {};

  if (!formData.value.cardholderName.trim()) {
    errors.value.cardholderName = 'Cardholder name is required';
  }

  if (!formData.value.addressLine1.trim()) {
    errors.value.addressLine1 = 'Address is required';
  }

  if (!formData.value.city.trim()) {
    errors.value.city = 'City is required';
  }

  if (!formData.value.state.trim()) {
    errors.value.state = 'State is required';
  }

  if (!formData.value.country.trim()) {
    errors.value.country = 'Country is required';
  }

  if (!formData.value.postalCode.trim()) {
    errors.value.postalCode = 'Postal code is required';
  } else if (!postalCodeRegex.test(formData.value.postalCode.trim())) {
    errors.value.postalCode =
      'Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)';
  }

  if (!consentChecked.value) {
    errors.value.consent = 'You must agree to the terms to proceed';
  }

  return Object.keys(errors.value).length === 0;
};

// Helper function to get customer info
const getCustomerInfo = () => {
  const customerData = (formStore.formData?.customerInformation || {}) as any;
  return {
    email: customerData.email || '',
    firstName: customerData.firstname || '',
    lastName: customerData.lastname || '',
    fullName:
      `${customerData.firstname || ''} ${customerData.lastname || ''}`.trim(),
  };
};

// Helper function to get product info
const getProductInfo = () => {
  const productSelection = formStore.formData?.productSelection as any;
  return {
    productId: productSelection?.bundleId || route.query.bundleid || '',
    price: productSelection?.totalPrice || 0,
  };
};

// Log NMI error to server
const logNmiErrorToServer = async (
  errorType: 'tokenization' | 'initialization' | 'validation',
  errorMessage: string,
  additionalContext: Record<string, any> = {}
) => {
  try {
    const customerInfo = getCustomerInfo();
    const productInfo = getProductInfo();

    await $fetch('/api/log-nmi-error', {
      method: 'POST',
      body: {
        errorType,
        errorMessage,
        productId: productInfo.productId,
        patientEmail: customerInfo.email,
        patientName: customerInfo.fullName,
        paymentAmount: productInfo.price,
        timestamp: new Date().toISOString(),
        organizationName: config.public.linkName || undefined,
        clientUrl: window.location.origin,
        additionalContext,
      },
    }).catch(err => {
      console.warn('Failed to log NMI error to server:', err);
    });
  } catch (err) {
    console.warn('Failed to log NMI error to server:', err);
  }
};

// Log NMI success to server
const logNmiSuccessToServer = async (paymentToken: string) => {
  try {
    const customerInfo = getCustomerInfo();
    const productInfo = getProductInfo();

    await $fetch('/api/log-nmi-success', {
      method: 'POST',
      body: {
        paymentToken,
        productId: productInfo.productId,
        patientEmail: customerInfo.email,
        patientName: customerInfo.fullName,
        paymentAmount: productInfo.price,
        timestamp: new Date().toISOString(),
        organizationName: config.public.linkName || undefined,
        clientUrl: window.location.origin,
      },
    }).catch(err => {
      console.warn('Failed to log NMI success to server:', err);
    });
  } catch (err) {
    console.warn('Failed to log NMI success to server:', err);
  }
};

// Handle promo code apply
const handleApplyPromoCode = async () => {
  if (!promoCodeInput.value.trim()) {
    return;
  }

  const productInfo = getProductInfo();

  if (!productInfo.productId) {
    // Show error if product ID is not available
    promoCodeError.value =
      'Product information not found. Please refresh and try again.';
    return;
  }

  const success = await applyPromoCode(
    promoCodeInput.value.trim(),
    productInfo.productId
  );

  if (success) {
    formData.value.promoCode = promoCodeInput.value.trim();
    // Store discount data in formStore
    formStore.setPromoDiscount(promoCodeData.value);
  }
};

// Handle form submission
const handleSubmit = () => {
  // Validate form fields
  if (!validateForm()) return;

  // Check if card fields are valid
  if (!areCardFieldsValid.value) {
    // Set error messages for invalid or empty fields if not already set by NMI
    if (!cardFieldsValid.value.ccnumber && !cardFieldErrors.value.ccnumber) {
      cardFieldErrors.value.ccnumber = 'Card number is required';
    }
    if (!cardFieldsValid.value.ccexp && !cardFieldErrors.value.ccexp) {
      cardFieldErrors.value.ccexp = 'Expiration date is required';
    }
    if (!cardFieldsValid.value.cvv && !cardFieldErrors.value.cvv) {
      cardFieldErrors.value.cvv = 'CVV is required';
    }
    return;
  }

  errors.value = {};
  // Clear individual card field errors before tokenization
  cardFieldErrors.value.ccnumber = '';
  cardFieldErrors.value.ccexp = '';
  cardFieldErrors.value.cvv = '';

  // Start loader immediately
  uiStore.start();

  // Trigger NMI tokenization
  if (window.CollectJS) {
    window.CollectJS.startPaymentRequest();
  } else {
    uiStore.stop();
    errors.value.nmi = 'Payment system not ready. Please refresh the page.';
  }
};

// Lifecycle
onMounted(() => {
  initializeCollectJS();
});

onUnmounted(() => {
  try {
    document
      .querySelectorAll('iframe[name^="CollectJSInline"]')
      .forEach(iframe => {
        iframe.remove();
      });
  } catch (error) {
    console.warn('Error cleaning up CollectJS:', error);
  }
});

// TypeScript declaration
/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    CollectJS: {
      configure: (options: {
        variant: string;
        styleSniffer: boolean;
        fields: any;
        customCss: any;
        focusCss?: any;
        invalidCss: any;
        validCss: any;
        placeholderCss: any;
        callback: (response: any) => void;
        fieldsAvailableCallback: () => void;
        validationCallback?: (
          field: string,
          status: boolean,
          message: string
        ) => void;
      }) => void;
      startPaymentRequest: () => void;
    };
  }
}
/* eslint-enable no-unused-vars */
</script>

<template>
  <div class="nmi-payment-component">
    <!-- Header -->
    <div class="mb-7">
      <div class="flex items-center gap-2 mb-2">
        <NuxtImg
          src="/icons/lock-primary.svg"
          alt="Secure"
          class="w-6 h-6 icon-primary"
        />
        <h1 class="h3 font-bold font-domin text-gray-1">Secure Payment</h1>
      </div>
      <p class="text-gray-11 body2">Complete your purchase securely with NMI</p>

      <!-- Trust Badges Row -->
      <div
        class="flex flex-wrap justify-start gap-4 mt-4 text-xs text-gray-600"
      >
        <div class="flex items-center gap-1.5">
          <NuxtImg
            src="/icons/lock.svg"
            alt="SSL"
            width="14"
            height="14"
            class="w-3.5 h-3.5 opacity-70"
          />
          <span>256-bit SSL</span>
        </div>
        <div class="flex items-center gap-1.5">
          <NuxtImg
            src="/icons/shield.svg"
            alt="Secure"
            width="14"
            height="14"
            class="w-3.5 h-3.5 opacity-70"
          />
          <span>Secure Checkout</span>
        </div>
        <div class="flex items-center gap-1.5">
          <NuxtImg
            src="/icons/credit-card.svg"
            alt="PCI"
            width="14"
            height="14"
            class="w-3.5 h-3.5 opacity-70"
          />
          <span>PCI Compliant</span>
        </div>
      </div>
    </div>

    <!-- Payment Form -->
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Cardholder Name -->
      <div>
        <label class="block caption !font-semibold text-gray-2 mb-2">
          Cardholder name
        </label>
        <TextInput
          v-model="formData"
          field-name="cardholderName"
          placeholder="Full name on card"
          :required="true"
          :is-primary="false"
          :error-message="'Cardholder name is required'"
          class="bg-white rounded-input"
        />
      </div>

      <!-- Card Information -->
      <div>
        <label class="block caption !font-semibold text-gray-2 mb-2">
          Card information
        </label>

        <!-- Loading State -->
        <div v-if="isNmiLoading" class="space-y-2">
          <div class="skeleton-loader h-10 rounded-input"></div>
          <div class="grid grid-cols-2 gap-2">
            <div class="skeleton-loader h-10 rounded-input"></div>
            <div class="skeleton-loader h-10 rounded-input"></div>
          </div>
        </div>

        <!-- NMI Card Fields -->
        <div v-show="!isNmiLoading" class="flex flex-col md:flex-row gap-2">
          <!-- Card Number -->
          <div class="flex-1">
            <div
              id="nmi-cc-number"
              class="nmi-card-field"
              :class="{
                'border-red-500 focus-within:ring-red-500':
                  cardFieldErrors.ccnumber,
              }"
            />
            <p
              v-if="cardFieldErrors.ccnumber"
              class="text-red-500 caption !font-semibold mt-1.5"
            >
              {{ cardFieldErrors.ccnumber }}
            </p>
          </div>
          <!-- Expiry and CVV (grouped on mobile) -->
          <div class="flex gap-2 md:contents">
            <!-- Expiry -->
            <div class="flex-1 md:w-32">
              <div
                id="nmi-cc-exp"
                class="nmi-card-field"
                :class="{
                  'border-red-500 focus-within:ring-red-500':
                    cardFieldErrors.ccexp,
                }"
              />
              <p
                v-if="cardFieldErrors.ccexp"
                class="text-red-500 caption !font-semibold mt-1.5"
              >
                {{ cardFieldErrors.ccexp }}
              </p>
            </div>
            <!-- CVV -->
            <div class="flex-1 md:w-24">
              <div
                id="nmi-cc-cvv"
                class="nmi-card-field"
                :class="{
                  'border-red-500 focus-within:ring-red-500':
                    cardFieldErrors.cvv,
                }"
              />
              <p
                v-if="cardFieldErrors.cvv"
                class="text-red-500 caption !font-semibold mt-1.5"
              >
                {{ cardFieldErrors.cvv }}
              </p>
            </div>
          </div>
        </div>

        <!-- General card errors (tokenization failures) -->
        <p
          v-if="errors.card"
          class="text-red-500 caption !font-semibold mt-1.5"
        >
          {{ errors.card }}
        </p>
        <p v-if="errors.nmi" class="text-red-500 caption !font-semibold mt-1.5">
          {{ errors.nmi }}
        </p>
      </div>

      <!-- Security Assurance Section -->
      <div class="bg-primary-dark-1 rounded-xl p-4 mt-4">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <NuxtImg
              src="/icons/shield-primary.svg"
              alt="Protected"
              width="20"
              height="20"
              class="w-5 h-5 flex-shrink-0 mt-0.5 icon-primary"
            />
            <p class="text-sm font-medium text-gray-900">
              Your payment is protected
            </p>
          </div>
          <ul class="text-xs text-gray-600 mt-1 space-y-0.5 list-disc pl-5">
            <li>256-bit SSL encryption on all transactions</li>
            <li>Your card details never touch our servers</li>
            <li>Trusted by 10,000+ customers</li>
          </ul>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-gray-border-light/50"></div>

      <!-- Shipping Address -->
      <div>
        <label class="block body2 !font-medium text-gray-11 mb-4">
          Shipping address
        </label>

        <!-- Address Line 1 -->
        <div class="mb-3">
          <label class="block caption !font-semibold text-gray-2 mb-1.5">
            Address Line 1
          </label>
          <TextInput
            v-model="formData"
            field-name="addressLine1"
            placeholder="Street address"
            :required="true"
            :is-primary="false"
            :error-message="'Address is required'"
            class="bg-white rounded-input"
          />
        </div>

        <!-- Address Line 2 -->
        <div class="mb-3">
          <label class="block caption !font-semibold text-gray-2 mb-1.5">
            Address Line 2 (Optional)
          </label>
          <TextInput
            v-model="formData"
            field-name="addressLine2"
            placeholder="Apartment, suite, etc."
            :required="false"
            :is-primary="false"
            class="bg-white rounded-input"
          />
        </div>

        <!-- City, State, Country, Postal -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <!-- City -->
          <div>
            <label class="block caption !font-semibold text-gray-2 mb-1.5">
              City
            </label>
            <TextInput
              v-model="formData"
              field-name="city"
              placeholder="City"
              :required="true"
              :is-primary="false"
              :error-message="'City is required'"
              class="bg-white rounded-input"
            />
          </div>

          <!-- State -->
          <div>
            <label class="block caption !font-semibold text-gray-2 mb-1.5">
              State
            </label>
            <SingleSelect
              v-model="formData"
              field-name="state"
              :options="stateOptions"
              :placeholder="'Select State'"
              :required="true"
              :is-primary="false"
              :error-message="'State is required'"
              class="bg-white rounded-input"
            />
          </div>

          <!-- Country -->
          <div>
            <label class="block caption !font-semibold text-gray-2 mb-1.5">
              Country
            </label>
            <Dropdown
              v-model="formData"
              field-name="country"
              :options="countryOptions"
              placeholder="Select Country"
              :required="true"
              :is-primary="false"
              :error-message="'Country is required'"
              class="bg-white rounded-input"
            />
          </div>

          <!-- Postal Code -->
          <div>
            <label class="block caption !font-semibold text-gray-2 mb-1.5">
              Postal code
            </label>
            <TextInput
              v-model="formData"
              field-name="postalCode"
              placeholder="ZIP"
              :required="true"
              :is-primary="false"
              :error-message="'Postal code is required'"
              class="bg-white rounded-input"
            />
            <p
              v-if="errors.postalCode"
              class="text-red-500 caption !font-semibold mt-1"
            >
              {{ errors.postalCode }}
            </p>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-gray-border-light/50"></div>

      <!-- Promo Code -->
      <div>
        <label class="block caption !font-semibold text-gray-2 mb-2">
          Promo Code (Optional)
        </label>
        <div class="flex gap-2">
          <div class="flex-1">
            <input
              v-model="promoCodeInput"
              type="text"
              placeholder="Enter promo code"
              class="w-full h-[42px] px-3 border-2 border-gray-300 rounded-input bg-white shadow-sm transition-all duration-200 text-gray-1 font-lora"
              :class="{
                'border-green-500': isPromoCodeApplied,
                'border-red-500': promoCodeError,
              }"
              @keydown.enter.prevent="handleApplyPromoCode"
            />
          </div>
          <button
            type="button"
            class="px-6 py-2 rounded-full bg-primary text-white hover:bg-secondary disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm whitespace-nowrap"
            :disabled="!promoCodeInput.trim() || promoCodeLoading"
            @click="handleApplyPromoCode"
          >
            {{ promoCodeLoading ? 'Applying...' : 'Apply' }}
          </button>
        </div>

        <!-- Success message -->
        <p
          v-if="isPromoCodeApplied && promoCodeData"
          class="text-green-600 caption font-semibold! mt-2"
        >
          <template v-if="promoCodeData.flatDiscount">
            Promo code applied! ${{ promoCodeData.flatDiscount.toFixed(2) }}
            discount
          </template>
          <template v-else-if="promoCodeData.percentDiscount">
            Promo code applied! {{ promoCodeData.percentDiscount }}% discount
          </template>
        </p>

        <!-- Error message -->
        <p
          v-if="promoCodeError"
          class="text-red-500 caption font-semibold! mt-2"
        >
          {{ promoCodeError }}
        </p>

        <!-- Pending message (only show if no error) -->
        <p
          v-if="isPromoCodePending && !promoCodeError"
          class="text-orange-600 caption font-semibold! mt-2"
        >
          Please click "Apply" to use this promo code
        </p>
      </div>

      <!-- Consent Checkbox -->
      <div
        class="p-4 rounded-xl border-2 bg-accent-bg-light border-accent-yellow"
      >
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            v-model="consentChecked"
            type="checkbox"
            class="w-5 h-5 mt-0.5 rounded border-2 border-yellow-400 text-primary focus:ring-yellow-400 focus:ring-offset-0 cursor-pointer accent-yellow-400"
          />
          <span class="body2 text-accent-dark !font-medium">
            <span class="font-bold">I understand and agree:</span>
            There is an
            <span class="font-bold"> $80 Telehealth consultation fee</span>
            that will be charged regardless of whether I receive a prescription.
            A licensed provider will review my intake form to determine if I'm a
            candidate for the prescribed medication. By checking this box and
            proceeding with payment, I also agree to the
            <a
              :href="(privacyPolicy as string) || '#'"
              target="_blank"
              class="underline"
              >Privacy Policy</a
            >.
          </span>
        </label>
        <p v-if="errors.consent" class="text-red-500 caption mt-2 ml-7">
          {{ errors.consent }}
        </p>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center gap-4 pt-4">
        <button
          class="group w-12 h-12 md:px-6 md:py-3 md:w-auto xl:h-auto rounded-full bg-white flex items-center justify-center border-2 border-gray-border-dark hover:border-primary hover:text-primary transition-all duration-200 flex-shrink-0 md:gap-2 md:subtitle1 md:font-medium text-gray-1 cursor-pointer"
          @click="emit('back')"
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
          id="checkout"
          type="submit"
          :disabled="!isFormValid"
          class="flex-1 min-w-0 w-0 px-6 py-3 rounded-full bg-primary text-white hover:bg-secondary disabled:bg-primary-light disabled:cursor-not-allowed transition-all duration-200 subtitle1 font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <NuxtImg
            src="/icons/lock.svg"
            alt="Secure"
            width="20"
            height="20"
            class="w-5 h-5 icon-white"
          />
          <span>Pay ${{ finalPrice.toFixed(2) }}</span>
          <NuxtImg
            src="/icons/chevron-right.svg"
            alt="Continue"
            width="20"
            height="20"
            class="w-5 h-5 icon-white"
          />
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Skeleton loader animation */
.skeleton-loader {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* NMI Card Field - matches TextInput styling exactly */
.nmi-card-field {
  height: 42px;
  border: 2px solid #d1d5db; /* border-gray-300 */
  border-radius: var(--radius-input);
  background-color: var(--color-background);
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
}

/* Error state for card fields */
.nmi-card-field.border-red-500 {
  border-color: #ef4444;
}

/* CollectJS iframe styling */
:deep(.nmi-card-field iframe) {
  flex: 1;
  height: 100% !important;
  width: 100% !important;
  border: none !important;
  background: transparent !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>
