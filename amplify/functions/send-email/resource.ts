import { defineFunction, secret } from '@aws-amplify/backend';

export const sendEmail = defineFunction({
  name: 'send-email',
  entry: './handler.ts',
  environment: {
    SMTP_USER: 'eduardofaustos@gmail.com', // Fallback or managed here
    SMTP_PASS: secret('SMTP_PASS'),
  },
  timeoutSeconds: 30, // Increased for external SMTP connections
});
