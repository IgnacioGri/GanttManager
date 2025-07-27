import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: number) => void;
}

export function ExcelImportModal({ isOpen, onClose, onProjectCreated }: ExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/import-excel", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to import Excel file");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Importación exitosa",
        description: "El proyecto se ha creado desde el archivo Excel.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      handleClose();
      
      // Redirect to the new project
      if (onProjectCreated && data.project?.id) {
        onProjectCreated(data.project.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error en importación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate project name from filename (not shown to user)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setProjectName(nameWithoutExt);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "Archivo requerido",
        description: "Selecciona un archivo Excel para importar.",
        variant: "destructive",
      });
      return;
    }

    // The server will use the filename as project name
    importMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setProjectName("");
    setIsUploading(false);
    onClose();
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/api/excel-template";
    link.download = "Plantilla_Gantt.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Proyecto desde Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Download */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Plantilla recomendada
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Descarga nuestra plantilla para asegurar el formato correcto de importación.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>

          {/* Info about project name */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Nombre del proyecto:</strong> Se usará automáticamente el nombre del archivo Excel como título del proyecto.
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Archivo Excel (.xlsx)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Format Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm">
            <h4 className="font-medium mb-2">Formato esperado:</h4>
            <div className="mb-2">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Columnas obligatorias:</p>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                <li>• <strong>Columna A:</strong> Nombre de la tarea</li>
                <li>• <strong>Columna B:</strong> Fecha de inicio (DD/MM/YYYY)</li>
                <li>• <strong>Columna C:</strong> Fecha de fin (DD/MM/YYYY)</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Columnas opcionales:</p>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                <li>• <strong>Columna D:</strong> Progreso (0-100, se asume 0 si está vacío)</li>
                <li>• <strong>Columna E:</strong> Dependencias (números de fila separados por comas)</li>
                <li>• <strong>Columna F:</strong> Etiquetas (separadas por comas)</li>
                <li>• <strong>Columna G:</strong> Comentarios</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || !projectName.trim() || importMutation.isPending}
              className="flex-1"
            >
              {importMutation.isPending ? (
                "Importando..."
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}