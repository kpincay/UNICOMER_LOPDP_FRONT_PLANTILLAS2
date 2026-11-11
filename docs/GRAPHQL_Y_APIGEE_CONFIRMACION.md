# Revisión de GraphQL y especificación de Apigee para confirmaciones

## Alcance

Revisión estática del código del repositorio. No se hicieron llamadas de prueba a GraphQL, Apigee ni a recursos desplegados. La configuración efectiva debe verificarse también en el entorno de Amplify correspondiente.

## Hallazgos de GraphQL

La configuración de `amplify/data/resource.ts` establece `apiKey` como autorización predeterminada, con una clave que vence a los 30 días. La clave que usa una aplicación web no es un secreto: queda disponible para el navegador. La sesión de Cognito que protege las pantallas administrativas no reemplaza la autorización del esquema.

- **Proceso, Plantilla y ProcesoPlantilla:** tienen `allow.publicApiKey()` sin limitar operaciones. El esquema permite acceso público de lectura y escritura, incluyendo crear, actualizar y borrar. La interfaz del Dashboard exige inicio de sesión, pero el esquema no aplica esa misma restricción.
- **Aceptacion:** permite lectura y creación con API key pública. Sus campos incluyen `transaccionId` y `plantillasAceptadas`; podrían leerse registros o crearse aceptaciones que no fueron verificadas por el servicio de transacciones.
- **sendEmail:** la mutación también permite API key pública. Recibe `to`, `subject`, `body`, `isConfirmation`, `name`, `consentUrl` y `acceptedClauses`. El handler acepta un destinatario y asunto suministrados por quien invoca la mutación; cuando `isConfirmation` es `true`, usa Apigee para enviar al destinatario indicado. El booleano no constituye autorización.
- **Rutas públicas:** `/creacionProceso` y la página de aceptación con `?id=...` se muestran fuera del autenticador. La página de aceptación consulta modelos GraphQL con el cliente web. El acceso a estas páginas no limita por sí mismo el acceso directo al endpoint GraphQL.

### Riesgos prioritarios

1. La API key pública no es un control de acceso para datos o mutaciones. El acceso de escritura abierto en los modelos administrativos puede permitir cambios en procesos, plantillas y relaciones.
2. La lectura pública de `Aceptacion` expone identificadores de transacción y plantillas aceptadas; la creación pública no prueba que la transacción exista ni que la persona haya aceptado.
3. La mutación pública de correo puede usarse para solicitar envíos no autorizados y generar abuso del servicio o costos. Validar `isConfirmation` no basta si el propio llamante puede decidir su valor y destinatario.
4. `TransactionInitiator` invoca `sendEmail` sin `isConfirmation`; con la lógica actual, el handler responde que el envío está deshabilitado. El frontend no comprueba el resultado de la mutación y puede continuar como si el correo se hubiera enviado.

Estos son riesgos derivados del código. No confirman que el endpoint desplegado sea accesible actualmente ni que se hayan producido abusos.

## Cantidad de Lambdas recomendada

Para el flujo de aceptación, recomiendo **2 Lambdas de negocio como máximo**, separadas por responsabilidad, no una Lambda por cada modelo GraphQL:

1. **`registrar-aceptacion`**: valida en un backend confiable la transacción y el permiso para aceptar, registra la aceptación de forma idempotente y solicita el envío solo después de guardar correctamente. La ruta pública debe validar un token o mecanismo de autorización de un solo uso; no debe confiar en la API key de Amplify ni en un `transaccionId` recibido sin validación.
2. **`send-email`**: función privada de entrega. Solo recibe una solicitud interna de confirmación ya validada, obtiene los datos confiables del destinatario y usa la plantilla fija de Apigee. No debe estar expuesta como mutación pública de AppSync ni aceptar solicitudes genéricas de envío.

Las operaciones administrativas sobre procesos y plantillas no necesitan Lambdas adicionales: pueden permanecer en AppSync, pero su autorización debe exigir Cognito en el esquema y limitar las operaciones permitidas.

**Aplicado al código actual:** `AcceptanceLanding` ya llama a `lopdService.updateTransaction` y crea el registro `Aceptacion` en Amplify. Si el servicio de transacciones ya valida la identidad o autorización, persiste la aceptación y puede iniciar de forma confiable el correo, no agregaría `registrar-aceptacion`: conservaría **una Lambda**, `send-email`, invocada por ese servicio de backend y no directamente desde el navegador. Si no hace esas validaciones, el objetivo recomendado es **dos Lambdas** y mover la escritura de `Aceptacion` al backend confiable. Hay que confirmar las capacidades del servicio antes de decidir.

No se recomienda aumentar la cantidad de Lambdas para corregir por sí sola la autorización de GraphQL; los permisos del esquema deben restringirse por separado.

## Flujo Apigee actual

Implementado en `amplify/functions/send-email/handler.ts` y configurado en `amplify/functions/send-email/resource.ts`:

