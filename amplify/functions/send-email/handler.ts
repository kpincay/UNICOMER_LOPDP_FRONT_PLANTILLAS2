import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  const { to, subject, body } = event.arguments || event;

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: body,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: "notificaciones@unicomer-test.com", // This must be a verified identity in SES
  });

  try {
    await ses.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: (error as Error).message };
  }
};
