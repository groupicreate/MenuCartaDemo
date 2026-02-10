# 🍽️ iMenu

Carta digital para bares y restaurantes, con **panel de administración**, **vista pública** y **backend seguro en Supabase**.

Este README es la **fuente de verdad del proyecto**: explica cómo funciona todo (frontend, base de datos, seguridad, RLS, vistas y RPCs) para que cualquiera pueda continuar el desarrollo sin romper nada.

---

## 🚀 Visión general

iMenu permite a un bar/restaurante:

- Mostrar su carta online mediante URL / QR
- Gestionar categorías y platos desde un panel privado
- Mostrar información del local (dirección, teléfono, reseñas)
- Compartir el WiFi **protegido por PIN**

Arquitectura:

```
Cliente (móvil)
   │
   │  index.html / index.js (vista pública)
   ▼
Supabase (API)
   │
   ├─ Auth
   ├─ PostgreSQL (schema iMenu)
   ├─ RLS + Policies
   ├─ Vistas públicas
   └─ RPCs seguros
   ▲
   │  admin.html / admin.js (panel privado)
   │
Dueño del local
```

---

## 📂 Frontend

### 🌍 Vista pública (Carta)

**Archivos**:
- `index.html`
- `index.js`

Funcionalidad:
- Carga carta por `slug` (`?cliente=icreate`)
- Muestra portada, nombre, info y reseñas
- Lista categorías y platos activos
- Muestra nombre del WiFi
- Solicita PIN para revelar la contraseña

Características:
- ❌ No requiere login
- 🔐 Nunca accede a datos sensibles directamente
- 📖 Solo lectura

---

### 🔐 Panel de administración

**Archivos**:
- `admin.html`
- `admin.js`

Funcionalidad:
- Login con Supabase Auth
- Edición del perfil del local
- Configuración de WiFi y PIN
- CRUD de categorías
- CRUD de platos
- Ordenación

Características:
- 🔑 Requiere sesión (`authenticated`)
- 👤 Solo gestiona sus propios datos

---

## 🗄️ Base de datos (Supabase)

### 📦 Schema

Todo el proyecto vive en un schema dedicado:

```
iMenu
```

Se conceden permisos explícitos:

```sql
grant usage on schema "iMenu" to anon, authenticated;
```

---

## 📄 Tablas

### 🧑‍🍳 iMenu.Perfil

Datos del local.

Campos clave:
- `user_id` (owner)
- `nombre`
- `slug`
- `color_principal` (hex, ej. `#FFE800`)
- `wifi_name`
- `wifi_pass` ❗ privado
- `wifi_pin_hash` ❗ privado

🔒 **Nunca se expone directamente al público**.

---

### 📂 iMenu.Categorias

- `id`
- `nombre`
- `orden`
- `activa`
- `user_id`

---

### 🍽️ iMenu.Menu

- `id`
- `nombre`
- `descripcion`
- `precio`
- `categoria_id`
- `orden`
- `activo`
- `user_id`

---

## 👀 Vista pública

### iMenu.Perfil_publico

Vista SQL que expone **solo datos seguros** del perfil:

Incluye:
- nombre
- portada
- teléfono
- dirección
- rating
- color_principal
- wifi_name

❌ Excluye:
- wifi_pass
- wifi_pin_hash

Permisos:

```sql
grant select on "iMenu"."Perfil_publico" to anon, authenticated;
```

La carta pública **solo consulta esta vista**.

---

## 🧩 Mantenimiento: reseñas y vista pública

Si se quiere **eliminar el contador de reseñas** y reconstruir la vista pública:

1) Añadir columna de branding (si no existe):

```sql
alter table "iMenu"."Perfil"
add column if not exists color_principal text;
```

2) Quitar la columna de la tabla `iMenu.Perfil`:

```sql
alter table "iMenu"."Perfil" drop column if exists rating_count;
```

3) Recrear la vista pública sin esa columna y con color principal:

```sql
create or replace view "iMenu"."Perfil_publico" as
select
  user_id,
  nombre,
  portada_url,
  telefono,
  direccion,
  reviews_url,
  slug,
  google_place_id,
  color_principal,
  wifi_name
from "iMenu"."Perfil";
```

