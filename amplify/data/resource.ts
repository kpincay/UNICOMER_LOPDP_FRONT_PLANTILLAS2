import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*
 * Define your data model
 * @see https://docs.amplify.aws/gen2/build-a-backend/data/set-up-data/
 */
const schema = a.schema({
  Plantilla: a
    .model({
      nombre: a.string().required(),
      codigo: a.string().required(),
      version: a.string(),
      url: a.string(),
      contenido: a.string(),
      requiereAceptacion: a.boolean(),
      solicitarAceptacion: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
