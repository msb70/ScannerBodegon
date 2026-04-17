# Bodegon POS Kosher

SaaS B2B multi-tenant para inventario y punto de venta de bodegones con foco en productos kosher.

## Stack

- Next.js App Router
- TailwindCSS
- Supabase Auth, PostgreSQL, Storage y RLS
- Deploy en Vercel
- Scanner Lab standalone con fuentes abiertas en cascada

## Estructura

- `app/pos`: POS tipo supermercado con escaneo, carrito y cobro.
- `app/captura`: captura cache-first desde Supabase, Open Food Facts, UPCitemdb y entrada manual.
- `app/dashboard`: ventas totales, productos más vendidos y stock bajo.
- `app/scanner-lab`: módulo standalone para pruebas de escaneo y eficacia de búsqueda.
- `app/api/scanner-lab/*`: API interna para lookup, logging y métricas del módulo.
- `lib/supabase.ts`: cliente Supabase.
- `lib/api.ts`: consultas externas sin claves embebidas.
- `lib/productos.ts`: acceso a datos, storage e inventario.
- `lib/ventas.ts`: cobro mediante RPC transaccional.
- `lib/business.ts`: lógica de carrito y formato.
- `lib/scanner-lab/*`: catálogos abiertos, persistencia y tipos del módulo standalone.
- `components/carrito.tsx`: UI del carrito.
- `components/producto.tsx`: UI de producto.
- `supabase/schema.sql`: tablas, índices, RLS, Storage y función `registrar_venta`.

## Configuración local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Ejecuta `supabase/schema.sql` en el SQL Editor de Supabase.

4. Inicia desarrollo:

```bash
npm run dev
```

## Scanner Lab standalone

Ruta pública de prueba: `/scanner-lab`

Qué hace:

- Escanea o recibe un código manualmente.
- Busca en cascada en `Open Food Facts`, `Open Beauty Facts`, `Open Pet Food Facts` y `UPCitemdb`.
- Devuelve nombre, marca, descripción, categoría y foto cuando la fuente la ofrece.
- Registra todos los escaneos encontrados y no encontrados en `scanner_lab_scans`.
- Muestra un dashboard con efectividad total, cobertura por fuente, bitácora reciente y códigos fallidos frecuentes.

Notas operativas:

- Si falta `SUPABASE_SERVICE_ROLE_KEY`, el módulo sigue consultando catálogos, pero entra en modo demo sin persistencia.
- La persistencia se hace server-side desde rutas API; la tabla `scanner_lab_scans` queda con RLS activado y sin acceso público directo.
- Está pensado para compartir la URL con alguien del bodegón sin exigir login.

## Seguridad y multi-tenant

El tenant se modela con `user_id = auth.uid()` en `productos` y `ventas`. Las tablas tienen Row Level Security activado y políticas `select/insert/update/delete` por usuario. `ventas_items` se aísla por la venta asociada, y el bucket `productos_fotos` es privado con rutas por carpeta `user_id`.

El cobro usa la función SQL `registrar_venta(p_user_id, p_items)` para validar propietario, bloquear productos, calcular precios desde base de datos, crear venta, insertar items y descontar stock en una transacción.

## Deploy en Vercel

1. Conecta el repositorio a Vercel.
2. Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Asegúrate de haber aplicado `supabase/schema.sql` en Supabase.
4. Deploy con el comando por defecto de Vercel para Next.js.

Comandos típicos:

```bash
npm install
npm run build
vercel deploy -y
```

## GitHub

Si el directorio aún no está conectado a GitHub:

```bash
git init -b main
git add .
git commit -m "feat: scanner lab standalone"
gh repo create bodegon-pos --private --source=. --remote=origin --push
```

Si ya existe un repositorio remoto:

```bash
git add .
git commit -m "feat: scanner lab standalone"
git remote add origin git@github.com:TU_USUARIO/bodegon-pos.git
git push -u origin main
```

## Notas

- Open Food Facts y UPCitemdb se consultan desde el cliente solo después de buscar en Supabase.
- Si una URL externa de imagen permite CORS, se sube al bucket `productos_fotos`; si no, se conserva como URL externa para no bloquear la captura.
- Para un modelo multi-staff real, el siguiente paso es introducir una tabla `tiendas` y membresías `tienda_usuarios`; esta base sigue la restricción solicitada de filtrar por `user_id`.
- El Scanner Lab usa server-side fetch para evitar límites de CORS en pruebas públicas.