4) Reaplicar permisos:

```sql
grant select on "iMenu"."Perfil_publico" to anon, authenticated;
```

---

## 🧰 Storage (Subida de imágenes)

Para que la subida de imágenes funcione en el bucket `imenu`, primero se deben otorgar permisos básicos:

```sql
grant usage on schema storage to authenticated;
grant all on table storage.objects to authenticated;
grant all on table storage.buckets to authenticated;
```

Luego, crea las policies seguras (solo permite subir/editar/borrar en la carpeta del usuario):

```sql
create policy "imenu_user_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'imenu'
  and name like auth.uid() || '/%'
);

create policy "imenu_user_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'imenu'
  and name like auth.uid() || '/%'
)
with check (
  bucket_id = 'imenu'
  and name like auth.uid() || '/%'
);

create policy "imenu_user_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'imenu'
  and name like auth.uid() || '/%'
);
```

### 🧪 Modo temporal (debug)

Si las policies estrictas fallan y necesitas desbloquear la subida **temporalmente**, puedes usar una policy abierta para `authenticated`:

```sql
grant usage on schema storage to authenticated;
grant all on table storage.objects to authenticated;
grant all on table storage.buckets to authenticated;

drop policy if exists "imenu_user_insert" on storage.objects;
drop policy if exists "imenu_user_update" on storage.objects;
drop policy if exists "imenu_user_delete" on storage.objects;
drop policy if exists "imenu_user_insert_debug" on storage.objects;

create policy "imenu_allow_all_authenticated"
on storage.objects
for all
to authenticated
using (true)
with check (true);
```

> ⚠️ Este modo **no es seguro** a largo plazo porque cualquier usuario autenticado puede modificar archivos del bucket. Úsalo solo para desbloquear y luego vuelve a la policy estricta.

---

## 🔐 Seguridad (RLS + Policies)

### Categorias

```sql
alter table "iMenu"."Categorias" enable row level security;
```

- `anon`: SELECT solo si `activa = true`
- `authenticated`: SELECT / INSERT / UPDATE / DELETE solo si `user_id = auth.uid()`

---

### Menu

```sql
alter table "iMenu"."Menu" enable row level security;
```

- `anon`: SELECT solo si `activo = true`
- `authenticated`: CRUD solo del owner

---

### Perfil

```sql
alter table "iMenu"."Perfil" enable row level security;
```

- ❌ Sin SELECT público
- ✅ Owner puede hacer ALL

---

## 🔑 WiFi con PIN

### Objetivo

Mostrar la contraseña del WiFi **solo a quien tenga el PIN**.

### Flujo

1. Admin define WiFi y PIN
2. El PIN se guarda hasheado (`pgcrypto`)
3. La carta solicita el PIN
4. Un RPC valida el PIN
5. Si es correcto → devuelve `wifi_pass`

---

## 🔧 RPCs

### Guardar PIN (admin)

```sql
public.imenu_set_wifi_pin(p_pin text)
```

- Guarda hash del PIN
- Solo `authenticated`

---

### Validar PIN (público)

```sql
public.imenu_get_wifi_by_user(p_user_id uuid, p_pin text)
```

- Público
- Devuelve WiFi solo si el PIN es correcto

---

## 🧠 Prompt maestro (continuar desarrollo)

```
Estás ayudándome a desarrollar iMenu, una carta digital tipo SaaS.

Arquitectura:
- Frontend: HTML/CSS/JS estático
- Backend: Supabase
- Schema: iMenu
- Tablas: Perfil, Categorias, Menu
- Vista: Perfil_publico
- Seguridad: RLS + policies estrictas
- WiFi protegido por PIN hasheado (pgcrypto)
- RPCs: imenu_set_wifi_pin, imenu_get_wifi_by_user

Requisitos:
- No romper RLS
- No exponer datos sensibles
- Mantener separación vista pública / admin

Dame siempre SQL exacto, cambios en JS y explicación clara.
```

---

## ✅ Estado del proyecto

- Sistema estable
- Seguridad correcta
- Escalable
- Listo para producción y crecimiento
