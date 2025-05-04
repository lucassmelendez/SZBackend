# SpinZone Backend API

API REST desarrollada con Express.js y PostgreSQL para gestionar productos en la plataforma SpinZone.

## Requisitos previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)

## Instalación

1. Clonar el repositorio:
   ```
   git clone <url-del-repositorio>
   cd spinzone-backend
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Configurar variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto basado en `env-example`
   - Ajusta los valores según tu configuración de PostgreSQL

4. Crear la base de datos:
   - Crea una base de datos en PostgreSQL con el nombre especificado en el archivo `.env`
   - Importa el esquema SQL que se encuentra en la documentación inicial del proyecto
   - Ejecuta el script de secuencias:
     ```
     psql -U <usuario> -d <nombre-base-datos> -f src/db/sequences.sql
     ```

## Ejecución

Para iniciar el servidor en modo desarrollo:
```
npm run dev
```

Para iniciar el servidor en modo producción:
```
npm start
```

## Endpoints para Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/productos | Obtener todos los productos |
| GET | /api/productos/:id | Obtener un producto por ID |
| GET | /api/productos/search?term=<término> | Buscar productos por nombre o descripción |
| GET | /api/productos/categoria/:categoriaId | Obtener productos por categoría |
| POST | /api/productos | Crear un nuevo producto |
| PUT | /api/productos/:id | Actualizar un producto |
| PATCH | /api/productos/:id | Actualizar parcialmente un producto |
| DELETE | /api/productos/:id | Eliminar un producto |

## Estructura del Proyecto

```
/
├── src/
│   ├── config/     # Configuración de la base de datos
│   ├── controllers/ # Controladores para manejar las peticiones
│   ├── db/         # Scripts SQL
│   ├── models/     # Modelos para interactuar con la base de datos
│   ├── routes/     # Definición de rutas
│   └── index.js    # Punto de entrada de la aplicación
├── .env            # Variables de entorno (no incluidas en repositorio)
├── env-example     # Ejemplo de variables de entorno
├── package.json    # Dependencias y scripts
└── README.md       # Documentación
``` 