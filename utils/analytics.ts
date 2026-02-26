export type FunnelStage =
  | 'awareness'
  | 'interest'
  | 'consideration'
  | 'evaluation'
  | 'purchase'
  | 'retention';

type BasePageMetadata = {
  name?: string;
  path?: string;
  stage?: FunnelStage;
  step?: string;
  variant?: string;
  category?: string;
  campaignId?: string;
  experimentId?: string;
};

export type PageViewPayload = BasePageMetadata & {
  title?: string;
  source?: string;
};

export type InteractionPayload = BasePageMetadata & {
  action: string;
  label?: string;
  value?: string | number;
  elementId?: string;
};

export type FormProgressPayload = BasePageMetadata & {
  formId: string;
  field?: string;
  status: 'start' | 'advance' | 'complete' | 'error' | 'abandon';
  errorCode?: string;
};

export type PurchaseItem = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
};

export type PurchasePayload = BasePageMetadata & {
  transactionId: string;
  value: number;
  currency?: string;
  items?: PurchaseItem[];
};

export const buildPageViewEvent = (payload: PageViewPayload) => ({
  event: 'page_view',
  page: {
    name: payload.name,
    title: payload.title,
    path: payload.path,
    stage: payload.stage,
    step: payload.step,
    variant: payload.variant,
    category: payload.category,
    campaignId: payload.campaignId,
    experimentId: payload.experimentId,
    source: payload.source,
  },
});

export const buildInteractionEvent = (payload: InteractionPayload) => ({
  event: 'interaction',
  action: payload.action,
  label: payload.label,
  value: payload.value,
  elementId: payload.elementId,
  context: {
    stage: payload.stage,
    step: payload.step,
    name: payload.name,
    category: payload.category,
    campaignId: payload.campaignId,
    experimentId: payload.experimentId,
    path: payload.path,
  },
});

export const buildFormProgressEvent = (payload: FormProgressPayload) => ({
  event: 'form_progress',
  formId: payload.formId,
  field: payload.field,
  status: payload.status,
  errorCode: payload.errorCode,
  context: {
    stage: payload.stage,
    step: payload.step,
    name: payload.name,
    campaignId: payload.campaignId,
    experimentId: payload.experimentId,
    path: payload.path,
  },
});

export const buildPurchaseEvent = (payload: PurchasePayload) => ({
  event: 'purchase',
  transactionId: payload.transactionId,
  value: payload.value,
  currency: payload.currency ?? 'USD',
  items: payload.items,
  context: {
    stage: payload.stage,
    step: payload.step,
    name: payload.name,
    campaignId: payload.campaignId,
    experimentId: payload.experimentId,
    path: payload.path,
  },
});