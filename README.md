# TribuScript

Sistema de administracion de club multidisciplinario. Permite gestionar miembros, disciplinas, clases, pagos, asistencia y reportes.

## Stack

- **Backend:** Node.js 20 + Express 4
- **Base de datos:** PostgreSQL 16
- **ORM:** Prisma
- **Cache / Colas:** Redis + BullMQ
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Testing:** Jest + Supertest

## Requisitos Previos

- [Node.js](https://nodejs.org/) >= 20 LTS
- [PostgreSQL](https://www.postgresql.org/) >= 16
- [Redis](https://redis.io/) >= 7
- [npm](https://www.npmjs.com/) >= 10 (o [pnpm](https://pnpm.io/))

O bien, usar Docker para levantar PostgreSQL y Redis sin instalarlos localmente.

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/marianoglc/TribuScript.git
cd TribuScript
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes:

```env
NODE_ENV=development
PORT=3000

# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/tribuscript

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=cambiar-por-secreto-seguro
JWT_REFRESH_SECRET=cambiar-por-otro-secreto-seguro
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
EMAIL_FROM=Club TribuScript <club@email.com>

# URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### 4. Levantar servicios con Docker (opcional)

Si no tenes PostgreSQL y Redis instalados localmente:

```bash
docker compose up -d
```

Esto levanta PostgreSQL en el puerto `5432` y Redis en el puerto `6379`.

### 5. Ejecutar migraciones de base de datos

```bash
npx prisma migrate dev
```

### 6. (Opcional) Cargar datos iniciales

```bash
npx prisma db seed
```

### 7. Iniciar el servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Produccion
npm start
```

El servidor estara disponible en `http://localhost:3000`.

### 8. Iniciar el frontend

```bash
cd client
npm install
npm run dev
```

El frontend estara disponible en `http://localhost:5173`.

## Scripts Disponibles

| Comando              | Descripcion                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Inicia el backend en modo desarrollo       |
| `npm start`          | Inicia el backend en modo produccion       |
| `npm test`           | Ejecuta los tests                          |
| `npm run test:watch` | Ejecuta tests en modo watch                |
| `npm run lint`       | Ejecuta el linter (ESLint)                 |
| `npm run format`     | Formatea el codigo (Prettier)              |
| `npx prisma studio`  | Abre Prisma Studio (explorador visual de BD) |

## Estructura del Proyecto

```
tribuscript/
├── prisma/                  # Schema y migraciones de BD
├── src/
│   ├── index.js             # Entry point
│   ├── app.js               # Configuracion Express
│   ├── config/              # Conexiones (BD, Redis, env)
│   ├── middleware/           # Auth, RBAC, validacion, errores
│   ├── modules/             # Modulos de negocio
│   │   ├── auth/
│   │   ├── members/
│   │   ├── disciplines/
│   │   ├── plans/
│   │   ├── classes/
│   │   ├── enrollments/
│   │   ├── attendance/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── notifications/
│   ├── utils/               # Helpers (paginacion, logger, etc.)
│   └── jobs/                # Workers asincrono (emails, cuotas)
├── client/                  # Frontend React + Vite
├── tests/                   # Tests unitarios e integracion
├── docker-compose.yml
├── .env.example
└── SPEC.md                  # Especificacion tecnica completa
```

## Documentacion

- **[SPEC.md](./SPEC.md)** — Especificacion tecnica completa (modulos, entidades, API endpoints, flujos)
- **Swagger UI** — Disponible en `http://localhost:3000/api/docs` cuando el servidor esta corriendo

## Licencia

MIT
