# Mantenedor Convenios Pullman

## Propósito
Este mantenedor permite administrar la plataforma de venta de pasajes por convenios de Pullman.

El sistema centraliza la gestión de entidades relacionadas con beneficios y convenios, además de permitir la exportación de información y la visualización de documentación asociada a cada beneficiario (por ejemplo, imágenes para Adultos Mayores y Estudiantes).

El frontend consume un backend externo que gestiona tanto el mantenedor administrativo como la plataforma de venta.

Secciones Disponibles:
- Boletos → Exportación de información.
- Empresas → CRUD.
- Convenios → CRUD.
- apis → CRUD.
- Beneficios
- Adultos Mayores → CRUD.
- Estudiantes → CRUD.
- Usuarios Frecuentes → CRUD.
- Carabineros → CRUD.
- Usuarios → CRUD.
- Pasajeros → CRUD.

## Arquitectura 
El proyecto sigue una separación por responsabilidades para mantener orden y escalabilidad.

Estructura principal:
- /app
  - Contiene rutas y páginas principales de la aplicación.

- /components/modals
  - Modales reutilizables para:
    - Creación
    - Actualización
    - Visualización de detalles
    - Visualización de documentos
    - Cuando aplica, se utiliza validación con zod.

- /constants/navigation
  - Archivo JSON centralizado que define rutas para:
    - Sidebar
    - Mobile sidebar
    - NavSearch
    - Control de visibilidad según rol de usuario

- /lib/api
  - Cliente HTTP que:
    - Configura la URL base
    - Inyecta el token en cada request

- /services
  - Capa de conexión con el backend.
  - Cada servicio encapsula sus endpoints y sus tipos asociados.

- /utils
  - Funciones auxiliares como:
    - Exportación a CSV y XLSX
    - Conversión de imágenes a base64
    - Formateo de fechas
    - Helpers reutilizables


## Flujo
1. El usuario se autentica en la página principal.
2. Es redirigido al dashboard.
3. Selecciona una sección desde el menú de navegación.
4. La página carga los datos utilizando el servicio correspondiente.
5. El usuario realiza una acción:
   - Crear
   - Actualizar
   - Ver detalles
   - Exportar información

6. Cada acción se gestiona mediante un modal específico que:
   - Recibe los datos necesarios
   - Valida la información (cuando aplica)
   - Ejecuta la operación contra el backend

## cómo levantar
1. Clonar el repositorio.
2. Instalar dependencias:
```bash
npm install
```
3. Crear archivo .env en la raíz del proyecto:
```.env
NEXT_PUBLIC_API_URL=ruta_del_backend
```
4. Ejecutar el servidor de desarrollo:
```bash
npm run dev
```