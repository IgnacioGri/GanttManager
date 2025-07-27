import { storage } from './storage';
import { sendEmail, generateTaskDueEmail } from './emailService';
// Simple date formatter for server-side use
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// Configuración de notificaciones por defecto
const DEFAULT_NOTIFICATION_DAYS = [1, 3]; // Notificar 1 y 3 días antes

export async function checkTaskDeadlines(): Promise<void> {
  console.log("🔍 Checking task deadlines for notifications...");
  
  try {
    // Obtener todas las tareas que no están completadas
    const allTasks = await storage.getAllTasksForNotifications();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let notificationsSent = 0;

    for (const task of allTasks) {
      // Saltar tareas completadas
      if (task.progress >= 100) continue;
      
      const taskEndDate = new Date(task.endDate);
      taskEndDate.setHours(0, 0, 0, 0);
      
      const timeDiff = taskEndDate.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Verificar si debemos notificar hoy
      const shouldNotify = DEFAULT_NOTIFICATION_DAYS.includes(daysUntilDue) || daysUntilDue === 0;
      
      if (shouldNotify && daysUntilDue >= 0) {
        // Obtener información del usuario y proyecto
        const user = await storage.getUser(task.userId);
        const project = await storage.getProject(task.projectId, task.userId);
        
        if (user?.email && project) {
          const emailParams = generateTaskDueEmail(
            user.email,
            task.name,
            project.name,
            formatDate(task.endDate),
            daysUntilDue
          );
          
          const emailSent = await sendEmail(emailParams);
          if (emailSent) {
            notificationsSent++;
            console.log(`✅ Notification sent to ${user.email} for task: ${task.name}`);
          }
        }
      }
    }
    
    console.log(`📧 Task deadline check completed. ${notificationsSent} notifications sent.`);
  } catch (error) {
    console.error("❌ Error checking task deadlines:", error);
  }
}

// Función para configurar el cron job diario
export function setupDailyNotifications(): void {
  // Ejecutar a las 9:00 AM todos los días
  const targetHour = 9;
  const targetMinute = 0;
  
  function scheduleNext() {
    const now = new Date();
    const next = new Date();
    next.setHours(targetHour, targetMinute, 0, 0);
    
    // Si ya pasó la hora de hoy, programar para mañana
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    const msUntilNext = next.getTime() - now.getTime();
    
    setTimeout(async () => {
      await checkTaskDeadlines();
      scheduleNext(); // Programar el siguiente
    }, msUntilNext);
    
    console.log(`⏰ Next notification check scheduled for: ${next.toLocaleString()}`);
  }
  
  scheduleNext();
}

// Función para pruebas manuales
export async function testNotifications(): Promise<void> {
  console.log("🧪 Testing notification system...");
  
  try {
    // Enviar un email de prueba directo
    const testEmailParams = generateTaskDueEmail(
      'grimoldiignacio@gmail.com',
      'Tarea de Prueba',
      'Proyecto de Prueba',
      '28/01/25',
      1
    );
    
    const emailSent = await sendEmail(testEmailParams);
    if (emailSent) {
      console.log("✅ Test email sent successfully to grimoldiignacio@gmail.com");
    } else {
      console.log("❌ Failed to send test email");
    }
  } catch (error) {
    console.error("❌ Error in test notifications:", error);
  }
}