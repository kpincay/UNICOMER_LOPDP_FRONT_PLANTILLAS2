import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // Atributo personalizado para almacenar la fecha de la última actualización de contraseña
    'custom:passwordUpdatedAt': {
      dataType: 'String',
      mutable: true,
    },
  },
});
