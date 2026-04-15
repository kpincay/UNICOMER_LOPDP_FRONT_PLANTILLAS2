/// <reference types="node" />
import { defineFunction, secret } from '@aws-amplify/backend';

export const sendEmail = defineFunction({
  name: 'send-email',
  entry: './handler.ts',
  environment: {
    SMTP_USER: process.env.SMTP_USER || 'eduardofaustos@gmail.com', // Toma la variable de entorno o usa el default
    SMTP_PASS: secret('SMTP_PASS'),
  },
  timeoutSeconds: 30, // Increased for external SMTP connections
});
