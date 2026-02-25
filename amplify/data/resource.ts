import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*
 * Define your data model
 * @see https://docs.amplify.aws/gen2/build-a-backend/data/set-up-data/
 */
const schema = a.schema({
  Proceso: a
    .model({
      nombre: a.string().required(),
      descripcion: a.string(),
      plantillas: a.hasMany('Plantilla', 'procesoId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(['read'])
    ]),

  Plantilla: a
    .model({
      nombre: a.string().required(),
      codigo: a.string().required(),
      version: a.string(),
      url: a.string(),
      contenido: a.string(),
      requiereAceptacion: a.boolean(),
      solicitarAceptacion: a.boolean(),
      procesoId: a.id(),
      proceso: a.belongsTo('Proceso', 'procesoId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(['read'])
    ]),

  sendEmail: a
    .mutation()
    .arguments({
      to: a.string().required(),
      subject: a.string().required(),
      body: a.string().required(),
    })
    .returns(a.json())
    .handler(a.handler.function('send-email'))
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  },
});
