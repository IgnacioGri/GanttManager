import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Tag, FileText, Settings, Download, Users, Link, GitBranch } from "lucide-react";
import { Link as RouterLink } from "wouter";

export default function Help() {
  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterLink href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Proyecto
              </Button>
            </RouterLink>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manual de Usuario</h1>
              <p className="text-slate-600">Gantt Manager - Guía Completa</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">¿Qué es Gantt Manager?</CardTitle>
            <CardDescription>
              Gantt Manager es una herramienta de gestión de proyectos que te permite crear, visualizar y gestionar 
              diagramas de Gantt de manera intuitiva. Perfecta para planificar proyectos, establecer dependencias 
              entre tareas y realizar seguimiento del progreso.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Gestión de Proyectos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gestión de Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Crear un Nuevo Proyecto</h4>
              <p className="text-sm text-slate-600 mb-2">
                Desde la barra lateral, haz clic en "Nuevo Proyecto" para crear un proyecto desde cero.
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• Nombre del proyecto (obligatorio)</li>
                <li>• Fecha de inicio (obligatorio)</li>
                <li>• Fecha de fin (opcional para nuevos proyectos)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Editar Nombre del Proyecto</h4>
              <p className="text-sm text-slate-600">
                Haz clic en el nombre del proyecto en la esquina superior derecha para editarlo directamente.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Navegación entre Proyectos</h4>
              <p className="text-sm text-slate-600">
                Usa el botón "Ver Proyectos" en la barra lateral para cambiar entre diferentes proyectos.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Tareas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Gestión de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Crear una Nueva Tarea</h4>
              <p className="text-sm text-slate-600 mb-2">
                Haz clic en "Agregar Nueva Tarea" en la barra lateral para abrir el modal de creación.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Modos de Configuración de Fechas</h4>
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-lg p-3">
                  <Badge variant="secondary" className="mb-2">Manual</Badge>
                  <p className="text-sm text-slate-600">
                    Selecciona las fechas de inicio y fin manualmente usando el calendario o escribiendo en formato DD/MM/AA.
                  </p>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-3">
                  <Badge variant="secondary" className="mb-2">Dependiente</Badge>
                  <p className="text-sm text-slate-600">
                    La tarea comenzará automáticamente después de que terminen las tareas seleccionadas como dependencias.
                  </p>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-3">
                  <Badge variant="secondary" className="mb-2">Sincronizada</Badge>
                  <p className="text-sm text-slate-600">
                    La tarea se sincroniza con otra tarea existente (mismo inicio, mismo fin, o ambos).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Editar Tareas</h4>
              <p className="text-sm text-slate-600">
                Haz clic en el nombre de la tarea en la lista lateral o usa el menú de tres puntos para acceder a las opciones de edición.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Sistema de Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Crear Tags</h4>
              <p className="text-sm text-slate-600 mb-2">
                En la barra lateral, encuentra la sección "Gestión de Tags" para crear nuevos tags.
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• Nombre del tag</li>
                <li>• Color personalizado</li>
                <li>• Los tags son específicos de cada proyecto</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Asignar Tags a Tareas</h4>
              <p className="text-sm text-slate-600">
                En el modal de creación/edición de tareas, selecciona los tags haciendo clic en ellos. 
                Los tags seleccionados se muestran con el color de fondo correspondiente.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Visualización de Tags</h4>
              <p className="text-sm text-slate-600">
                Los tags aparecen como pequeños círculos de colores debajo del nombre de cada tarea. 
                Pasa el mouse sobre ellos para ver el nombre del tag.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dependencias y Sincronización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Dependencias y Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Dependencias de Tareas</h4>
              <p className="text-sm text-slate-600 mb-2">
                Establece que una tarea debe esperar a que otras terminen antes de comenzar.
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• Selecciona una o múltiples tareas como dependencias</li>
                <li>• Configura días adicionales después de que terminen las dependencias</li>
                <li>• Las fechas se calculan automáticamente</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Sincronización de Tareas</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm font-medium">Inicio Conjunto:</span>
                  <span className="text-sm text-slate-600">Ambas tareas comienzan el mismo día</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm font-medium">Fin Conjunto:</span>
                  <span className="text-sm text-slate-600">Ambas tareas terminan el mismo día</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm font-medium">Inicio y Fin Conjuntos:</span>
                  <span className="text-sm text-slate-600">Tareas idénticas en duración y fechas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progreso y Seguimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Progreso y Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Actualizar Progreso</h4>
              <p className="text-sm text-slate-600">
                Usa el deslizador de progreso en el modal de edición para actualizar el porcentaje completado (0-100%).
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Indicadores Visuales</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• Las barras del Gantt se vuelven más transparentes a medida que aumenta el progreso</li>
                <li>• Los colores indican diferentes fases: Planificación (púrpura), Diseño (cian), Desarrollo (azul), etc.</li>
                <li>• Puntos pequeños indican comentarios (azul) y archivos adjuntos (ámbar)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Filtros de Tareas</h4>
              <p className="text-sm text-slate-600">
                Usa los filtros en la parte superior del Gantt para mostrar solo tareas pendientes, en progreso o completadas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comentarios y Archivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comentarios y Archivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Agregar Comentarios</h4>
              <p className="text-sm text-slate-600">
                Haz clic en el icono de comentario en el menú de tres puntos de cualquier tarea para agregar notas y observaciones.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Subir Archivos</h4>
              <p className="text-sm text-slate-600 mb-2">
                En el modal de edición de tareas, arrastra archivos a la zona de carga o haz clic para seleccionarlos.
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• Formatos soportados: PDF, DOCX, DOC</li>
                <li>• Tamaño máximo: 10MB por archivo</li>
                <li>• Los archivos se almacenan directamente en la tarea</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Configuraciones Avanzadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuraciones Avanzadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Opciones de Fechas</h4>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• <strong>Saltar fines de semana:</strong> La duración se calcula solo en días laborables</li>
                <li>• <strong>Ajuste automático:</strong> Las tareas que caen en fin de semana se mueven al lunes</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Escalas de Tiempo</h4>
              <p className="text-sm text-slate-600">
                Cambia entre vista diaria, semanal o mensual usando los controles en la parte superior del Gantt.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Modo Pantalla Completa</h4>
              <p className="text-sm text-slate-600">
                Usa el botón de pantalla completa para maximizar la vista del Gantt y ocultar la barra lateral.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Exportación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportación de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Exportar a Excel</h4>
              <p className="text-sm text-slate-600 mb-2">
                Usa el botón "Exportar Excel" en la barra lateral para descargar un archivo con todos los datos del proyecto.
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• Incluye todas las tareas con fechas, progreso y dependencias</li>
                <li>• Formato compatible con Microsoft Excel y Google Sheets</li>
                <li>• Perfecto para reportes y presentaciones</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Consejos y Trucos */}
        <Card>
          <CardHeader>
            <CardTitle>Consejos y Trucos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-slate-600">
                <strong>Tip:</strong> Puedes arrastrar las barras del Gantt para cambiar fechas directamente en el gráfico.
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-slate-600">
                <strong>Planificación:</strong> Comienza siempre con las tareas que no dependen de otras, luego agrega las dependencias.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-sm text-slate-600">
                <strong>Tags:</strong> Usa tags para categorizar tareas por equipo, prioridad o fase del proyecto.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <p className="text-sm text-slate-600">
                <strong>Sincronización:</strong> Las tareas sincronizadas son útiles para actividades paralelas que deben ocurrir al mismo tiempo.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}