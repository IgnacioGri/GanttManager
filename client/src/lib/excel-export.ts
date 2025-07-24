import * as XLSX from 'xlsx';
import type { ProjectWithTasks } from '@shared/schema';

export async function exportToExcel(project: ProjectWithTasks): Promise<void> {
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel
  const data = project.tasks.map(task => ({
    'Task Name': task.name,
    'Start Date': task.startDate,
    'End Date': task.endDate,
    'Duration (Days)': task.duration,
    'Progress (%)': task.progress,
    'Dependencies': task.dependencies.join(', '),
    'Comments': task.comments || '',
    'Attachments': task.attachments.map(att => att.name).join(', '),
    'Skip Weekends': task.skipWeekends ? 'Yes' : 'No',
    'Auto Adjust Weekends': task.autoAdjustWeekends ? 'Yes' : 'No',
    'Created': new Date(task.createdAt).toLocaleDateString(),
    'Last Updated': new Date(task.updatedAt).toLocaleDateString()
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Task Name
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
    { wch: 15 }, // Duration
    { wch: 12 }, // Progress
    { wch: 20 }, // Dependencies
    { wch: 30 }, // Comments
    { wch: 25 }, // Attachments
    { wch: 15 }, // Skip Weekends
    { wch: 18 }, // Auto Adjust Weekends
    { wch: 12 }, // Created
    { wch: 12 }  // Last Updated
  ];
  worksheet['!cols'] = columnWidths;

  // Style the header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:L1');
  
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellRef]) continue;
    
    worksheet[cellRef].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  // Style data rows with alternating colors
  for (let row = 1; row <= range.e.r; row++) {
    const isEvenRow = row % 2 === 0;
    const fillColor = isEvenRow ? "F8FAFC" : "FFFFFF";
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellRef]) continue;
      
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: fillColor } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } }
        }
      };
      
      // Special formatting for progress column
      if (col === 4) { // Progress column
        const progressValue = worksheet[cellRef].v as number;
        let progressColor = "EF4444"; // Red for low progress
        
        if (progressValue >= 75) progressColor = "10B981"; // Green for high progress
        else if (progressValue >= 50) progressColor = "F59E0B"; // Yellow for medium progress
        else if (progressValue >= 25) progressColor = "F97316"; // Orange for low-medium progress
        
        worksheet[cellRef].s.font = { color: { rgb: progressColor }, bold: true };
      }
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  
  // Create project summary sheet
  const summaryData = [
    ['Project Name', project.name],
    ['Start Date', project.startDate],
    ['End Date', project.endDate],
    ['Total Tasks', project.tasks.length],
    ['Completed Tasks', project.tasks.filter(t => t.progress === 100).length],
    ['Average Progress', Math.round(project.tasks.reduce((sum, t) => sum + t.progress, 0) / project.tasks.length) + '%'],
    ['Tasks with Dependencies', project.tasks.filter(t => t.dependencies.length > 0).length],
    ['Tasks with Attachments', project.tasks.filter(t => t.attachments.length > 0).length],
    ['Export Date', new Date().toLocaleDateString()],
    ['Export Time', new Date().toLocaleTimeString()]
  ];
  
  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
  
  // Style summary sheet
  for (let row = 0; row < summaryData.length; row++) {
    const labelCell = XLSX.utils.encode_cell({ r: row, c: 0 });
    const valueCell = XLSX.utils.encode_cell({ r: row, c: 1 });
    
    if (summaryWorksheet[labelCell]) {
      summaryWorksheet[labelCell].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F1F5F9" } },
        alignment: { horizontal: "right", vertical: "center" }
      };
    }
    
    if (summaryWorksheet[valueCell]) {
      summaryWorksheet[valueCell].s = {
        alignment: { horizontal: "left", vertical: "center" }
      };
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Project Summary');
  
  // Generate filename with project name and date
  const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_Gantt_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Write and download file
  XLSX.writeFile(workbook, filename);
}

export function exportTasksToCSV(project: ProjectWithTasks): void {
  const csvData = project.tasks.map(task => [
    task.name,
    task.startDate,
    task.endDate,
    task.duration,
    task.progress,
    task.dependencies.join('; '),
    task.comments?.replace(/[\r\n,]/g, ' ') || '',
    task.attachments.map(att => att.name).join('; '),
    task.skipWeekends ? 'Yes' : 'No',
    task.autoAdjustWeekends ? 'Yes' : 'No'
  ]);
  
  const headers = [
    'Task Name',
    'Start Date', 
    'End Date',
    'Duration (Days)',
    'Progress (%)',
    'Dependencies',
    'Comments',
    'Attachments',
    'Skip Weekends',
    'Auto Adjust Weekends'
  ];
  
  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${project.name}_tasks.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
