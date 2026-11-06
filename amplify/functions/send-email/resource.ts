/// <reference types="node" />
import { defineFunction, secret } from '@aws-amplify/backend';

export const sendEmail = defineFunction({
  name: 'send-email',
  entry: './handler.ts',
  environment: {
    APIGEE_TOKEN_URL: process.env.APIGEE_TOKEN_URL || '',
    APIGEE_NOTIFICATION_URL: process.env.APIGEE_NOTIFICATION_URL || '',
    APIGEE_ENVIRONMENT: process.env.APIGEE_ENVIRONMENT || '',
    APIGEE_BASIC_AUTH: secret('APIGEE_BASIC_AUTH'),
    NOTIFICATION_SENDER: process.env.NOTIFICATION_SENDER || 'notificaciones-dataprivacy@unicomerprivacy.com',
  },
  timeoutSeconds: 30,
});
