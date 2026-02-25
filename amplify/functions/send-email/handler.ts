import nodemailer from 'nodemailer';

export const handler = async (event: any) => {
  const { to, subject, body } = event.arguments || event;

  // These should be set in Amplify environment variables
  const user = process.env.SMTP_USER || 'eduardofaustos@gmail.com'; 
  const pass = process.env.SMTP_PASS;

  if (!pass) {
    console.error('SMTP_PASS is not configured');
    return { success: false, error: 'Configuración de correo incompleta' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Notificaciones LOPDP" <${user}>`,
    to,
    subject,
    html: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true };
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    return { success: false, error: (error as Error).message };
  }
};
