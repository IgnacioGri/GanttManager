import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, BarChart3, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Gantt Manager
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Gestiona tus proyectos con facilidad. Crea diagramas de Gantt interactivos, 
            organiza tareas con etiquetas y mantén tu equipo sincronizado.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Iniciar Sesión
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CalendarDays className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Gestión de Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Crea y administra múltiples proyectos con fechas inteligentes y dependencias automáticas.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Sistema de Etiquetas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organiza tareas con etiquetas personalizadas y colores para una mejor visualización.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Diagramas Interactivos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualiza el progreso con diagramas de Gantt dinámicos y herramientas de análisis.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Datos Seguros</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tus proyectos están protegidos con autenticación segura y almacenamiento en la nube.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Listo para comenzar?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Inicia sesión para acceder a todas las funcionalidades de gestión de proyectos.
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full"
              size="lg"
            >
              Acceder a mi cuenta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}