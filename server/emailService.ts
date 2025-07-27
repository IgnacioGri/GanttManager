import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid not configured - email not sent:", params.subject);
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log("Email sent successfully to:", params.to);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateTaskDueEmail(
  userEmail: string, 
  taskName: string, 
  projectName: string, 
  dueDate: string, 
  daysUntilDue: number
): EmailParams {
  const subject = `⏰ Tarea "${taskName}" vence ${daysUntilDue === 0 ? 'hoy' : `en ${daysUntilDue} día(s)`}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .highlight { color: #ef4444; font-weight: bold; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 Recordatorio de Tarea</h1>
                <p>Gantt Manager - Gestión de Proyectos</p>
            </div>
            <div class="content">
                <h2>¡Tu tarea está próxima a vencer!</h2>
                
                <div class="task-info">
                    <h3>📋 ${taskName}</h3>
                    <p><strong>Proyecto:</strong> ${projectName}</p>
                    <p><strong>Fecha de vencimiento:</strong> <span class="highlight">${dueDate}</span></p>
                    <p><strong>Tiempo restante:</strong> <span class="highlight">${daysUntilDue === 0 ? 'Vence hoy' : `${daysUntilDue} día(s)`}</span></p>
                </div>

                <p>Te recordamos que tienes una tarea importante que ${daysUntilDue === 0 ? 'vence hoy' : 'está próxima a vencer'}. 
                   No olvides revisar el progreso y completar cualquier trabajo pendiente.</p>

                <p>💡 <strong>Consejos:</strong></p>
                <ul>
                    <li>Revisa las dependencias de la tarea</li>
                    <li>Actualiza el progreso en tu proyecto</li>
                    <li>Comunícate con tu equipo si necesitas ayuda</li>
                </ul>

                <p>¡Mantén tu proyecto en marcha!</p>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    Este es un recordatorio automático de Gantt Manager. 
                    Si no deseas recibir estas notificaciones, puedes configurarlas en tu proyecto.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
    RECORDATORIO DE TAREA - Gantt Manager
    
    Tu tarea "${taskName}" del proyecto "${projectName}" ${daysUntilDue === 0 ? 'vence hoy' : `vence en ${daysUntilDue} día(s)`}.
    
    Fecha de vencimiento: ${dueDate}
    
    No olvides revisar el progreso y completar cualquier trabajo pendiente.
  `;

  return {
    to: userEmail,
    from: 'grimoldiignacio@gmail.com', // Usar el email verificado del usuario
    subject,
    html,
    text
  };
}