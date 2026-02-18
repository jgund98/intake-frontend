import { sendSlackNotification, type SlackField } from '../utils/slack';

interface NmiErrorLogRequest {
  errorType: 'tokenization' | 'initialization' | 'validation';
  errorMessage: string;
  productId?: string;
  patientEmail?: string;
  patientName?: string;
  paymentAmount?: number;
  timestamp?: string;
  organizationName?: string;
  clientUrl?: string;
  additionalContext?: Record<string, any>;
}

export default defineEventHandler(async event => {
  try {
    const body = await readBody<NmiErrorLogRequest>(event);

    // Validate required fields
    if (!body.errorType || !body.errorMessage) {
      throw createError({
        statusCode: 400,
        message: 'errorType and errorMessage are required',
      });
    }

    // Extract organization info
    const config = useRuntimeConfig();
    const organizationName =
      body.organizationName || config.public?.linkName || 'N/A';
    const clientUrl =
      body.clientUrl ||
      event.node.req.headers.origin ||
      event.node.req.headers.host ||
      'N/A';

    // Build Slack fields
    const slackFields: SlackField[] = [
      {
        label: 'Error Type',
        value: body.errorType.toUpperCase(),
        short: true,
      },
      {
        label: 'Error Message',
        value: body.errorMessage,
        short: false,
      },
    ];

    if (body.patientName) {
      slackFields.push({
        label: 'Patient Name',
        value: body.patientName || 'N/A',
        short: true,
      });
    }

    if (body.patientEmail) {
      slackFields.push({
        label: 'Patient Email',
        value: body.patientEmail,
        short: true,
      });
    }

    if (body.productId) {
      slackFields.push({
        label: 'Product ID',
        value: body.productId,
        short: true,
      });
    }

    if (body.paymentAmount !== undefined) {
      slackFields.push({
        label: 'Payment Amount',
        value: `$${body.paymentAmount}`,
        short: true,
      });
    }

    slackFields.push({
      label: 'Organization',
      value: organizationName,
      short: true,
    });

    slackFields.push({
      label: 'Client URL',
      value: clientUrl,
      short: true,
    });

    slackFields.push({
      label: 'NMI Endpoint',
      value: 'https://secure.nmi.com/token/api/create',
      short: false,
    });

    slackFields.push({
      label: 'Time (UTC)',
      value: body.timestamp || new Date().toISOString(),
      short: true,
    });

    if (
      body.additionalContext &&
      Object.keys(body.additionalContext).length > 0
    ) {
      slackFields.push({
        label: 'Additional Context',
        value: JSON.stringify(body.additionalContext, null, 2),
        short: false,
      });
    }

    // Send Slack notification (non-blocking)
    try {
      await sendSlackNotification({
        title: 'NMI Payment Tokenization Failed',
        fields: slackFields,
        type: 'error',
      });
    } catch (slackError: any) {
      console.error('Failed to send Slack notification:', slackError.message);
      // Don't throw - we still want to return success
    }

    return {
      success: true,
      message: 'Error logged successfully',
    };
  } catch (error: any) {
    console.error('Error in log-nmi-error endpoint:', error);

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to log error',
    });
  }
});
