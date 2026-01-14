1️⃣ Cómo está montado

Supabase:

Tabla Menu con columnas: id (autoincremental), plato, descripcion, precio, categoria, user_id.

RLS (Row Level Security) activada para que cada usuario solo vea sus propios platos (user_id = auth.uid()).

Tabla de usuarios gestionada por Supabase Auth (email + password).

Front-end:

Carta pública (index.html): carga los platos de la tabla Menu de un usuario específico usando su user_id.

Admin panel (admin.html): login por email/password, permite agregar, editar y borrar platos, solo del usuario logueado.

CSS personalizado para que la carta y el admin sean claros y visuales.

2️⃣ Cómo añadir un nuevo usuario

En Supabase → Authentication → Users → Invite user o crear directamente con email/password.

Cada usuario nuevo tendrá un id único (auth.uid()).

Para que tenga su propio menú, se insertan platos con user_id = su uid.

3️⃣ Cómo usar las URLs con ese usuario

Admin panel: se accede a admin.html. El usuario hace login con su email/password.

Carta pública: se puede cargar por index.html?user_id=<UID> (si quieres mostrar solo la carta de ese usuario) o se define el user_id en el JS.

Ejemplo en JS:

const { data: menu } = await supabase
  .from('Menu')
  .select('*')
  .eq('user_id', '<UID_DEL_USUARIO>')

4️⃣ Cómo ver la carta del usuario

Accede a la URL pública de la carta (index.html) y pasa el user_id o configúralo en el JS.

La carta solo mostrará los platos de ese usuario según user_id.

Si no hay platos para ese user_id, la carta aparecerá vacía.



[ Admin HTML ] (admin.html)
      │
      │ Login con email/password
      │
      ▼
[ Supabase Auth ] ──► verifica usuario y obtiene user_id
      │
      │ (user_id) → controla qué platos puede ver/modificar
      ▼
[ Tabla Menu ] (Supabase DB)
      │
      │ Filtrado por user_id
      │
      ├─ Agregar/Editar/Borrar platos (solo admin del user_id)
      │
      ▼
[ Carta Pública HTML ] (index.html)
      │
      │ JS carga platos:
      │   supabase.from('Menu').select('*').eq('user_id', <UID>)
      │
      ▼
[ Carta visible al público ]
      │
      │ Solo muestra platos de ese user_id
      │ Si no hay nada → carta vacía
