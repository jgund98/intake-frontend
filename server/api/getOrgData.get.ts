import { defineEventHandler } from 'h3';
import { $fetch } from 'ofetch';
import { useRuntimeConfig } from '#imports';
import { ORG_DATA_QUERY } from '~/server/lib/orgDataQuery';
import { createApiResponse } from '~/server/lib/appErrors';
import {
  ResponseType,
  type ApiResp,
  type OrgVariables,
} from '~/models/apiResponse.model';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
      errorCode?: string;
    };
  }>;
}

interface OrgInfoData {
  organizationPartnerIntegrationPublicInfo: OrgVariables;
}

export default defineEventHandler(
  async (event): Promise<ApiResp<OrgVariables>> => {
    const { graphqlApiUrl, linkName } = useRuntimeConfig(event);

    // Validate configuration
    if (!graphqlApiUrl) {
      return createApiResponse<OrgVariables>(
        event,
        { errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
        null,
        ResponseType.ERROR
      );
    }

    if (!linkName) {
      return createApiResponse<OrgVariables>(
        event,
        { errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
        null,
        ResponseType.ERROR
      );
    }

    // Set cache control headers
    event.node.res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );

    try {
      const response = await $fetch<GraphQLResponse<OrgInfoData>>(
        `${graphqlApiUrl}/graphql/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { query: ORG_DATA_QUERY, variables: { linkName } },
        }
      );

      // Extract organization data
      const orgData = response.data?.organizationPartnerIntegrationPublicInfo;

      // If no data, check if GraphQL errors exist
      if (!orgData) {
        // If GraphQL errors exist, pass response to extract proper error code
        // Otherwise, return NOT_FOUND error
        const errorResponse = response.errors?.length
          ? response
          : { errors: [{ extensions: { errorCode: 'NOT_FOUND' } }] };

        return createApiResponse<OrgVariables>(
          event,
          errorResponse,
          null,
          ResponseType.ERROR
        );
      }

      // Success response (ResponseType.SUCCESS is default)
      return createApiResponse<OrgVariables>(event, response, orgData);
    } catch (error: unknown) {
      return createApiResponse<OrgVariables>(
        event,
        error,
        null,
        ResponseType.ERROR
      );
    }
  }
);
