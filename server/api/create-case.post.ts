/**
 * API Route: Create Patient Case
 *
 * This endpoint creates a patient case by calling the external API.
 * Requires organization key for authentication.
 */
import { defineEventHandler, readBody, setHeader } from 'h3';
import { $fetch } from 'ofetch';
import { useRuntimeConfig } from '#imports';
import { createApiResponse } from '~/server/lib/appErrors';
import {
  ResponseType,
  type ApiResp,
  type ExternalApiResponse,
} from '~/models/apiResponse.model';
import {
  sendSlackNotification,
  formatErrorDetails,
  type SlackField,
} from '../utils/slack';

interface CaseCreationResponse {
  caseId: string;
  formResponseId: string;
  paymentId?: string;
  [key: string]: any;
}

export default defineEventHandler(
  async (event): Promise<ApiResp<CaseCreationResponse>> => {
    try {
      const body = await readBody(event);
      const { patientCaseData } = body;

      if (!patientCaseData) {
        return createApiResponse<CaseCreationResponse>(
          event,
          { errors: [{ extensions: { code: 'BAD_REQUEST' } }] },
          null,
          ResponseType.ERROR
        );
      }

      const config = useRuntimeConfig(event);
      const graphQlUrl = config.graphqlApiUrl;
      const organizationKey = config.care360Token;

      if (!graphQlUrl) {
        return createApiResponse<CaseCreationResponse>(
          event,
          { errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
          null,
          ResponseType.ERROR
        );
      }

      if (!organizationKey) {
        return createApiResponse<CaseCreationResponse>(
          event,
          { errors: [{ extensions: { code: 'UNAUTHORIZED' } }] },
          null,
          ResponseType.ERROR
        );
      }

      setHeader(event, 'Content-Type', 'application/json');

      const response = await $fetch<ExternalApiResponse<CaseCreationResponse>>(
        `${graphQlUrl}/api/v1/dynamic-case`,
        {
          method: 'POST',
          headers: {
            'cv-api-key': organizationKey,
            'Content-Type': 'application/json',
          },
          body: patientCaseData,
          timeout: 30000,
        }
      );

      // Check for new REST API error format (success: false)
      if (response?.success === false) {
        return createApiResponse<CaseCreationResponse>(
          event,
          response,
          null,
          ResponseType.ERROR
        );
      }

      const caseData = response?.data;

      // Fallback for legacy GraphQL format or missing data
      if (!caseData) {
        const errorResponse = response.errors?.length
          ? response
          : { errors: [{ extensions: { errorCode: 'NOT_FOUND' } }] };

        return createApiResponse<CaseCreationResponse>(
          event,
          errorResponse,
          null,
          ResponseType.ERROR
        );
      }

      const origin =
        event.node.req.headers.origin || event.node.req.headers.host || 'N/A';
      const organizationName = config.linkName || 'N/A';

      let caseId = 'N/A';
      if (caseData) {
        caseId =
          caseData.caseId ||
          caseData.id ||
          (caseData as any).case?.id ||
          (caseData as any).case?.caseId ||
          (response as any).caseId ||
          (response as any).id ||
          'N/A';
      }

      const firstName = patientCaseData?.firstName || 'N/A';
      const lastName = patientCaseData?.lastName || 'N/A';
      const email = patientCaseData?.email || 'N/A';
      const phoneNumber = patientCaseData?.phoneNumber || 'N/A';
      const productBundleId = patientCaseData?.productBundleId || 'N/A';
      const amount = patientCaseData?.paymentAmount || 0;

      const slackFields: SlackField[] = [
        {
          label: 'Patient',
          value: `${firstName} ${lastName}`,
          short: true,
        },
        { label: 'Email', value: email, short: true },
        { label: 'Phone Number', value: phoneNumber, short: true },
        { label: 'Case ID', value: caseId, short: true },
        { label: 'Product Bundle ID', value: productBundleId, short: true },
        { label: 'Payment Amount', value: `$${amount}`, short: true },
        { label: 'Organization', value: organizationName, short: true },
        { label: 'Client URL', value: origin, short: true },
        {
          label: 'API Endpoint',
          value: `${graphQlUrl}/api/v1/dynamic-case`,
          short: false,
        },
        {
          label: 'Time (UTC)',
          value: new Date().toISOString(),
          short: true,
        },
      ];

      sendSlackNotification({
        title: 'New Patient Case Created',
        fields: slackFields,
        type: 'success',
      }).catch(err => {
        console.error('Slack notification failed:', err.message);
      });

      return createApiResponse<CaseCreationResponse>(
        event,
        response,
        caseData,
        ResponseType.SUCCESS
      );
    } catch (error: unknown) {
      const config = useRuntimeConfig(event);
      const origin =
        event.node.req.headers.origin || event.node.req.headers.host || 'N/A';
      const organizationName = config.linkName || 'N/A';
      const graphQlUrl = config.graphqlApiUrl;

      const body = await readBody(event).catch(() => ({}));
      const patientCaseData = body?.patientCaseData || {};

      const firstName = patientCaseData?.firstName || 'N/A';
      const lastName = patientCaseData?.lastName || 'N/A';
      const email = patientCaseData?.email || 'N/A';
      const phoneNumber = patientCaseData?.phoneNumber || 'N/A';
      const productBundleId = patientCaseData?.productBundleId || 'N/A';
      const amount = patientCaseData?.paymentAmount || 0;
      const token = patientCaseData?.nmiPaymentToken || '';

      const errorMessage = formatErrorDetails(error);
      const statusCode =
        (error as any)?.statusCode || (error as any)?.status || 500;

      const slackFields: SlackField[] = [
        {
          label: 'Patient Name',
          value: `${firstName} ${lastName}`,
          short: true,
        },
        { label: 'Patient Email', value: email, short: true },
        { label: 'Phone Number', value: phoneNumber, short: true },
        { label: 'Product Bundle ID', value: productBundleId, short: true },
        { label: 'Payment Amount', value: `$${amount}`, short: true },
        {
          label: 'Payment Token',
          value: token ? `${token.substring(0, 10)}...` : 'N/A',
          short: true,
        },
        { label: 'Error Status', value: `${statusCode}`, short: true },
        { label: 'Error Message', value: errorMessage, short: false },
        { label: 'Organization', value: organizationName, short: true },
        { label: 'Client URL', value: origin, short: true },
        {
          label: 'API Endpoint',
          value: `${graphQlUrl}/api/v1/dynamic-case`,
          short: false,
        },
        {
          label: 'Time (UTC)',
          value: new Date().toISOString(),
          short: true,
        },
      ];

      sendSlackNotification({
        title: 'Patient Case Creation Failed',
        fields: slackFields,
        type: 'error',
      }).catch(err => {
        console.error('Slack error notification failed:', err.message);
      });

      // Extract response data from $fetch error (contains API error response)
      const errorResponse = (error as any)?.data || error;

      return createApiResponse<CaseCreationResponse>(
        event,
        errorResponse,
        null,
        ResponseType.ERROR
      );
    }
  }
);
