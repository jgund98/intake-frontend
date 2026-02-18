/**
 * Application Error Handling Utilities
 * Provides standardized error handling and response formatting
 */

import { setResponseStatus } from 'h3';
import type { H3Event } from 'h3';
import {
  ResponseType,
  type ApiResp,
  type AppErrorCode,
} from '~/models/apiResponse.model';

/**
 * Error code mapping - String error codes to numeric HTTP codes
 */
const ERROR_CODE_MAP: Record<string, AppErrorCode> = {
  // GraphQL/Application errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
  TOO_MANY_REQUESTS: 429,
  VALIDATION_ERROR: 400,

  // Backend-specific error codes
  NO_AUTHORIZATION: 401,
  INVALID_AUTHORIZATION: 401,
  AUTHORIZED_USER_NOT_FOUND: 401,
  ILLEGAL_STATE: 409,
  PERMISSION_DENIED: 403,
  ILLEGAL_ARGUMENT: 400,
  ALREADY_EXISTS: 409,
  BAD_USER_INPUT: 400,

  // Network errors
  ENOTFOUND: 500,
  ECONNREFUSED: 502,
  ECONNRESET: 502,
  ETIMEDOUT: 504,
  ENETUNREACH: 502,
  EHOSTUNREACH: 502,

  // Service errors
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  BAD_GATEWAY: 502,
} as const;

/**
 * User-friendly error messages for each app error code
 * Note: These are fallback messages. Backend's custom message is preferred when available.
 */
const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Authentication required. Please log in.',
  403: 'You do not have permission to access this resource.',
  404: 'Resource not found.',
  409: 'A conflict occurred. The resource may already exist.',
  429: 'Too many requests. Please try again later.',
  500: 'Internal server error. Please try again.',
  502: 'Unable to reach the server.',
  503: 'Service temporarily unavailable.',
  504: 'Request timeout.',
  600: 'An unexpected error occurred.',
} as const;

/**
 * Unified API Response Handler
 * Creates proper success or error responses
 *
 * @param event - H3 event object to set response status
 * @param response - Original response (for error extraction)
 * @param data - Important data to return (can be null)
 * @param type - Response type from enum (default: SUCCESS)
 * @returns ApiResp with success data or error details
 */
export function createApiResponse<T>(
  event: H3Event,
  response: any,
  data: T | null = null,
  type: ResponseType = ResponseType.SUCCESS
): ApiResp<T> {
  if (type === ResponseType.SUCCESS) {
    setResponseStatus(event, 200, 'Success');

    return {
      ok: true,
      code: 200,
      message: 'Request completed successfully',
      data: data as T,
    };
  }

  // Handle error case
  let errorCode: AppErrorCode = 500;
  let customMessage: string | null = null;

  // Format 1: New REST API format with success/status/error/code fields
  if (response?.success === false && response?.code) {
    errorCode = ERROR_CODE_MAP[response.code] || response.status || 500;
    // Prefer 'error' field for detailed message, fallback to 'message'
    customMessage = response.error || response.message || null;
  }
  // Format 2: GraphQL-style errors array
  else if (
    response?.errors &&
    Array.isArray(response.errors) &&
    response.errors.length > 0
  ) {
    const error = response.errors[0];
    const extensions = error?.extensions;

    // Get custom message if provided
    if (error?.message) {
      customMessage = error.message;
    }

    if (extensions) {
      const { code, errorCode: errCode } = extensions;

      // Smart lookup: check code first, then errorCode
      errorCode = ERROR_CODE_MAP[code] || ERROR_CODE_MAP[errCode] || 500;
    }
  }

  // Use custom message if provided, otherwise use default
  const message = customMessage || ERROR_MESSAGES[errorCode];
  setResponseStatus(event, errorCode, message);

  return {
    ok: false,
    code: errorCode,
    message,
    data: null as null,
  };
}
