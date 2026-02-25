import nodemailer from 'nodemailer';

export const handler = async (event: any) => {
  const { to, subject, body } = event.arguments || event;

  const user = process.env.SMTP_USER; 
  const pass = process.env.SMTP_PASS;

  console.log(`Intentando enviar correo a: ${to} usando el usuario: ${user}`);

  if (!pass || !user) {
    const errorMsg = `Configuración incompleta: USER=${!!user}, PASS=${!!pass}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: user,
      pass: pass,
    },
  });

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('Servidor SMTP listo para enviar');

    const mailOptions = {
      from: `"Notificaciones LOPDP" <${user}>`,
      to,
      subject,
      html: body,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error detallado de SMTP:', error);
    return { 
      success: false, 
      error: (error as Error).message,
      code: (error as any).code
    };
  }
};
