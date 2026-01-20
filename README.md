🍽️ iMenu — Carta Digital Inteligente para Restaurantes

iMenu es una plataforma de carta digital estilo NordQR, pensada como SaaS, que permite a bares y restaurantes gestionar su carta de forma visual, moderna y accesible mediante QR, sin necesidad de apps ni instalaciones.

El sistema está dividido en:

Vista pública (la carta del restaurante)

Panel de administración (para el dueño del local)

Todo funciona con frontend estático + Supabase como backend (BBDD, auth y storage).

🌐 Arquitectura general
Frontend (HTML/CSS/JS)
│
├── GitHub Pages / Hosting propio
│
└── Supabase
    ├── Auth (usuarios)
    ├── PostgreSQL (datos)
    └── Storage (imágenes)

Tecnologías usadas

HTML, CSS, JavaScript (vanilla)

Supabase (Auth + Database + Storage)

GitHub Pages / Hosting estático

SVGs para alérgenos

SortableJS (ordenar categorías y platos en móvil y PC)

👤 Gestión de usuarios (registro y login)
Registro de usuarios

Actualmente el flujo es:

El usuario (dueño del bar) se crea en Supabase Auth

Email + contraseña

Al iniciar sesión en el admin, se asocia automáticamente a:

Su Perfil

Sus Categorías

Sus Platos

El sistema está preparado para evolucionar a multi-bar por usuario en el futuro.

Login

El login se hace desde admin.html

Se usa supabase.auth.signInWithPassword

No se necesita ?cliente= en el admin

🧩 Estructura de base de datos
Tabla Perfil

Información del restaurante:

Campo	Descripción
user_id	UUID del dueño (auth.users)
nombre	Nombre del local
slug	Identificador para la URL pública
portada_url	Imagen de portada
telefono	Teléfono
direccion	Dirección
wifi	Información Wi-Fi
reviews_url	Enlace a Google Reviews
rating	Valoración media
rating_count	Nº de valoraciones
Tabla Categorias

Categorías de la carta:

Campo	Descripción
id	ID
nombre	Nombre
orden	Orden visual
activa	Visible u oculta
user_id	Dueño
Tabla Menu

Platos del restaurante:

Campo	Descripción
id	ID
plato	Nombre
descripcion	Descripción
precio	Precio
categoria_id	Relación con Categorias
subcategoria	Subcategoría (chips)
imagen_url	Imagen del plato
alergenos	Array de keys (["gluten","huevos"])
orden	Orden
activo	Visible u oculto
user_id	Dueño
🖼️ Imágenes y alérgenos
Imágenes

Se suben a Supabase Storage

Bucket recomendado: imenu

Se guarda la URL pública en la BD

No se suben imágenes al repositorio

Alérgenos

Se guardan como keys normalizadas:

["gluten","huevos","frutos_secos"]


Los SVG están en /alergenos/*.svg

En la carta:

Se muestran como iconos

Al hacer click → zoom del alérgeno

📖 Vista pública (Carta)

URL de ejemplo:

https://tudominio.com/?cliente=alpine-demo

Flujo de la carta

Se resuelve el slug → user_id

Se cargan:

Perfil (portada, info, rating)

Categorías activas

Platos activos

UI estilo NordQR:

Portada

Categorías como botones

Subcategorías como chips

Platos con imagen lateral

Modal tipo bottom-sheet

Secciones interactivas

Info → abre sheet con mapa, wifi, teléfono y dirección

Valoraciones → abre sheet con rating y enlace externo

Plato → abre sheet con imagen, descripción y alérgenos

🛠️ Panel de administración (admin.html)

Acceso:

/admin.html
``️

Funcionalidades del admin
Perfil

Editar nombre, slug y portada

Datos de contacto

Valoraciones

Subida de imagen a Storage

Categorías

Crear / editar / eliminar

Mostrar u ocultar

Ordenar con drag & drop (móvil y PC)

Platos

Crear / editar / eliminar

Asignar categoría y subcategoría

Seleccionar alérgenos (SVG)

Subir imagen

Mostrar u ocultar

Ordenar con drag & drop

Filtro por categoría

Buscador

Badge visual de categoría

Panel lateral “Editando” para contexto

📱 Compatibilidad móvil

100% responsive

Drag & drop funcional en:

Desktop

Android

iOS

UI optimizada para uso real en restaurantes

🔐 Seguridad (RLS)

Lectura pública solo de datos activos

Escritura solo para el usuario autenticado

Cada restaurante solo puede modificar sus datos

🚀 Posibles evoluciones futuras

Multi-idioma

Multi-bar por usuario

Duplicar platos

Horarios / platos agotados

Integración pedidos

Estadísticas de visitas

Modo camarero / modo cocina

📌 Estado del proyecto

✔ MVP funcional
✔ UX tipo NordQR
✔ Preparado para SaaS
✔ Escalable
✔ Sin dependencias pesadas
