import https from 'https';

export interface SlackField {
  label: string;
  value: string;
  short?: boolean;
}

export interface SlackNotificationOptions {
  title: string;
  fields: SlackField[];
  type?: 'success' | 'error' | 'warning' | 'info' | 'security';
}

/**
 * Sends a notification to Slack via webhook
 * @param options - Notification configuration
 */
export async function sendSlackNotification(
  options: SlackNotificationOptions
): Promise<void> {
  const config = useRuntimeConfig();
  const webhookUrl = config.slackWebhookUrl;

  if (!webhookUrl) {
    console.warn('Slack webhook URL not configured. Skipping notification.');
    return;
  }

  // Determine color and emoji based on type
  const colors = {
    success: '#36a64f',
    error: '#ff0000',
    warning: '#ff9900',
    info: '#0099ff',
    security: '#9900ff',
  };

  const emojis = {
    success: '✅',
    error: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
    security: '🔒',
  };

  const type = options.type || 'info';
  const color = colors[type];
  const emoji = emojis[type];

  // Format fields for Slack
  const slackFields = options.fields.map(field => ({
    title: field.label,
    value: `\`${field.value}\``,
    short: field.short !== false,
  }));

  // Build Slack payload
  const payload = {
    attachments: [
      {
        color,
        title: `${emoji} ${options.title}`,
        fields: slackFields,
        footer: 'CV Lambda Monitor',
        footer_icon:
          'https://platform.slack-edge.com/img/default_application_icon.png',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  // Parse webhook URL
  const url = new URL(webhookUrl);
  const postData = JSON.stringify(payload);

  const requestOptions = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    timeout: 5000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          console.error(`❌ Slack API returned ${res.statusCode}: ${data}`);
          reject(new Error(`Slack API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', error => {
      console.error('❌ Failed to send Slack notification:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      const timeoutError = new Error('Slack request timeout');
      console.error('❌ Slack request timeout');
      reject(timeoutError);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Formats error details for display
 * @param error - Error object
 * @returns Formatted error message
 */
export function formatErrorDetails(error: any): string {
  if (typeof error === 'string') return error;

  return (
    error?.message ||
    error?.statusMessage ||
    error?.data?.error ||
    'Unknown error'
  );
}

/**
 * Formats phone number for display (no masking per requirements)
 * @param phone - Phone number
 * @returns Full phone number
 */
export function formatPhoneForDisplay(phone: string): string {
  return phone || 'N/A';
}

/**
 * Formats email for display (no masking per requirements)
 * @param email - Email address
 * @returns Full email address
 */
export function formatEmailForDisplay(email: string): string {
  return email || 'N/A';
}

/**
 * Truncates a string to a maximum length
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number = 100): string {
  if (!str) return 'N/A';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}
