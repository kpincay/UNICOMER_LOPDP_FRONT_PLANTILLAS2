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

// Sobrescribir la política de contraseñas de Cognito para cumplir con los estándares corporativos
backend.auth.resources.cfnResources.cfnUserPool.addPropertyOverride(
  'Policies',
  {
    PasswordPolicy: {
      MinimumLength: 12,
      RequireLowercase: true,
      RequireNumbers: true,
      RequireSymbols: true,
      RequireUppercase: true,
      PasswordHistorySize: 3, 
    }
  }
);