1. La función solo continúa cuando `isConfirmation === true`.
2. Obtiene un token con `POST APIGEE_TOKEN_URL`, `Content-Type: application/x-www-form-urlencoded`, `Authorization: APIGEE_BASIC_AUTH` y el formulario `grant_type=client_credentials`.
3. Espera una respuesta exitosa con `access_token`.
4. Envía un `POST APIGEE_NOTIFICATION_URL` con `Authorization: Bearer <access_token>`, `Content-Type: application/json` y los encabezados de contexto de notificación indicados abajo.
5. Envía una notificación `EMAIL` con la plantilla `confirmacion_datos_personales_ec`.
6. Si la respuesta de notificaciones no es exitosa, el handler devuelve `success: false`; de lo contrario, devuelve `success: true`.

### Configuración del entorno Lambda

- `APIGEE_TOKEN_URL`: URL del proxy OAuth de Apigee.
- `APIGEE_NOTIFICATION_URL`: URL del proxy de notificaciones de Apigee.
- `APIGEE_ENVIRONMENT`: valor enviado en el encabezado `X-environment`.
- `APIGEE_BASIC_AUTH`: secreto de Amplify con el valor de autorización Basic requerido por el proxy. No debe estar en el frontend, el repositorio ni los logs.
- `NOTIFICATION_SENDER`: remitente; actualmente usa un valor predeterminado si no se configura.

Configurar estas variables y el secreto en el entorno de Amplify desplegado. No registrar el secreto, el token ni encabezados `Authorization`.

### Encabezados de notificación actuales

El handler envía estos encabezados; los valores deben cotejarse con el contrato vigente de Apigee antes del despliegue:

- `X-country: EC`
- `X-brand: lopdp-ec`
- `X-channelRef: SYSTEM`
- `X-consumerDateTime`: fecha UTC ISO generada para la llamada
- `X-consumerRef: lopdp-ec`
- `X-environment`: valor de `APIGEE_ENVIRONMENT`
- `X-processRef: BATCH`
- `X-storeRef: XX`
- `X-typeProcessRef: XX`
- `X-typeProduct: XX`
- `X-Accept-Language: TD`
- `X-Idempotency-key`: UUID generado por llamada
- `X-B3-TraceId` y `X-B3-SpanId`: UUID generado por llamada
- `X-UserTrx: OnBoarding`
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

### Cuerpo de notificación actual

```json
{
  "recipient": "correo de destino",
  "sender": "NOTIFICATION_SENDER",
  "type": "EMAIL",
  "template": {
    "value": "",
    "name": "confirmacion_datos_personales_ec",
    "vars": {
      "name": "nombre del titular",
      "consentUrl": "URL de aceptación",
      "dataProtectionPolicyUrl": "https://www.artefacta.com/politica-proteccion-de-datos-personales",
      "dpoEmail": "dpo_ec@unicomer.com",
      "acceptedClauses": ["cláusulas aceptadas"]
    }
  },
  "content": {
    "subject": "asunto de confirmación",
    "body": ""
  }
}
```

El esquema de la plantilla y los encabezados son los que usa hoy el handler; confirmar que coinciden con la definición vigente del proxy Apigee. El token y cualquier dato personal deben excluirse de los registros.

## Requisitos para que la Lambda sea solo de confirmación

1. Mantener una única plantilla fija de confirmación y un asunto definido por backend. No aceptar `body`, plantilla, remitente ni asunto arbitrarios del cliente.
2. No tratar `isConfirmation` como control de seguridad. Separar la operación de confirmación de cualquier envío genérico y rechazar solicitudes que no cumplan el contrato de confirmación.
3. No confiar en `to`, `name`, `consentUrl` o `acceptedClauses` solo porque vengan de GraphQL. Validar la aceptación en un servicio confiable y obtener el destinatario desde la transacción autorizada; el identificador de URL no es una credencial.
4. Retirar la autorización pública directa de `sendEmail`. La API key expuesta en el navegador no puede proteger la mutación. Para el flujo público, invocar una operación backend que valide la transacción, limite frecuencia y solo permita la confirmación correspondiente. Las llamadas administrativas deben exigir Cognito en el esquema, no solo en la interfaz.
5. Limitar los permisos de cada modelo al mínimo necesario. En particular, retirar la lectura pública de `Aceptacion` y la escritura pública administrativa; usar una ruta backend autorizada para guardar y consultar aceptaciones.
6. Hacer que la interfaz revise tanto `errors` de GraphQL como el valor `success` devuelto por la Lambda. La aceptación y el resultado del correo deben comunicarse por separado.

## Observabilidad recomendada

Registrar en CloudWatch el identificador de correlación, el estado HTTP de cada llamada y un identificador de solicitud de Apigee si este lo devuelve. En errores, capturar un cuerpo de respuesta limitado y depurado de datos personales. Nunca registrar credenciales Basic, el token Bearer, direcciones de correo, URL con identificadores de transacción ni el cuerpo completo de aceptación. Actualmente el handler registra excepciones, pero no registra respuestas exitosas ni el cuerpo de respuesta de Apigee.
