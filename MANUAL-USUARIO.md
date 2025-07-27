# Manual de Usuario - Gantt Manager

## Índice
1. [Introducción](#introducción)
2. [Gestión de Proyectos](#gestión-de-proyectos)
3. [Gestión de Tareas](#gestión-de-tareas)
4. [Sistema de Tags](#sistema-de-tags)
5. [Dependencias y Sincronización](#dependencias-y-sincronización)
6. [Progreso y Seguimiento](#progreso-y-seguimiento)
7. [Comentarios y Archivos](#comentarios-y-archivos)
8. [Configuraciones Avanzadas](#configuraciones-avanzadas)
9. [Exportación e Importación de Datos](#exportación-e-importación-de-datos)
10. [Consejos y Trucos](#consejos-y-trucos)

## Introducción

**Gantt Manager** es una herramienta completa de gestión de proyectos que permite crear, visualizar y gestionar diagramas de Gantt de manera intuitiva. Es perfecta para:

- Planificar proyectos de cualquier tamaño
- Establecer dependencias entre tareas
- Realizar seguimiento del progreso
- Gestionar equipos y recursos
- Exportar información para reportes

### Características Principales
- ✅ Diagramas de Gantt interactivos
- ✅ Sistema de dependencias avanzado
- ✅ Sincronización de tareas
- ✅ Sistema de tags con colores
- ✅ Comentarios y archivos adjuntos
- ✅ Exportación a Excel
- ✅ Manejo inteligente de fechas y fines de semana

## Gestión de Proyectos

### Crear un Nuevo Proyecto

1. En la barra lateral, busca la sección "PROJECT ACTIONS"
2. Haz clic en el menú desplegable "Project Actions"
3. Selecciona "New Project"
4. Completa los campos requeridos:
   - **Nombre del proyecto** (obligatorio)
   - **Fecha de inicio** (obligatorio)
   - **Fecha de fin** (opcional para nuevos proyectos)

### Editar Proyecto Existente

**Cambiar Nombre del Proyecto:**
- Haz clic en el nombre del proyecto en la esquina superior derecha
- El nombre se convierte en un campo editable
- Presiona Enter para guardar o Escape para cancelar

**Editar Fechas:**
- Las fechas del proyecto se calculan automáticamente basándose en las tareas
- La fecha de fin se actualiza automáticamente con la tarea que termine más tarde

### Navegación entre Proyectos

1. Usa el botón "Browse Projects" en el menú "Project Actions"
2. Selecciona el proyecto deseado de la lista
3. El sistema cargará automáticamente todas las tareas del proyecto

### Eliminar Proyecto

⚠️ **Advertencia**: Esta acción no se puede deshacer y eliminará todas las tareas asociadas.

1. En el menú "Project Actions"
2. Selecciona "Delete Project"
3. Confirma la acción en el diálogo de confirmación

## Gestión de Tareas

### Crear Nueva Tarea

1. Haz clic en "Add New Task" en la sección "TASK ACTIONS"
2. Se abrirá el modal de creación de tareas
3. Completa la información básica:
   - **Nombre de la tarea** (obligatorio)
   - **Configuración de fechas** (ver modos abajo)
   - **Duración en días**
   - **Progreso** (0-100%)

### Modos de Configuración de Fechas

#### 🟦 Modo Manual
- **Cuándo usar**: Para tareas independientes con fechas específicas
- **Características**:
  - Selección libre de fechas de inicio y fin
  - Entrada manual en formato DD/MM/AA
  - Selector de calendario disponible
  - Control total sobre la programación

#### 🟨 Modo Dependiente
- **Cuándo usar**: Para tareas que deben esperar a que otras terminen
- **Características**:
  - Selecciona una o múltiples tareas como dependencias
  - Configura días adicionales después de que terminen las dependencias
  - Las fechas se calculan automáticamente
  - Útil para flujos de trabajo secuenciales

**Configuración**:
1. Selecciona "Start after another task"
2. Usa el buscador para encontrar tareas dependientes
3. Configura días de offset (opcional)
4. Las fechas se actualizarán automáticamente

#### 🟩 Modo Sincronizado
- **Cuándo usar**: Para tareas que deben ocurrir al mismo tiempo
- **Características**:
  - Se sincroniza con otra tarea existente
  - Tres tipos de sincronización disponibles
  - Hereda configuraciones de la tarea de referencia

**Tipos de Sincronización**:
- **Inicio Conjunto**: Ambas tareas comienzan el mismo día
- **Fin Conjunto**: Ambas tareas terminan el mismo día  
- **Inicio y Fin Conjuntos**: Tareas idénticas en fechas y duración

### Editar Tareas

**Desde la Lista de Tareas**:
- Haz clic en el nombre de cualquier tarea
- Se abrirá el modal de edición con toda la información

**Desde el Menú Contextual**:
- Haz clic en los tres puntos (⋯) junto a cualquier tarea
- Selecciona "Edit Task"

**Edición Directa en el Gantt**:
- Arrastra las barras del Gantt para cambiar fechas
- Los cambios se guardan automáticamente

### Eliminar Tareas

1. Usa el menú contextual (⋯) de la tarea
2. Selecciona "Delete Task"
3. Confirma la acción
4. Las dependencias se actualizarán automáticamente

## Sistema de Tags

### ¿Qué son los Tags?

Los tags son etiquetas de colores que puedes asignar a las tareas para:
- Categorizar por tipo de trabajo
- Identificar responsables
- Marcar prioridades
- Agrupar por fases del proyecto

### Crear Tags

1. En la barra lateral, busca la sección "Gestión de Tags"
2. Haz clic en "Crear Nuevo Tag"
3. Configura:
   - **Nombre del tag** (ej: "Alta Prioridad", "Equipo Frontend")
   - **Color personalizado** (haz clic en el círculo de color)
4. Haz clic en "Crear Tag"

### Editar Tags Existentes

1. En la lista de tags, haz clic en el ícono de edición (✏️)
2. Modifica el nombre o color
3. Guarda los cambios

### Eliminar Tags

⚠️ Se eliminará el tag de todas las tareas que lo tengan asignado.

1. Haz clic en el ícono de eliminar (🗑️) junto al tag
2. Confirma la acción

### Asignar Tags a Tareas

**En el Modal de Creación/Edición**:
1. Busca la sección "Tags" en el modal
2. Haz clic en los tags que quieras asignar
3. Los tags seleccionados se muestran con su color de fondo
4. Puedes asignar múltiples tags a una sola tarea

### Visualización de Tags

En la lista de tareas, los tags aparecen como:
- **Pequeños círculos de colores** debajo del nombre de la tarea
- **Máximo 3 visibles** por defecto
- **Tooltip al pasar el mouse** mostrando el nombre del tag
- **Indicador "+X"** si hay más tags de los que se muestran

## Dependencias y Sincronización

### Dependencias de Tareas

Las dependencias crean relaciones donde una tarea debe esperar a que otras terminen.

**Configuración Avanzada**:
- **Dependencias múltiples**: Selecciona varias tareas como dependencias
- **Días de offset**: Agrega días adicionales después de que terminen todas las dependencias
- **Cálculo automático**: Las fechas se recalculan automáticamente cuando cambian las tareas dependientes

**Ejemplo Práctico**:
```
Tarea A: "Diseño UI" (1-15 enero)
Tarea B: "Desarrollo Frontend" 
  - Depende de: Tarea A
  - Offset: 2 días
  - Resultado: Comienza el 18 enero
```

### Sincronización de Tareas

La sincronización mantiene tareas alineadas en el tiempo.

**Casos de Uso**:
- **Trabajo en paralelo**: Desarrollo Frontend y Backend al mismo tiempo
- **Reuniones coordinadas**: Reuniones que deben ocurrir en fechas específicas
- **Entregas simultáneas**: Componentes que deben completarse juntos

**Herencia de Configuraciones**:
Cuando sincronizas una tarea, automáticamente hereda:
- Configuraciones de fin de semana
- Ajustes de fechas
- Duración (en modo "Inicio y Fin Conjuntos")

## Progreso y Seguimiento

### Actualizar Progreso

1. Abre el modal de edición de cualquier tarea
2. Usa el deslizador de "Progress" 
3. Establece el porcentaje completado (0-100%)
4. El cambio se refleja inmediatamente en:
   - La barra de progreso en la lista
   - La transparencia de la barra del Gantt
   - El cálculo del progreso general del proyecto

### Indicadores Visuales

**En las Barras del Gantt**:
- **Colores por fase**:
  - 🟣 Púrpura: Planificación
  - 🔵 Cian: Diseño/UI/UX
  - 🔵 Azul: Desarrollo
  - 🟡 Ámbar: Testing/QA
  - 🟢 Verde: Deployment/Launch
- **Transparencia por progreso**: Más progreso = más transparente

**En la Lista de Tareas**:
- **Barra de progreso**: Indica el porcentaje visual
- **Indicadores de contenido**:
  - 🔵 Punto azul: Tiene comentarios
  - 🟡 Punto ámbar: Tiene archivos adjuntos

### Filtros de Estado

Usa los filtros en la parte superior del Gantt:
- **All Tasks**: Muestra todas las tareas
- **Pending**: Solo tareas sin progreso (0%)
- **In Progress**: Tareas en desarrollo (1-99%)
- **Completed**: Tareas terminadas (100%)

## Comentarios y Archivos

### Sistema de Comentarios

**Agregar Comentarios**:
1. En el menú contextual (⋯) de cualquier tarea
2. Selecciona "Add Comment"
3. Escribe tus observaciones, notas o actualizaciones
4. Los comentarios se guardan automáticamente

**Casos de Uso para Comentarios**:
- Notas de progreso
- Problemas encontrados
- Decisiones importantes
- Comunicación del equipo

### Gestión de Archivos

**Subir Archivos**:
1. En el modal de edición de tareas, busca la sección "Attachments"
2. Arrastra archivos a la zona de carga o haz clic para seleccionar
3. **Formatos soportados**: PDF, DOCX, DOC
4. **Tamaño máximo**: 10MB por archivo

**Gestionar Archivos**:
- **Descargar**: Haz clic en el ícono de descarga (⬇️)
- **Eliminar**: Haz clic en el ícono X para remover el archivo
- **Vista previa**: Se muestra el nombre y tamaño del archivo

**Almacenamiento**:
- Los archivos se codifican y almacenan directamente en la tarea
- No requieren servidor de archivos externo
- Acceso inmediato desde cualquier dispositivo

## Configuraciones Avanzadas

### Opciones de Fechas y Fines de Semana

**Skip weekends in duration calculation**:
- ✅ **Activado**: La duración se calcula solo en días laborables (lunes a viernes)
- ❌ **Desactivado**: Incluye fines de semana en el cálculo de duración

**Auto-adjust start date if falls on weekend**:
- ✅ **Activado**: Tareas que caen en sábado/domingo se mueven automáticamente al lunes siguiente
- ❌ **Desactivado**: Respeta exactamente las fechas seleccionadas

### Escalas de Timeline

Cambia la vista temporal usando los controles superiores:

- **Day**: Vista detallada día por día (recomendado para proyectos cortos)
- **Week**: Vista por semanas (ideal para proyectos de 1-6 meses)
- **Month**: Vista mensual (para proyectos largos o planificación de alto nivel)

### Modo Pantalla Completa

- Usa el botón de maximizar para ocultar la barra lateral
- Aprovecha toda la pantalla para el diagrama de Gantt
- Útil para presentaciones o análisis detallado

### Barra Lateral Colapsable

- Haz clic en la flecha (◀️/▶️) para contraer/expandir
- Modo contraído muestra solo íconos principales
- Libera espacio para el Gantt sin perder funcionalidad

## Exportación e Importación de Datos

### Exportar a Excel

1. En el menú "Project Actions"
2. Selecciona "Export Excel"
3. Se descargará un archivo `.xlsx` con:
   - Lista completa de tareas
   - Fechas de inicio y fin
   - Progreso y duración
   - Dependencias
   - Información de tags
   - Formato compatible con Excel y Google Sheets

**Casos de Uso**:
- Reportes para gerencia
- Presentaciones de estado
- Backup de información
- Análisis externo de datos

### Importar desde Excel

Gantt Manager permite crear proyectos completos importando datos desde archivos de Excel (.xlsx).

#### Descargar Plantilla

1. En el menú "Project Actions"
2. Selecciona "Download Excel Template"
3. Se descargará un archivo `Plantilla_Gantt.xlsx` con:
   - Estructura de columnas predefinida
   - Ejemplos de datos
   - Formato correcto para fechas y dependencias

#### Estructura de la Plantilla

**Columnas Obligatorias** (mínimo requerido):
- **Nombre**: Nombre de la tarea
- **Fecha Inicio**: Formato DD/MM/YYYY
- **Fecha Fin**: Formato DD/MM/YYYY

**Columnas Opcionales**:
- **Progreso**: Porcentaje de 0 a 100
- **Dependencias**: Nombres de tareas separados por comas
- **Tags**: Etiquetas separadas por comas
- **Comentarios**: Notas adicionales sobre la tarea

#### Proceso de Importación

1. **Preparar el archivo Excel**:
   - Usa la plantilla descargada como base
   - Completa las columnas obligatorias para cada tarea
   - Asegúrate de usar el formato de fecha DD/MM/YYYY
   - Para dependencias, usa los nombres exactos de otras tareas

2. **Importar el archivo**:
   - En el menú "Project Actions"
   - Selecciona "Import Excel"
   - Selecciona tu archivo .xlsx preparado
   - El sistema creará automáticamente:
     - Un nuevo proyecto con el nombre del archivo
     - Todas las tareas con sus fechas y configuraciones
     - Tags con colores automáticos
     - Dependencias entre tareas

3. **Verificación post-importación**:
   - Revisa que todas las tareas se hayan importado correctamente
   - Verifica las fechas y dependencias
   - Ajusta manualmente cualquier configuración específica

#### Consejos para Importación Exitosa

**Formato de Fechas**:
- Usa siempre DD/MM/YYYY (ej: 15/03/2024)
- Evita formatos de fecha en inglés
- Las fechas inválidas causarán errores de importación

**Dependencias**:
- Los nombres de tareas deben coincidir exactamente
- Usa comas para separar múltiples dependencias
- Ejemplo: "Diseño UI, Wireframes, Prototipo"

**Tags**:
- Se crearán automáticamente si no existen
- Usa nombres descriptivos y consistentes
- Se asignarán colores aleatorios que puedes cambiar después

**Limitaciones**:
- Máximo tamaño de archivo: 10MB
- Solo archivos .xlsx (Excel moderno)
- No se importan archivos adjuntos
- Los comentarios se importan como texto simple

## Consejos y Trucos

### 🎯 Planificación Efectiva

**Comienza con lo básico**:
1. Define todas las tareas principales sin dependencias
2. Establece fechas realistas
3. Luego agrega dependencias y sincronizaciones

**Usa tags estratégicamente**:
- **Por equipo**: "Frontend", "Backend", "Design"
- **Por prioridad**: "Crítico", "Normal", "Bajo"
- **Por fase**: "Planning", "Development", "Testing"

### 📊 Gestión de Dependencias

**Evita dependencias circulares**:
- Tarea A no puede depender de Tarea B si B ya depende de A
- El sistema lo detecta automáticamente

**Usa sincronización para trabajo paralelo**:
- Tareas que deben ocurrir simultáneamente
- Mejor que dependencias cuando no hay relación secuencial

### 🔄 Mantenimiento del Proyecto

**Actualiza el progreso regularmente**:
- Mejor semanalmente o al completar hitos importantes
- Mantiene la precisión de las proyecciones

**Revisa dependencias periódicamente**:
- Las dependencias pueden cambiar según evoluciona el proyecto
- Elimina dependencias que ya no son relevantes

### 🎨 Organización Visual

**Código de colores consistente**:
- Usa los mismos tags a lo largo del proyecto
- Educa al equipo sobre el significado de cada color

**Nombres de tareas descriptivos**:
- Incluye el resultado esperado: "Completar diseño de homepage"
- Evita nombres genéricos: "Trabajo en UI"

### 📱 Productividad

**Atajos de teclado útiles**:
- **Escape**: Cerrar modales
- **Enter**: Confirmar ediciones
- **Click en nombre**: Edición rápida de tareas

**Navegación rápida**:
- Usa filtros para encontrar tareas específicas
- Cambia escalas según el nivel de detalle necesario

### 📊 Importación y Migración de Datos

**Preparación de archivos Excel**:
- Siempre descarga la plantilla oficial antes de crear tu propio archivo
- Usa nombres de tarea únicos para evitar conflictos en dependencias
- Verifica que las fechas estén en formato DD/MM/YYYY

**Migración desde otras herramientas**:
- Exporta datos desde MS Project, Asana o Trello a Excel
- Adapta las columnas al formato de la plantilla de Gantt Manager
- Importa por fases si tienes proyectos muy grandes (>100 tareas)

**Control de calidad post-importación**:
- Revisa las dependencias automáticas generadas
- Verifica que los tags se hayan creado correctamente
- Ajusta colores de tags según tu código organizacional

---

## Soporte y Ayuda

Para acceder a este manual desde la aplicación:
1. Ve al menú "Project Actions"
2. Selecciona "Manual de Usuario"
3. O navega directamente a `/help` en la URL

¿Necesitas ayuda adicional? El manual interactivo en la aplicación incluye ejemplos visuales y casos de uso específicos.