import { defineEventHandler, getQuery } from 'h3';
import { $fetch } from 'ofetch';
import { useRuntimeConfig } from '#imports';
import { createApiResponse } from '~/server/lib/appErrors';
import { ResponseType, type ApiResp } from '~/models/apiResponse.model';

interface PromoCodeData {
  flatDiscount?: number;
  percentDiscount?: number;
}

interface PromoCodeApiResponse {
  success: boolean;
  data: PromoCodeData[];
}

export default defineEventHandler(
  async (event): Promise<ApiResp<PromoCodeData[]>> => {
    const config = useRuntimeConfig(event);
    const graphqlApiUrl = config.graphqlApiUrl;
    const organizationKey = config.care360Token;
    const query = getQuery(event);

    // Extract query parameters
    const code = query.code as string;
    const productBundleId = query.product_bundle_id as string;

    // Validate required parameters
    if (!code || !productBundleId) {
      return createApiResponse<PromoCodeData[]>(
        event,
        {
          errors: [
            {
              message: 'code and product_bundle_id are required',
              extensions: { code: 'BAD_REQUEST' },
            },
          ],
        },
        null,
        ResponseType.ERROR
      );
    }

    // Validate configuration
    if (!graphqlApiUrl) {
      return createApiResponse<PromoCodeData[]>(
        event,
        { errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
        null,
        ResponseType.ERROR
      );
    }

    if (!organizationKey) {
      return createApiResponse<PromoCodeData[]>(
        event,
        { errors: [{ extensions: { code: 'UNAUTHORIZED' } }] },
        null,
        ResponseType.ERROR
      );
    }

    // Set cache control headers - no caching for promo codes
    event.node.res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );

    try {
      // Call the external API to validate promo code
      const response = await $fetch<PromoCodeApiResponse>(
        `${graphqlApiUrl}/api/v1/promo-codes`,
        {
          method: 'GET',
          params: {
            code,
            product_bundle_id: productBundleId,
          },
          headers: {
            'cv-api-key': organizationKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Check if the response is successful and has data
      if (!response.success || !response.data || response.data.length === 0) {
        return createApiResponse<PromoCodeData[]>(
          event,
          {
            errors: [
              {
                message: 'Invalid promo code',
                extensions: { code: 'NOT_FOUND' },
              },
            ],
          },
          null,
          ResponseType.ERROR
        );
      }

      // Success response
      return createApiResponse<PromoCodeData[]>(
        event,
        { success: true, data: response.data },
        response.data
      );
    } catch (error: unknown) {
      // Handle fetch errors - check if it's a 404 or invalid promo code
      const err = error as { statusCode?: number; message?: string };

      if (err.statusCode === 404) {
        return createApiResponse<PromoCodeData[]>(
          event,
          {
            errors: [
              {
                message: 'Invalid promo code',
                extensions: { code: 'NOT_FOUND' },
              },
            ],
          },
          null,
          ResponseType.ERROR
        );
      }

      // For other errors, return a generic message
      return createApiResponse<PromoCodeData[]>(
        event,
        {
          errors: [
            {
              message: 'Invalid promo code',
              extensions: { code: 'VALIDATION_ERROR' },
            },
          ],
        },
        null,
        ResponseType.ERROR
      );
    }
  }
);
