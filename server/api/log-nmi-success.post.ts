import {
  sendSlackNotification,
  truncateString,
  type SlackField,
} from '../utils/slack';

interface NmiSuccessLogRequest {
  paymentToken: string;
  productId?: string;
  patientEmail?: string;
  patientName?: string;
  paymentAmount?: number;
  timestamp?: string;
  organizationName?: string;
  clientUrl?: string;
}

export default defineEventHandler(async event => {
  try {
    const body = await readBody<NmiSuccessLogRequest>(event);

    // Validate required fields
    if (!body.paymentToken) {
      throw createError({
        statusCode: 400,
        message: 'paymentToken is required',
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
        label: 'Payment Token',
        value: truncateString(body.paymentToken, 50),
        short: true,
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

    // Send Slack notification (fire-and-forget, non-blocking)
    sendSlackNotification({
      title: 'NMI Payment Tokenization Successful',
      fields: slackFields,
      type: 'success',
    }).catch(err => {
      console.error('Failed to send Slack notification:', err.message);
    });

    return {
      success: true,
      message: 'Success logged successfully',
    };
  } catch (error: any) {
    console.error('Error in log-nmi-success endpoint:', error);

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to log success',
    });
  }
});
