/**
 * API Response Models
 * Defines standardized response types for API calls
 */

/**
 * Response Type Enum
 */
export enum ResponseType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

/**
 * App Error Codes
 * - 4xx: Client errors (bad request, auth, permissions, not found, conflict, rate limit)
 * - 500: Internal server error
 * - 502: Upstream unreachable
 * - 503: Service unavailable
 * - 504: Upstream timeout
 * - 600: No data / Unknown error
 */
export type AppErrorCode =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 429
  | 500
  | 502
  | 503
  | 504
  | 600;

/**
 * Generic API Response structure
 */
export type ApiResp<T> =
  | {
      ok: true;
      code: 200;
      message: string;
      data: T;
    }
  | {
      ok: false;
      code: AppErrorCode;
      message: string;
      data: null;
    };

/**
 * Organization Variables (Full structure from GraphQL)
 */
export interface OrgVariables {
  id: string;
  organizationId: string;
  linkName: string;
  monthlyCost?: number;
  tagline?: string;
  allowSelfSignup: boolean;
  enableSelfSignupPayment: boolean;
  referralCodeEnabled: boolean;
  showCarouselPrices: boolean;
  showTestimonials: boolean;
  organizationDomainName?: string;
  organizationDomainLink?: string;
  homeLink?: string;
  enableLegitScriptLogo: boolean;
  legitScriptIntegrationId?: string;
  membersAreaLink?: string;
  orderStatusLink?: string;
  instructionsLink?: string;
  supportLink?: string;
  videoLink?: string;
  affiliateLink?: string;
  contactEmail?: string;
  contactPhone?: string;
  termsOfServicesLink?: string;
  privacyPolicyLink?: string;
  fulfillmentPolicyLink?: string;
  jotformLink?: string;
  organizationName: string;
  medicalConsentLink?: string;
  forCaliforniaResidentsLink?: string;
  billOfRightsLink?: string;

  // Color configurations
  colorPrimary?: string;
  colorFaqGradientBottom?: string;

  // Primary medication text
  primaryMedicationTitleText?: string;
  primaryMedicationLargeTitleTextColor?: string;
  primaryMedicationTitleTextColor?: string;
  primaryMedicationSubtitle1Text?: string;
  primaryMedicationSubtitle1TextColor?: string;
  primaryMedicationSubtitle2Text?: string;
  primaryMedicationSubtitle2TextColor?: string;

  // CTA button
  seeIfIQualifyButtonText?: string;
  seeIfIQualifyButtonTextColor?: string;
  seeIfIQualifyButtonColor?: string;

  // Journey section
  journeyHeadingTextColor?: string;
  journeyItem1TitleText?: string;
  journeyItem1TitleTextColor?: string;
  journeyItem1SubtitleText?: string;
  journeyItem1SubtitleTextColor?: string;
  journeyItem2TitleText?: string;
  journeyItem2TitleTextColor?: string;
  journeyItem2SubtitleText?: string;
  journeyItem2SubtitleTextColor?: string;
  journeyItem3TitleText?: string;
  journeyItem3TitleTextColor?: string;
  journeyItem3SubtitleText?: string;
  journeyItem3SubtitleTextColor?: string;

  // Secondary medication
  secondaryMedicationTitleText?: string;
  secondaryMedicationTitleTextColor?: string;
  secondaryMedicationBodyText?: string;
  secondaryMedicationMainBodyTextColor?: string;
  secondaryMedicationBodyTextColor?: string;

  // Product payment
  productPaymentLabelText?: string;
  productPaymentLabelTextColor?: string;

  // Success messages
  signupSuccessMessageText?: string;
  signupSuccessMessageTextColor?: string;
  paymentSuccessMessageText?: string;
  paymentSuccessMessageTextColor?: string;
  attachPaymentInfoSuccessText?: string;

  // UI colors
  logosHeadingTextColor?: string;
  logosColor?: string;
  faqTitleTextColor?: string;
  faqBodyTextColor?: string;
  complianceLogosTitleTextColor?: string;
  headerLinksTextColor?: string;
  footerLinksTextColor?: string;
  copyrightTextColor?: string;
  legalLinksTextColor?: string;
  carouselProductTextColor?: string;
  productCategoriesColor?: string;

  // Additional settings
  addHomeLinkToHeader: boolean;
  homeLinkName?: string;
  showLogos: boolean;
  selfSignUpProfileFields?: string;
  selfSignUpSmsNotificationsRequired: boolean;
  hideSeeIfQualifyBtn: boolean;
  journeyTitleText?: string;
  useModalForSignup: boolean;
  formHeaderColor?: string;
  formHeaderText?: string;
  showProductCategoriesInLandingPage: boolean;
  showGDPRLogo: boolean;
  autoCreateUserPromoCodes: boolean;
  masterUserPromoCodeId?: string;
  paymentProvider?: string;
  nmiCollectJsPublicKey?: string;

  // Related data
  form?: FormData;
  faq?: FAQ[];
  productBundles?: ProductBundle[];
  defaultProductBundle?: ProductBundle;
  visiblePromoCodes?: PromoCode[];
  analyticsPromoCodes?: PromoCode[];
}

/**
 * Form Data Structure
 */
export interface FormData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  versionId: string;
  versionNumber: number;
  showStepsIndividually: boolean;
  organization: {
    id: string;
  };
  questions: FormQuestion[];
}

/**
 * Form Question Structure
 */
export interface FormQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  isPHI: boolean;
  options?: any;
  renderMode?: string;
  index: number;
  condition?: {
    questionIndex: number;
    response: any;
  };
  document?: {
    id: string;
    fileName: string;
    isGlobal: boolean;
  };
}

/**
 * FAQ Structure
 */
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  index: number;
}

/**
 * Product Bundle Structure
 */
export interface ProductBundle {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceUnit: string;
  initialDiscount?: number;
  imageUrl?: string;
  linkName: string;
  tag?: string;
  isSoldOut: boolean;
  soldOutListText?: string;
  soldOutListColor?: string;
  soldOutModalText?: string;
  soldOutModalColor?: string;
  products: Product[];
  formVersion?: {
    forms: FormData[];
  };
}

/**
 * Product Structure
 */
export interface Product {
  name: string;
  imageUrl?: string;
  categories: {
    id: string;
  }[];
}

/**
 * Promo Code Structure
 */
export interface PromoCode {
  name: string;
  label: string;
  description?: string;
}

/**
 * Presigned URL Response Structure
 */
export interface PresignedUrlData {
  uploadUrl: string;
  downloadUrl: string;
  s3Key: string;
}

/**
 * External API Response Format (from backend)
 * Used to type responses from Care360 API
 */
export interface ExternalApiResponse<T = unknown> {
  // New REST API format
  status?: number;
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  // Legacy GraphQL format
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
      errorCode?: string;
    };
  }>;
}
