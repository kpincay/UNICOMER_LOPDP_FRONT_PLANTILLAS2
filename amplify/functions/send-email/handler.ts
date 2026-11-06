import { randomUUID } from 'node:crypto';

export const handler = async (event: any) => {
  const { to, subject, isConfirmation, name, consentUrl, acceptedClauses } = event.arguments || event;

  if (!isConfirmation) {
    console.log('Envío de correo deshabilitado para esta operación');
    return { success: false, error: 'Envío de correo deshabilitado para esta operación' };
  }

  const tokenUrl = process.env.APIGEE_TOKEN_URL;
  const notificationUrl = process.env.APIGEE_NOTIFICATION_URL;
  const apigeeEnvironment = process.env.APIGEE_ENVIRONMENT;
  const basicAuth = process.env.APIGEE_BASIC_AUTH;

  if (!tokenUrl || !notificationUrl || !apigeeEnvironment || !basicAuth) {
    return { success: false, error: 'Falta configurar la integración de notificaciones en Amplify' };
  }

  if (!to || !name || !consentUrl || !Array.isArray(acceptedClauses)) {
    return { success: false, error: 'Faltan datos requeridos para la confirmación' };
  }

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: basicAuth,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Error al obtener token de Apigee: HTTP ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error('La respuesta de Apigee no contiene access_token');
    }

    const requestId = randomUUID();
    const notificationResponse = await fetch(notificationUrl, {
      method: 'POST',
      headers: {
        'X-country': 'EC',
        'X-brand': 'lopdp-ec',
        'X-channelRef': 'SYSTEM',
        'X-consumerDateTime': new Date().toISOString(),
        'X-consumerRef': 'lopdp-ec',
        'X-environment': apigeeEnvironment,
        'X-processRef': 'BATCH',
        'X-storeRef': 'XX',
        'X-typeProcessRef': 'XX',
        'X-typeProduct': 'XX',
        'X-Accept-Language': 'TD',
        'X-Idempotency-key': requestId,
        'X-B3-TraceId': requestId,
        'X-B3-SpanId': requestId,
        'X-UserTrx': 'OnBoarding',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        recipient: to,
        sender: process.env.NOTIFICATION_SENDER || 'notificaciones-dataprivacy@unicomerprivacy.com',
        type: 'EMAIL',
        template: {
          value: '',
          name: 'confirmacion_datos_personales_ec',
          vars: {
            name,
            consentUrl,
            dataProtectionPolicyUrl: 'https://www.artefacta.com/politica-proteccion-de-datos-personales',
            dpoEmail: 'dpo_ec@unicomer.com',
            acceptedClauses,
          },
        },
        content: {
          subject,
          body: '',
        },
      }),
    });

    if (!notificationResponse.ok) {
      throw new Error(`Error al enviar notificación: HTTP ${notificationResponse.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error al enviar correo de confirmación por Apigee:', error);
    return {
      success: false, 
      error: (error as Error).message,
    };
  }
};
