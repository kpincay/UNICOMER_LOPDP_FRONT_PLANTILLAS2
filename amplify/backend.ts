import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendEmail } from './functions/send-email/resource';

import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/gen2/build-a-backend/
 */
const backend = defineBackend({
  auth,
  data,
  sendEmail,
});

// Grant SES permissions to the sendEmail function
backend.sendEmail.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'], // In production, narrow this to the verified identity ARN
  })
);
