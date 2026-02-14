# Especificacion Tecnica: Sistema de Administracion de Club Multidisciplinario

**Proyecto:** TribuScript
**Stack:** Node.js + Express + PostgreSQL + React
**Version:** 1.0.0

---

## Tabla de Contenidos

1. [Modulos Principales](#1-modulos-principales)
2. [Entidades y Relaciones](#2-entidades-y-relaciones)
3. [Funcionalidades por Modulo](#3-funcionalidades-por-modulo)
4. [API Endpoints](#4-api-endpoints)
5. [Flujos Principales](#5-flujos-principales)
6. [Consideraciones Tecnicas](#6-consideraciones-tecnicas)

---

## 1. Modulos Principales

### 1.1 Listado de Modulos

| Modulo          | Descripcion                                                        | Prioridad |
| --------------- | ------------------------------------------------------------------ | --------- |
| **Auth**        | Autenticacion, autorizacion y gestion de sesiones (JWT + RBAC)     | P0        |
| **Members**     | Alta, baja, modificacion y consulta de miembros del club           | P0        |
| **Disciplines** | Catalogo de disciplinas ofrecidas (deportes, artes, etc.)          | P0        |
| **Plans**       | Planes de membresia con precios y disciplinas incluidas            | P0        |
| **Classes**     | Programacion de clases, horarios e instructores                    | P1        |
| **Enrollments** | Inscripciones de miembros a disciplinas y clases                   | P1        |
| **Attendance**  | Registro y control de asistencia a clases                          | P1        |
| **Payments**    | Gestion de cuotas, pagos y facturacion                             | P1        |
| **Reports**     | Reportes estadisticos y exportacion de datos                       | P2        |
| **Notifications** | Notificaciones por email y push (recordatorios, vencimientos)   | P2        |

### 1.2 Dependencias entre Modulos

```
Auth (base)
  |
  +-- Members (depende de Auth)
  |     |
  |     +-- Enrollments (depende de Members + Disciplines)
  |     |     |
  |     |     +-- Attendance (depende de Enrollments + Classes)
  |     |
  |     +-- Payments (depende de Members + Plans)
  |
  +-- Disciplines (depende de Auth)
  |     |
  |     +-- Classes (depende de Disciplines)
  |
  +-- Plans (depende de Auth + Disciplines)
  |
  +-- Reports (depende de todos los anteriores)
  |
  +-- Notifications (depende de Members + Payments + Classes)
```

### 1.3 Orden de Desarrollo Sugerido

| Fase | Modulos                        | Justificacion                                  |
| ---- | ------------------------------ | ---------------------------------------------- |
| 1    | Auth                           | Base de seguridad para todo el sistema          |
| 2    | Members, Disciplines, Plans    | Entidades core del dominio                      |
| 3    | Classes, Enrollments           | Operacion diaria del club                       |
| 4    | Payments, Attendance           | Logica de negocio transaccional                 |
| 5    | Reports, Notifications         | Funcionalidades complementarias                 |

---

## 2. Entidades y Relaciones

### 2.1 Diagrama de Relaciones

```
User 1──1 Member
Member N──M Discipline  (a traves de Enrollment)
Member N──M Class       (a traves de Attendance)
Member 1──N Payment
Member 1──1 Plan        (plan activo)

Discipline 1──N Class
Discipline N──M Plan    (a traves de PlanDiscipline)

Class N──1 Instructor (User con rol instructor)
Class 1──N Attendance

Plan 1──N Member
Plan N──M Discipline    (a traves de PlanDiscipline)
```

### 2.2 Modelo: User

Tabla de autenticacion y roles del sistema.

| Campo        | Tipo         | Requerido | Validacion                          |
| ------------ | ------------ | --------- | ----------------------------------- |
| id           | UUID         | PK        | Auto-generado                       |
| email        | VARCHAR(255) | Si        | Email valido, unico                 |
| password     | VARCHAR(255) | Si        | Min 8 chars, hash bcrypt            |
| role         | ENUM         | Si        | `admin`, `staff`, `instructor`, `member` |
| is_active    | BOOLEAN      | Si        | Default: true                       |
| last_login   | TIMESTAMP    | No        | --                                  |
| created_at   | TIMESTAMP    | Si        | Auto-generado                       |
| updated_at   | TIMESTAMP    | Si        | Auto-generado                       |

**Indices:** `email` (unique)

### 2.3 Modelo: Member

Informacion personal y de membresia del socio.

| Campo             | Tipo         | Requerido | Validacion                          |
| ----------------- | ------------ | --------- | ----------------------------------- |
| id                | UUID         | PK        | Auto-generado                       |
| user_id           | UUID         | FK → User | Unico, NOT NULL                     |
| first_name        | VARCHAR(100) | Si        | Min 2 chars                         |
| last_name         | VARCHAR(100) | Si        | Min 2 chars                         |
| dni               | VARCHAR(20)  | Si        | Unico, alfanumerico                 |
| phone             | VARCHAR(20)  | No        | Formato telefono valido             |
| date_of_birth     | DATE         | Si        | Fecha pasada                        |
| gender            | ENUM         | No        | `male`, `female`, `other`, `prefer_not_to_say` |
| address           | TEXT         | No        | --                                  |
| emergency_contact | VARCHAR(100) | No        | --                                  |
| emergency_phone   | VARCHAR(20)  | No        | Formato telefono valido             |
| photo_url         | VARCHAR(500) | No        | URL valida                          |
| plan_id           | UUID         | FK → Plan | Nullable (sin plan activo)          |
| status            | ENUM         | Si        | `active`, `inactive`, `suspended`, `trial` |
| enrollment_date   | DATE         | Si        | Auto: fecha actual                  |
| created_at        | TIMESTAMP    | Si        | Auto-generado                       |
| updated_at        | TIMESTAMP    | Si        | Auto-generado                       |

**Indices:** `user_id` (unique), `dni` (unique), `status`, `plan_id`

### 2.4 Modelo: Discipline

Disciplinas ofrecidas por el club.

| Campo        | Tipo         | Requerido | Validacion                          |
| ------------ | ------------ | --------- | ----------------------------------- |
| id           | UUID         | PK        | Auto-generado                       |
| name         | VARCHAR(100) | Si        | Unico, min 2 chars                  |
| description  | TEXT         | No        | --                                  |
| category     | ENUM         | Si        | `sport`, `art`, `wellness`, `academic`, `other` |
| max_capacity | INTEGER      | Si        | Min 1                               |
| is_active    | BOOLEAN      | Si        | Default: true                       |
| image_url    | VARCHAR(500) | No        | URL valida                          |
| created_at   | TIMESTAMP    | Si        | Auto-generado                       |
| updated_at   | TIMESTAMP    | Si        | Auto-generado                       |

**Indices:** `name` (unique), `category`, `is_active`

### 2.5 Modelo: Plan

Planes de membresia con precios y disciplinas incluidas.

| Campo             | Tipo           | Requerido | Validacion                        |
| ----------------- | -------------- | --------- | --------------------------------- |
| id                | UUID           | PK        | Auto-generado                     |
| name              | VARCHAR(100)   | Si        | Unico, min 2 chars                |
| description       | TEXT           | No        | --                                |
| price             | DECIMAL(10,2)  | Si        | Min 0                             |
| billing_period    | ENUM           | Si        | `monthly`, `quarterly`, `semi_annual`, `annual` |
| max_disciplines   | INTEGER        | No        | Null = ilimitado, min 1           |
| is_active         | BOOLEAN        | Si        | Default: true                     |
| created_at        | TIMESTAMP      | Si        | Auto-generado                     |
| updated_at        | TIMESTAMP      | Si        | Auto-generado                     |

**Indices:** `name` (unique), `is_active`

### 2.6 Modelo: PlanDiscipline (tabla pivot)

Relaciona planes con disciplinas incluidas.

| Campo         | Tipo | Requerido | Validacion            |
| ------------- | ---- | --------- | --------------------- |
| id            | UUID | PK        | Auto-generado         |
| plan_id       | UUID | FK → Plan | NOT NULL              |
| discipline_id | UUID | FK → Discipline | NOT NULL         |

**Indices:** `(plan_id, discipline_id)` (unique compuesto)

### 2.7 Modelo: Class

Clases programadas dentro de una disciplina.

| Campo         | Tipo         | Requerido | Validacion                          |
| ------------- | ------------ | --------- | ----------------------------------- |
| id            | UUID         | PK        | Auto-generado                       |
| discipline_id | UUID         | FK → Discipline | NOT NULL                       |
| instructor_id | UUID         | FK → User | NOT NULL, rol debe ser `instructor` |
| name          | VARCHAR(150) | Si        | Min 2 chars                         |
| day_of_week   | ENUM         | Si        | `monday`..`sunday`                  |
| start_time    | TIME         | Si        | Formato HH:MM                       |
| end_time      | TIME         | Si        | Debe ser mayor que start_time       |
| location      | VARCHAR(100) | No        | Nombre del salon/cancha             |
| max_capacity  | INTEGER      | Si        | Min 1, default: hereda de disciplina |
| is_active     | BOOLEAN      | Si        | Default: true                       |
| created_at    | TIMESTAMP    | Si        | Auto-generado                       |
| updated_at    | TIMESTAMP    | Si        | Auto-generado                       |

**Indices:** `discipline_id`, `instructor_id`, `day_of_week`, `is_active`

### 2.8 Modelo: Enrollment

Inscripcion de un miembro a una disciplina.

| Campo         | Tipo      | Requerido | Validacion                          |
| ------------- | --------- | --------- | ----------------------------------- |
| id            | UUID      | PK        | Auto-generado                       |
| member_id     | UUID      | FK → Member | NOT NULL                          |
| discipline_id | UUID      | FK → Discipline | NOT NULL                      |
| status        | ENUM      | Si        | `active`, `cancelled`, `completed`  |
| enrolled_at   | TIMESTAMP | Si        | Auto: fecha actual                  |
| cancelled_at  | TIMESTAMP | No        | Solo si status = cancelled          |
| created_at    | TIMESTAMP | Si        | Auto-generado                       |
| updated_at    | TIMESTAMP | Si        | Auto-generado                       |

**Indices:** `(member_id, discipline_id)` (unique compuesto donde status = active), `member_id`, `discipline_id`

### 2.9 Modelo: Attendance

Registro de asistencia de miembros a clases.

| Campo      | Tipo      | Requerido | Validacion                          |
| ---------- | --------- | --------- | ----------------------------------- |
| id         | UUID      | PK        | Auto-generado                       |
| member_id  | UUID      | FK → Member | NOT NULL                          |
| class_id   | UUID      | FK → Class  | NOT NULL                          |
| date       | DATE      | Si        | Fecha pasada o actual               |
| status     | ENUM      | Si        | `present`, `absent`, `late`, `justified` |
| notes      | TEXT      | No        | --                                  |
| checked_by | UUID      | FK → User | Quien registro la asistencia        |
| created_at | TIMESTAMP | Si        | Auto-generado                       |

**Indices:** `(member_id, class_id, date)` (unique compuesto), `date`, `class_id`

### 2.10 Modelo: Payment

Registro de pagos y cuotas.

| Campo          | Tipo           | Requerido | Validacion                        |
| -------------- | -------------- | --------- | --------------------------------- |
| id             | UUID           | PK        | Auto-generado                     |
| member_id      | UUID           | FK → Member | NOT NULL                        |
| amount         | DECIMAL(10,2)  | Si        | Mayor que 0                       |
| currency       | VARCHAR(3)     | Si        | Default: `ARS`, ISO 4217          |
| payment_method | ENUM           | Si        | `cash`, `card`, `transfer`, `other` |
| status         | ENUM           | Si        | `pending`, `completed`, `failed`, `refunded` |
| description    | VARCHAR(255)   | No        | --                                |
| period_start   | DATE           | Si        | Inicio del periodo cubierto       |
| period_end     | DATE           | Si        | Fin del periodo, mayor que start  |
| paid_at        | TIMESTAMP      | No        | Fecha efectiva de pago            |
| receipt_number | VARCHAR(50)    | No        | Unico si presente                 |
| processed_by   | UUID           | FK → User | Quien proceso el pago             |
| created_at     | TIMESTAMP      | Si        | Auto-generado                     |
| updated_at     | TIMESTAMP      | Si        | Auto-generado                     |

**Indices:** `member_id`, `status`, `period_start`, `receipt_number` (unique)

---

## 3. Funcionalidades por Modulo

### 3.1 Modulo Auth

**CRUD:**
- Registro de usuario (solo admin puede crear staff/instructores)
- Login / Logout
- Recuperacion de contrasena
- Actualizacion de perfil propio

**Logica de negocio:**
- Hasheo de contrasenas con bcrypt (salt rounds: 12)
- Generacion de JWT con expiracion configurable (access: 15min, refresh: 7d)
- Refresh token rotation
- Rate limiting en login: 5 intentos por IP cada 15 minutos
- Bloqueo automatico de cuenta despues de 10 intentos fallidos

**Roles y permisos (RBAC):**

| Permiso                    | Admin | Staff | Instructor | Member |
| -------------------------- | ----- | ----- | ---------- | ------ |
| Gestionar usuarios         | Si    | No    | No         | No     |
| Gestionar miembros         | Si    | Si    | No         | No     |
| Gestionar disciplinas      | Si    | Si    | No         | No     |
| Gestionar planes           | Si    | No    | No         | No     |
| Gestionar clases           | Si    | Si    | Propias    | No     |
| Registrar asistencia       | Si    | Si    | Propias    | No     |
| Gestionar pagos            | Si    | Si    | No         | No     |
| Ver reportes               | Si    | Si    | Propios    | No     |
| Ver perfil propio          | Si    | Si    | Si         | Si     |
| Ver clases disponibles     | Si    | Si    | Si         | Si     |
| Ver historial de pagos     | Si    | Si    | No         | Propio |

### 3.2 Modulo Members

**CRUD:**
- Crear miembro (con creacion automatica de User asociado)
- Listar miembros con paginacion, filtros y busqueda
- Ver detalle de miembro (con inscripciones, pagos, asistencia)
- Actualizar datos del miembro
- Desactivar miembro (soft delete via status)

**Logica de negocio:**
- Validacion de DNI unico en el sistema
- Cambio de estado: `active` ↔ `suspended` ↔ `inactive`
- Suspension automatica por morosidad (pago vencido > 30 dias)
- Reactivacion requiere regularizar pagos pendientes
- Al crear miembro, enviar email de bienvenida con credenciales

**Casos de uso criticos:**
- Busqueda rapida por DNI o nombre (para recepcion)
- Listado de miembros con cuota vencida
- Exportacion a CSV/Excel del padron de socios

### 3.3 Modulo Disciplines

**CRUD:**
- Crear disciplina
- Listar disciplinas (activas/todas) con filtro por categoria
- Ver detalle con clases asociadas y cantidad de inscriptos
- Actualizar disciplina
- Desactivar disciplina (soft delete)

**Logica de negocio:**
- No se puede desactivar una disciplina con inscripciones activas sin confirmacion
- Control de cupo maximo por disciplina
- Categorias predefinidas extensibles

**Casos de uso criticos:**
- Vista publica de disciplinas disponibles (para pagina informativa)
- Dashboard con ocupacion por disciplina

### 3.4 Modulo Plans

**CRUD:**
- Crear plan de membresia
- Listar planes activos
- Ver detalle con disciplinas incluidas
- Actualizar plan (precio, disciplinas)
- Desactivar plan

**Logica de negocio:**
- Un plan puede incluir N disciplinas o ser ilimitado
- Cambio de precio no afecta periodos ya facturados
- Miembro puede cambiar de plan (upgrade/downgrade)
- Al cambiar plan se recalcula proximo pago proporcional

**Casos de uso criticos:**
- Comparativa de planes para el proceso de inscripcion
- Calculo automatico de precio segun periodo de facturacion

### 3.5 Modulo Classes

**CRUD:**
- Crear clase asignando disciplina e instructor
- Listar clases con filtros (dia, disciplina, instructor)
- Ver detalle de clase con lista de asistentes
- Actualizar clase (horario, instructor)
- Cancelar clase (notificar inscriptos)

**Logica de negocio:**
- Validacion de conflictos de horario por instructor
- Validacion de conflictos de horario por ubicacion
- Capacidad maxima heredada de disciplina (overrideable)
- Instructor debe tener rol `instructor`

**Casos de uso criticos:**
- Grilla semanal de horarios (vista calendario)
- Clases del dia (vista para recepcion/instructores)

### 3.6 Modulo Enrollments

**CRUD:**
- Inscribir miembro a disciplina
- Listar inscripciones de un miembro
- Listar inscriptos en una disciplina
- Cancelar inscripcion

**Logica de negocio:**
- Verificar que el plan del miembro incluya la disciplina (o sea plan ilimitado)
- Verificar cupo disponible en la disciplina
- No permitir inscripcion duplicada activa
- Miembro debe estar en estado `active`
- Al cancelar, liberar cupo

**Casos de uso criticos:**
- Inscripcion rapida desde el perfil del miembro
- Lista de espera cuando se alcanza el cupo maximo

### 3.7 Modulo Attendance

**CRUD:**
- Registrar asistencia individual
- Registrar asistencia masiva (lista de clase)
- Consultar asistencia por miembro
- Consultar asistencia por clase y fecha
- Modificar registro de asistencia

**Logica de negocio:**
- Solo se puede registrar asistencia para miembros inscriptos en la disciplina de la clase
- Solo se registra asistencia para el dia actual o dias pasados (no futuros)
- Un miembro solo puede tener un registro por clase por dia
- Calculo de porcentaje de asistencia por miembro/disciplina

**Casos de uso criticos:**
- Pantalla de "pasar lista" para el instructor (lista de inscriptos con checkboxes)
- Alerta de baja asistencia (< 50% en el mes)

### 3.8 Modulo Payments

**CRUD:**
- Registrar pago manual
- Listar pagos con filtros (miembro, estado, periodo, metodo)
- Ver detalle de pago
- Actualizar estado de pago
- Emitir recibo

**Logica de negocio:**
- Generacion automatica de cuotas pendientes segun plan y periodo de facturacion
- Deteccion de morosidad (pagos pendientes vencidos)
- Calculo proporcional al cambiar de plan
- Numero de recibo auto-incremental por ano (ej: `2026-000001`)
- Soporte para descuentos y bonificaciones

**Casos de uso criticos:**
- Cobranza en recepcion (registrar pago cash/transferencia)
- Listado de morosos para seguimiento
- Resumen de ingresos del mes

### 3.9 Modulo Reports

**Funcionalidades (solo lectura):**
- Reporte de ingresos por periodo (diario, semanal, mensual, anual)
- Reporte de morosidad (miembros con pagos vencidos)
- Reporte de asistencia por disciplina
- Reporte de ocupacion por disciplina (inscriptos vs cupo)
- Reporte de altas y bajas de miembros
- Reporte de recaudacion por metodo de pago
- Exportacion a CSV y PDF

**Logica de negocio:**
- Filtros por rango de fechas, disciplina, plan
- Datos agregados con cache de 5 minutos para reportes pesados
- Acceso restringido segun rol

### 3.10 Modulo Notifications

**Funcionalidades:**
- Envio de email de bienvenida al nuevo miembro
- Recordatorio de pago proximo a vencer (7 dias antes)
- Aviso de pago vencido
- Notificacion de clase cancelada
- Recordatorio de clase (dia anterior)

**Logica de negocio:**
- Cola de mensajes para envio asincrono (Bull/BullMQ + Redis)
- Templates de email con variables dinamicas
- Registro de notificaciones enviadas (log)
- Preferencias de notificacion por miembro

---

## 4. API Endpoints

Base URL: `/api/v1`

Todos los endpoints (excepto auth publicos) requieren header `Authorization: Bearer <token>`.

### 4.1 Auth

| Metodo | Ruta                        | Descripcion                | Auth  | Roles     |
| ------ | --------------------------- | -------------------------- | ----- | --------- |
| POST   | `/auth/register`            | Registro de miembro nuevo  | No    | Publico   |
| POST   | `/auth/login`               | Iniciar sesion             | No    | Publico   |
| POST   | `/auth/refresh`             | Renovar access token       | No    | Publico   |
| POST   | `/auth/logout`              | Cerrar sesion              | Si    | Todos     |
| POST   | `/auth/forgot-password`     | Solicitar reset password   | No    | Publico   |
| POST   | `/auth/reset-password`      | Resetear contrasena        | No    | Publico   |
| GET    | `/auth/me`                  | Perfil del usuario actual  | Si    | Todos     |
| PATCH  | `/auth/me`                  | Actualizar perfil propio   | Si    | Todos     |
| PATCH  | `/auth/me/password`         | Cambiar contrasena propia  | Si    | Todos     |

**POST `/auth/register`**
```json
// Request Body
{
  "email": "juan@email.com",
  "password": "SecurePass123!",
  "first_name": "Juan",
  "last_name": "Perez",
  "dni": "12345678",
  "phone": "+5491112345678",
  "date_of_birth": "1990-05-15"
}

// Response 201
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "juan@email.com", "role": "member" },
    "member": { "id": "uuid", "first_name": "Juan", "last_name": "Perez", "status": "trial" },
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "expires_in": 900
    }
  }
}
```

**POST `/auth/login`**
```json
// Request Body
{
  "email": "juan@email.com",
  "password": "SecurePass123!"
}

// Response 200
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "juan@email.com", "role": "member" },
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "expires_in": 900
    }
  }
}

// Response 401
{
  "status": "error",
  "message": "Credenciales invalidas"
}
```

### 4.2 Members

| Metodo | Ruta                          | Descripcion                      | Roles         |
| ------ | ----------------------------- | -------------------------------- | ------------- |
| GET    | `/members`                    | Listar miembros (paginado)       | Admin, Staff  |
| POST   | `/members`                    | Crear miembro                    | Admin, Staff  |
| GET    | `/members/:id`                | Detalle de miembro               | Admin, Staff  |
| PATCH  | `/members/:id`                | Actualizar miembro               | Admin, Staff  |
| PATCH  | `/members/:id/status`         | Cambiar estado del miembro       | Admin, Staff  |
| GET    | `/members/:id/enrollments`    | Inscripciones del miembro        | Admin, Staff  |
| GET    | `/members/:id/payments`       | Pagos del miembro                | Admin, Staff  |
| GET    | `/members/:id/attendance`     | Asistencia del miembro           | Admin, Staff  |

**GET `/members`** - Query Parameters:
```
?page=1              Pagina (default: 1)
&limit=20            Resultados por pagina (default: 20, max: 100)
&search=juan         Busqueda por nombre, apellido o DNI
&status=active       Filtro por estado
&plan_id=uuid        Filtro por plan
&sort=last_name      Campo de ordenamiento
&order=asc           Direccion (asc/desc)
```

```json
// Response 200
{
  "status": "success",
  "data": {
    "members": [ /* array de miembros */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### 4.3 Disciplines

| Metodo | Ruta                              | Descripcion                     | Roles         |
| ------ | --------------------------------- | ------------------------------- | ------------- |
| GET    | `/disciplines`                    | Listar disciplinas              | Todos         |
| POST   | `/disciplines`                    | Crear disciplina                | Admin, Staff  |
| GET    | `/disciplines/:id`                | Detalle de disciplina           | Todos         |
| PATCH  | `/disciplines/:id`                | Actualizar disciplina           | Admin, Staff  |
| DELETE | `/disciplines/:id`                | Desactivar disciplina           | Admin         |
| GET    | `/disciplines/:id/classes`        | Clases de la disciplina         | Todos         |
| GET    | `/disciplines/:id/enrollments`    | Inscriptos en la disciplina     | Admin, Staff  |

### 4.4 Plans

| Metodo | Ruta                           | Descripcion                     | Roles         |
| ------ | ------------------------------ | ------------------------------- | ------------- |
| GET    | `/plans`                       | Listar planes                   | Todos         |
| POST   | `/plans`                       | Crear plan                      | Admin         |
| GET    | `/plans/:id`                   | Detalle de plan                 | Todos         |
| PATCH  | `/plans/:id`                   | Actualizar plan                 | Admin         |
| DELETE | `/plans/:id`                   | Desactivar plan                 | Admin         |
| POST   | `/plans/:id/disciplines`       | Agregar disciplina al plan      | Admin         |
| DELETE | `/plans/:id/disciplines/:did`  | Quitar disciplina del plan      | Admin         |

### 4.5 Classes

| Metodo | Ruta                           | Descripcion                     | Roles                  |
| ------ | ------------------------------ | ------------------------------- | ---------------------- |
| GET    | `/classes`                     | Listar clases (filtros)         | Todos                  |
| POST   | `/classes`                     | Crear clase                     | Admin, Staff           |
| GET    | `/classes/:id`                 | Detalle de clase                | Todos                  |
| PATCH  | `/classes/:id`                 | Actualizar clase                | Admin, Staff, Instructor (propia) |
| DELETE | `/classes/:id`                 | Desactivar clase                | Admin, Staff           |
| GET    | `/classes/:id/attendance`      | Asistencia de la clase          | Admin, Staff, Instructor (propia) |
| GET    | `/classes/schedule`            | Grilla semanal de horarios      | Todos                  |
| GET    | `/classes/today`               | Clases del dia                  | Todos                  |

**GET `/classes`** - Query Parameters:
```
?discipline_id=uuid    Filtro por disciplina
&instructor_id=uuid    Filtro por instructor
&day_of_week=monday    Filtro por dia
&is_active=true        Solo clases activas
```

### 4.6 Enrollments

| Metodo | Ruta                                  | Descripcion                     | Roles         |
| ------ | ------------------------------------- | ------------------------------- | ------------- |
| GET    | `/enrollments`                        | Listar inscripciones            | Admin, Staff  |
| POST   | `/enrollments`                        | Crear inscripcion               | Admin, Staff  |
| GET    | `/enrollments/:id`                    | Detalle de inscripcion          | Admin, Staff  |
| PATCH  | `/enrollments/:id/cancel`             | Cancelar inscripcion            | Admin, Staff  |

**POST `/enrollments`**
```json
// Request Body
{
  "member_id": "uuid-del-miembro",
  "discipline_id": "uuid-de-la-disciplina"
}

// Response 201
{
  "status": "success",
  "data": {
    "enrollment": {
      "id": "uuid",
      "member_id": "uuid",
      "discipline_id": "uuid",
      "status": "active",
      "enrolled_at": "2026-02-14T10:00:00Z"
    }
  }
}

// Response 409 (ya inscripto)
{
  "status": "error",
  "message": "El miembro ya esta inscripto en esta disciplina"
}

// Response 422 (sin cupo)
{
  "status": "error",
  "message": "No hay cupo disponible en esta disciplina"
}
```

### 4.7 Attendance

| Metodo | Ruta                           | Descripcion                        | Roles                  |
| ------ | ------------------------------ | ---------------------------------- | ---------------------- |
| POST   | `/attendance`                  | Registrar asistencia individual    | Admin, Staff, Instructor |
| POST   | `/attendance/bulk`             | Registrar asistencia masiva        | Admin, Staff, Instructor |
| GET    | `/attendance`                  | Consultar asistencia (filtros)     | Admin, Staff, Instructor |
| PATCH  | `/attendance/:id`              | Modificar registro                 | Admin, Staff           |

**POST `/attendance/bulk`**
```json
// Request Body
{
  "class_id": "uuid-de-la-clase",
  "date": "2026-02-14",
  "records": [
    { "member_id": "uuid-1", "status": "present" },
    { "member_id": "uuid-2", "status": "absent" },
    { "member_id": "uuid-3", "status": "late", "notes": "Llego 15min tarde" }
  ]
}

// Response 201
{
  "status": "success",
  "data": {
    "created": 3,
    "records": [ /* array de registros creados */ ]
  }
}
```

**GET `/attendance`** - Query Parameters:
```
?class_id=uuid         Filtro por clase
&member_id=uuid        Filtro por miembro
&date=2026-02-14       Filtro por fecha exacta
&date_from=2026-02-01  Filtro desde fecha
&date_to=2026-02-28    Filtro hasta fecha
```

### 4.8 Payments

| Metodo | Ruta                              | Descripcion                     | Roles         |
| ------ | --------------------------------- | ------------------------------- | ------------- |
| GET    | `/payments`                       | Listar pagos (filtros)          | Admin, Staff  |
| POST   | `/payments`                       | Registrar pago                  | Admin, Staff  |
| GET    | `/payments/:id`                   | Detalle de pago                 | Admin, Staff  |
| PATCH  | `/payments/:id`                   | Actualizar estado de pago       | Admin, Staff  |
| GET    | `/payments/:id/receipt`           | Descargar recibo (PDF)          | Admin, Staff  |
| GET    | `/payments/pending`               | Pagos pendientes / morosos      | Admin, Staff  |
| POST   | `/payments/generate`              | Generar cuotas del periodo      | Admin         |

**POST `/payments`**
```json
// Request Body
{
  "member_id": "uuid-del-miembro",
  "amount": 15000.00,
  "payment_method": "cash",
  "description": "Cuota mensual Febrero 2026",
  "period_start": "2026-02-01",
  "period_end": "2026-02-28"
}

// Response 201
{
  "status": "success",
  "data": {
    "payment": {
      "id": "uuid",
      "member_id": "uuid",
      "amount": 15000.00,
      "status": "completed",
      "receipt_number": "2026-000042",
      "paid_at": "2026-02-14T10:30:00Z"
    }
  }
}
```

### 4.9 Reports

| Metodo | Ruta                              | Descripcion                     | Roles         |
| ------ | --------------------------------- | ------------------------------- | ------------- |
| GET    | `/reports/revenue`                | Ingresos por periodo            | Admin, Staff  |
| GET    | `/reports/debtors`                | Listado de morosos              | Admin, Staff  |
| GET    | `/reports/attendance`             | Reporte de asistencia           | Admin, Staff, Instructor |
| GET    | `/reports/occupancy`              | Ocupacion por disciplina        | Admin, Staff  |
| GET    | `/reports/members`                | Altas/bajas de miembros         | Admin, Staff  |
| GET    | `/reports/export/:type`           | Exportar reporte (csv/pdf)      | Admin, Staff  |

**GET `/reports/revenue`** - Query Parameters:
```
?period=monthly          Agrupacion (daily, weekly, monthly, annual)
&date_from=2026-01-01    Desde
&date_to=2026-12-31      Hasta
&payment_method=cash     Filtro por metodo de pago
```

```json
// Response 200
{
  "status": "success",
  "data": {
    "summary": {
      "total": 450000.00,
      "count": 30,
      "average": 15000.00
    },
    "breakdown": [
      { "period": "2026-01", "total": 220000.00, "count": 15 },
      { "period": "2026-02", "total": 230000.00, "count": 15 }
    ],
    "by_method": {
      "cash": 200000.00,
      "card": 150000.00,
      "transfer": 100000.00
    }
  }
}
```

---

## 5. Flujos Principales

### 5.1 Inscripcion de Miembro Nuevo

```
Cliente llega al club
        |
        v
[Recepcion / Sitio web]
        |
        v
Completar formulario de registro
  - Datos personales (nombre, DNI, telefono, etc.)
  - Email y contrasena
        |
        v
POST /api/v1/auth/register
        |
        v
Sistema valida:
  - Email no duplicado
  - DNI no duplicado
  - Campos obligatorios completos
  - Formato de datos correcto
        |
    OK? ---- No ----> Retornar errores de validacion
        |
        v
Crear User (role: member) + Member (status: trial)
        |
        v
Enviar email de bienvenida
        |
        v
[Staff asigna plan al miembro]
PATCH /api/v1/members/:id
  { "plan_id": "uuid-del-plan" }
        |
        v
Sistema actualiza estado a "active"
        |
        v
Generar primera cuota pendiente
POST /api/v1/payments/generate
        |
        v
[Miembro realiza primer pago]
(ver flujo 5.2)
        |
        v
[Staff inscribe al miembro en disciplinas]
POST /api/v1/enrollments
  { "member_id": "...", "discipline_id": "..." }
        |
        v
Sistema valida:
  - Plan incluye la disciplina
  - Hay cupo disponible
  - Miembro esta activo
        |
        v
Inscripcion completada
```

### 5.2 Pago de Cuota

```
Miembro se acerca a pagar / Vencimiento de cuota
        |
        v
[Staff busca al miembro]
GET /api/v1/members?search=DNI_o_nombre
        |
        v
[Staff ve pagos pendientes]
GET /api/v1/members/:id/payments?status=pending
        |
        v
Muestra cuotas pendientes con montos y periodos
        |
        v
[Staff registra el pago]
POST /api/v1/payments
  {
    "member_id": "uuid",
    "amount": 15000.00,
    "payment_method": "cash",
    "period_start": "2026-02-01",
    "period_end": "2026-02-28"
  }
        |
        v
Sistema:
  1. Crea registro de pago (status: completed)
  2. Genera numero de recibo
  3. Actualiza estado del miembro si estaba suspendido
  4. Registra quien proceso el pago
        |
        v
[Opcional] Imprimir/enviar recibo
GET /api/v1/payments/:id/receipt
        |
        v
Pago registrado exitosamente
```

### 5.3 Control de Asistencia

```
Comienza la clase
        |
        v
[Instructor abre pantalla de asistencia]
GET /api/v1/classes/:id/attendance?date=hoy
        |
        v
Sistema muestra lista de miembros inscriptos
en la disciplina de la clase
        |
        v
[Instructor marca asistencia de cada miembro]
  - Presente / Ausente / Tarde / Justificado
        |
        v
[Instructor envia la lista completa]
POST /api/v1/attendance/bulk
  {
    "class_id": "uuid",
    "date": "2026-02-14",
    "records": [
      { "member_id": "uuid-1", "status": "present" },
      { "member_id": "uuid-2", "status": "absent" },
      ...
    ]
  }
        |
        v
Sistema valida:
  - Todos los miembros estan inscriptos en la disciplina
  - No existen registros duplicados para ese dia
  - La fecha es valida (no futura)
        |
        v
Registros guardados exitosamente
        |
        v
[Automatico] Si un miembro tiene < 50% asistencia
  en el mes -> generar alerta/notificacion
```

### 5.4 Generacion de Reportes

```
[Admin/Staff accede al modulo de reportes]
        |
        v
Selecciona tipo de reporte:
  - Ingresos
  - Morosidad
  - Asistencia
  - Ocupacion
  - Altas/Bajas
        |
        v
Configura filtros:
  - Rango de fechas
  - Disciplina (opcional)
  - Plan (opcional)
  - Agrupacion (diario/semanal/mensual)
        |
        v
GET /api/v1/reports/:tipo?filtros
        |
        v
Sistema:
  1. Ejecuta query con filtros
  2. Agrega datos segun periodo
  3. Calcula totales y promedios
  4. Cachea resultado por 5 minutos
        |
        v
Muestra reporte en pantalla
  - Tabla de datos
  - Graficos (barras, lineas, torta)
  - Totales y KPIs
        |
        v
[Opcional] Exportar
GET /api/v1/reports/export/:tipo?format=csv|pdf
        |
        v
Sistema genera archivo y retorna descarga
```

---

## 6. Consideraciones Tecnicas

### 6.1 Stack Tecnologico

| Capa         | Tecnologia           | Justificacion                                |
| ------------ | -------------------- | -------------------------------------------- |
| Runtime      | Node.js 20 LTS      | Estable, soporte a largo plazo               |
| Framework    | Express 4.x         | Maduro, gran ecosistema de middleware         |
| Base de datos| PostgreSQL 16        | Relacional, ideal para datos estructurados    |
| ORM          | Prisma               | Type-safe, migraciones, excelente DX          |
| Frontend     | React 18 + Vite      | Ecosistema amplio, rendimiento                |
| UI Library   | Tailwind CSS + shadcn/ui | Productividad, consistencia visual        |
| Cache        | Redis                | Sesiones, cache de reportes, colas            |
| Cola         | BullMQ               | Jobs asincrono (emails, reportes)             |
| Email        | Nodemailer + templates | Envio de notificaciones                     |
| Testing      | Jest + Supertest     | Unit + integration tests                      |
| Docs API     | Swagger/OpenAPI      | Documentacion auto-generada                   |

### 6.2 Estructura del Proyecto

```
tribuscript/
├── package.json
├── prisma/
│   ├── schema.prisma          # Modelos de datos
│   └── migrations/            # Migraciones de BD
├── src/
│   ├── index.js               # Entry point
│   ├── app.js                 # Configuracion Express
│   ├── config/
│   │   ├── database.js        # Conexion a BD
│   │   ├── redis.js           # Conexion Redis
│   │   └── env.js             # Variables de entorno
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── rbac.js            # Role-based access control
│   │   ├── validate.js        # Request validation
│   │   ├── errorHandler.js    # Error handler global
│   │   └── rateLimiter.js     # Rate limiting
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   ├── members/
│   │   │   ├── members.controller.js
│   │   │   ├── members.service.js
│   │   │   ├── members.routes.js
│   │   │   └── members.validation.js
│   │   ├── disciplines/
│   │   ├── plans/
│   │   ├── classes/
│   │   ├── enrollments/
│   │   ├── attendance/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── notifications/
│   ├── utils/
│   │   ├── pagination.js      # Helper de paginacion
│   │   ├── apiResponse.js     # Formato de respuesta estandar
│   │   └── logger.js          # Winston logger
│   └── jobs/
│       ├── queue.js           # Configuracion BullMQ
│       ├── emailJob.js        # Envio de emails
│       └── paymentJob.js      # Generacion de cuotas
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml         # PostgreSQL + Redis local
└── README.md
```

### 6.3 Autenticacion y Autorizacion

**JWT Strategy:**
```
Access Token:  expira en 15 minutos, se envia en header Authorization
Refresh Token: expira en 7 dias, se almacena en httpOnly cookie
```

**Flujo de autenticacion:**
1. Usuario envia credenciales a `POST /auth/login`
2. Servidor valida credenciales contra hash bcrypt
3. Servidor genera access token + refresh token
4. Access token se usa en todas las requests subsiguientes
5. Cuando access token expira, frontend llama a `POST /auth/refresh`
6. Refresh token rotation: se invalida el refresh usado y se emite uno nuevo

**Middleware de autorizacion:**
```javascript
// Ejemplo de uso en rutas
router.get('/members', auth(), rbac('admin', 'staff'), membersController.list);
router.get('/auth/me', auth(), membersController.getProfile);
```

### 6.4 Validacion de Requests

Usar **Zod** para validacion de schemas en cada endpoint:

```javascript
// Ejemplo: members.validation.js
const createMemberSchema = z.object({
  body: z.object({
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    dni: z.string().min(6).max(20),
    email: z.string().email(),
    phone: z.string().optional(),
    date_of_birth: z.string().date(),
    plan_id: z.string().uuid().optional(),
  })
});
```

Middleware `validate.js` intercepta la request y devuelve errores 422 con detalle de campos invalidos.

### 6.5 Manejo de Errores

**Formato estandar de error:**
```json
{
  "status": "error",
  "message": "Descripcion legible del error",
  "code": "MEMBER_NOT_FOUND",
  "errors": [
    {
      "field": "email",
      "message": "El email ya esta registrado"
    }
  ]
}
```

**Codigos HTTP utilizados:**

| Codigo | Uso                                              |
| ------ | ------------------------------------------------ |
| 200    | Operacion exitosa                                |
| 201    | Recurso creado                                   |
| 204    | Operacion exitosa sin contenido (DELETE)         |
| 400    | Request malformada                               |
| 401    | No autenticado                                   |
| 403    | No autorizado (rol insuficiente)                 |
| 404    | Recurso no encontrado                            |
| 409    | Conflicto (duplicado, estado invalido)           |
| 422    | Error de validacion                              |
| 429    | Rate limit excedido                              |
| 500    | Error interno del servidor                       |

**Error handler centralizado** que captura errores de Prisma, Zod, JWT y errores custom, y los transforma al formato estandar.

### 6.6 Performance

- **Paginacion obligatoria** en todos los endpoints de listado (cursor-based para tablas grandes)
- **Indices de BD** en campos de busqueda y FK (detallados en cada modelo)
- **Cache con Redis** para reportes y datos que no cambian frecuentemente (TTL: 5min)
- **Compresion gzip** en responses (middleware `compression`)
- **Connection pooling** de PostgreSQL via Prisma (pool size configurable)
- **Rate limiting** global (100 req/min) y por endpoint sensible (login: 5 req/15min)
- **Lazy loading** de relaciones en queries Prisma (no cargar todo por defecto)
- **Jobs asincrono** para operaciones pesadas (envio de emails, generacion de reportes PDF, generacion masiva de cuotas)

### 6.7 Seguridad

- **Helmet.js** para headers HTTP de seguridad
- **CORS** configurado para origenes permitidos
- **Input sanitization** contra XSS
- **Parametrized queries** via Prisma (prevencion SQL injection)
- **bcrypt** con salt rounds 12 para passwords
- **Rate limiting** contra brute force
- **HTTPS** obligatorio en produccion
- **Variables de entorno** para secretos (nunca hardcodeados)
- **Audit log** para operaciones criticas (pagos, cambios de estado)

### 6.8 Variables de Entorno

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tribuscript

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=club@email.com
SMTP_PASS=your-email-password
EMAIL_FROM=Club TribuScript <club@email.com>

# App
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```
