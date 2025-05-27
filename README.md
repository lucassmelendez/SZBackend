# 🔄 SpinZone Backend API

![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

API REST para la plataforma SpinZone, desarrollada con Express.js y Supabase (PostgreSQL) para gestionar productos, usuarios, categorías y transacciones.

## 📋 Índice

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [API Endpoints](#api-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [Despliegue](#despliegue)
- [Seguridad](#seguridad)
- [Contribución](#contribución)
- [Licencia](#licencia)

## ✨ Características

- Gestión completa de productos (CRUD)
- Autenticación y autorización con JWT
- Integración con Supabase para almacenamiento de datos
- Integración con API de Transbank para procesamiento de pagos
- Sistema de búsqueda y filtrado de productos
- Endpoints optimizados para rendimiento
- Manejo centralizado de errores

## 🔧 Requisitos Previos

- Node.js (v14 o superior)
- [Cuenta de Supabase](https://supabase.com/) (reemplaza a PostgreSQL local)
- [Cuenta de Transbank](https://www.transbankdevelopers.cl/) (opcional, para procesamiento de pagos)

## 💻 Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/lucassmelendez/SZBackend.git
   cd SZBackend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-api-key-supabase

# JWT Secret
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRES_IN=24h

# Configuración Transbank (opcional)
TRANSBANK_COMMERCE_CODE=tu_codigo_de_comercio
TRANSBANK_API_KEY=tu_api_key
TRANSBANK_ENVIRONMENT=TEST  # o PRODUCTION
```

### Configuración de Supabase

1. Crea una cuenta en [Supabase](https://supabase.com/)
2. Crea un nuevo proyecto
3. En el SQL Editor, ejecuta los siguientes scripts para crear las tablas necesarias:

#### Tabla `productos`
```sql
CREATE TABLE productos (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  peso VARCHAR(20) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  categoria_id INTEGER NOT NULL,
  imagen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla `categorias`
```sql
CREATE TABLE categorias (
  id_categoria SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion TEXT
);
```

#### Tabla `usuarios`
```sql
CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(20) DEFAULT 'cliente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 Ejecución

Para iniciar el servidor en modo desarrollo (con recarga automática):
```bash
npm run dev
```

Para iniciar el servidor en modo producción:
```bash
npm start
```

## 📡 API Endpoints

### Productos

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|--------------|
| GET | `/api/productos` | Obtener todos los productos | No |
| GET | `/api/productos/:id` | Obtener un producto por ID | No |
| GET | `/api/productos/search?term=<término>` | Buscar productos por nombre o descripción | No |
| GET | `/api/productos/categoria/:categoriaId` | Obtener productos por categoría | No |
| POST | `/api/productos` | Crear un nuevo producto | Sí, Admin |
| PUT | `/api/productos/:id` | Actualizar un producto | Sí, Admin |
| PATCH | `/api/productos/:id` | Actualizar parcialmente un producto | Sí, Admin |
| DELETE | `/api/productos/:id` | Eliminar un producto | Sí, Admin |

### Autenticación

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|--------------|
| POST | `/api/auth/register` | Registrar un nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/profile` | Obtener perfil del usuario | Sí |
| POST | `/api/auth/refresh-token` | Renovar token de acceso | No |

### Categorías

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|--------------|
| GET | `/api/categorias` | Obtener todas las categorías | No |
| GET | `/api/categorias/:id` | Obtener una categoría por ID | No |
| POST | `/api/categorias` | Crear una nueva categoría | Sí, Admin |
| PUT | `/api/categorias/:id` | Actualizar una categoría | Sí, Admin |
| DELETE | `/api/categorias/:id` | Eliminar una categoría | Sí, Admin |

## 📁 Estructura del Proyecto

```
/
├── src/
│   ├── config/        # Configuración de la aplicación y conexiones
│   ├── controllers/   # Controladores para manejar las peticiones
│   ├── middleware/    # Middleware para autenticación y validación
│   ├── models/        # Modelos para interactuar con la base de datos
│   ├── routes/        # Definición de rutas API
│   ├── utils/         # Utilidades y funciones helper
│   └── index.js       # Punto de entrada de la aplicación
├── .env               # Variables de entorno (no incluidas en repositorio)
├── .gitignore         # Archivos ignorados por git
├── package.json       # Dependencias y scripts
├── vercel.json        # Configuración para despliegue en Vercel
└── README.md          # Esta documentación
```

## 🌐 Despliegue

### Despliegue en Vercel

Este proyecto está configurado para desplegarse fácilmente en Vercel:

1. Instala CLI de Vercel:
   ```bash
   npm i -g vercel
   ```

2. Despliega:
   ```bash
   vercel
   ```

3. Para despliegue en producción:
   ```bash
   vercel --prod
   ```

La API estará disponible en: https://sz-backend.vercel.app

### Despliegue en otros servicios

Para desplegar en otros servicios como Heroku, Railway o Render, sigue la documentación específica de cada plataforma, asegurándote de configurar las variables de entorno correctamente.

## 🔒 Seguridad

- La autenticación se realiza mediante tokens JWT
- Las contraseñas se encriptan con bcrypt antes de almacenarse
- Se implementan cabeceras de seguridad mediante middleware
- CORS configurado para permitir solo orígenes específicos

## 👥 Contribución

1. Haz un fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz commit (`git commit -am 'Añade nueva funcionalidad'`)
4. Sube tus cambios (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ para SpinZone © 2024