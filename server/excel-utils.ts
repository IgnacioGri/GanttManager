import * as XLSX from 'xlsx';
import type { InsertTask, InsertProject } from '@shared/schema';

export interface ExcelTaskData {
  name: string;
  startDate: string;
  endDate: string;
  progress: number | null;
  dependencies?: string;
  tags?: string;
  comments?: string;
}

export function parseExcelFile(buffer: Buffer): ExcelTaskData[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: ['name', 'startDate', 'endDate', 'progress', 'dependencies', 'tags', 'comments'],
      range: 1 // Skip header row
    });

    return jsonData.map((row: any) => ({
      name: row.name || '',
      startDate: formatExcelDate(row.startDate),
      endDate: formatExcelDate(row.endDate),
      progress: row.progress ? parseProgress(row.progress) : null,
      dependencies: row.dependencies || '',
      tags: row.tags || '',
      comments: row.comments || ''
    })).filter(task => task.name.trim() !== '' && task.startDate && task.endDate);
  } catch (error) {
    throw new Error('Error parsing Excel file: ' + (error as Error).message);
  }
}

function formatExcelDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  // If it's already a string in YYYY-MM-DD format
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // If it's a string in DD/MM/YYYY format
  if (typeof dateValue === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
    const [day, month, year] = dateValue.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If it's an Excel serial number
  if (typeof dateValue === 'number') {
    const excelDate = XLSX.SSF.parse_date_code(dateValue);
    return `${excelDate.y}-${excelDate.m.toString().padStart(2, '0')}-${excelDate.d.toString().padStart(2, '0')}`;
  }
  
  // Fallback: try to parse as Date
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  // Default to today if all parsing fails
  return new Date().toISOString().split('T')[0];
}

function parseProgress(progressValue: any): number {
  if (typeof progressValue === 'number') {
    return Math.max(0, Math.min(100, progressValue));
  }
  
  if (typeof progressValue === 'string') {
    const parsed = parseFloat(progressValue.replace('%', ''));
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(100, parsed));
    }
  }
  
  return 0;
}

export function generateExcelTemplate(): Buffer {
  const templateData = [
    ['Nombre de Tarea', 'Fecha Inicio', 'Fecha Fin', 'Progreso (%)', 'Dependencias', 'Etiquetas', 'Comentarios'],
    ['Planificación inicial', '01/02/2025', '05/02/2025', '', '', '', ''],
    ['Desarrollo Frontend', '06/02/2025', '20/02/2025', '', '', '', ''],
    ['Desarrollo Backend', '06/02/2025', '25/02/2025', '', '', '', ''],
    ['Testing', '21/02/2025', '28/02/2025', '', '', '', ''],
    ['Deployment', '01/03/2025', '03/03/2025', '', '', '', '']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  
  // Set column widths
  worksheet['!cols'] = [
    { width: 25 }, // Nombre
    { width: 15 }, // Fecha Inicio
    { width: 15 }, // Fecha Fin
    { width: 12 }, // Progreso
    { width: 15 }, // Dependencias
    { width: 20 }, // Etiquetas
    { width: 30 }  // Comentarios
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tareas');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function convertExcelToTasks(
  excelData: ExcelTaskData[], 
  projectId: number,
  existingTags: { id: number; name: string }[] = []
): { tasks: Omit<InsertTask, 'projectId'>[], tagNames: string[] } {
  const allTagNames = new Set<string>();
  
  const tasks = excelData.map((row, index) => {
    // Parse dependencies (task IDs from Excel row numbers)
    const dependencies = row.dependencies
      ? row.dependencies.split(',').map(dep => dep.trim()).filter(dep => dep !== '')
      : [];

    // Parse tags
    const taskTags = row.tags
      ? row.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '')
      : [];
    
    taskTags.forEach(tag => allTagNames.add(tag));

    return {
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      progress: row.progress !== null ? row.progress : 0, // Default to 0 only if not specified
      dependencies,
      comments: row.comments || '',
      attachments: [],
      skipWeekends: true,
      autoAdjustWeekends: true,
      tagIds: [], // Will be populated after tags are created
      syncedTaskId: null,
      syncType: null,
      duration: calculateDuration(row.startDate, row.endDate)
    };
  });

  return {
    tasks,
    tagNames: Array.from(allTagNames)
  };
}

function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // At least 1 day, inclusive
}