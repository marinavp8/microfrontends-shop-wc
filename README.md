# shop-wc — Tienda con Web Components (Lit) + servicios + MongoDB

Caso de uso del directo: tienda online con **Home, Catálogo y Carrito**, resuelta con **Web Components nativos escritos con [Lit](https://lit.dev)** en lugar de Module Federation. Mismo contrato de eventos, mismas APIs y mismas bases de datos que `shop-mfe`.

📖 Guía y simulador de referencia: https://estaticos.codecrypto.academy/directosmiseia/microfrontends.html#sim
(sección «Caso de uso para el directo: tienda con Home, Catálogo y Carrito»)

Repositorio: https://gitlab.codecrypto.academy/jviejo/micro-frontend-module-web-components (internal)

## Arquitectura

Un único bundle Vite. Cada «microfrontend» es un custom element con su Shadow DOM (estilos aislados) y se carga bajo demanda con `import()` dinámico desde la shell.

| Pieza | Capa | Custom element | Responsabilidad | Datos |
|---|---|---|---|---|
| `src/shell` | Host | `<shop-shell>` | Layout, router (`/`, `/catalogo`, `/carrito`), header con contador, error handling, inicio de `cartStore` | — |
| `src/home` | Microfrontend | `<home-view>` | Banners y productos destacados | content-api, catalog-api |
| `src/catalog` | Microfrontend | `<catalog-view>` | Listado, filtro por categoría, fallback con «Reintentar» | catalog-api |
| `src/cart` | Microfrontend | `<cart-view>` + `cartStore` | Líneas, cantidades, eliminar, vaciar, checkout | cart-api |
| `src/shared` | Librería | `<product-card>` | Tarjeta de producto, contrato de eventos, clientes HTTP | — |
| `services/catalog-api` | Backend | — | `GET /api/products[?category=&featured=true]`, `GET /api/products/:sku` | `shop_catalog.products` |
| `services/cart-api` | Backend | — | `GET/DELETE /api/carts/:id`, `POST /api/carts/:id/items`, `DELETE /api/carts/:id/items/:sku` | `shop_cart.carts` |
| `services/content-api` | Backend | — | `GET /api/banners` | `shop_content.banners` |

Los frontends **nunca** acceden a MongoDB: solo hablan HTTP con su API (`src/shared/api.js`). Cada servicio es dueño de su propia base.

### Contrato de eventos (`CustomEvent` en `window`, `src/shared/events.js`)

| Evento | Emiten | Escuchan | Payload |
|---|---|---|---|
| `cart:add-item` | catalog, home (vía `product-card`) | cartStore | `{ sku, name, price: number, qty }` |
| `cart:updated` | cartStore | shell (contador), home, cart | `{ count, total }` |
| `nav:go` | home, cart | shell (router) | `{ path }` |
| `cart:checkout-started` | cart | shell (aviso) | `{ total }` |

`cartStore` rechaza (con aviso en consola) un `price` que no sea `number`: es la forma de ver el «contrato roto» del reto.

**La trampa del carrito:** si `cartStore` solo se cargara en `/carrito`, un «Añadir» desde `/catalogo` o `/` no tendría quién lo escuchara y el evento se perdería. La shell llama a `cartStore.start()` en `connectedCallback`, así que escucha siempre, sea cual sea la ruta.

### Carrito

- El estado vive en `cart-api` (`shop_cart.carts`), identificado por un `cartId` (UUID) guardado en `localStorage` (`shop-cart-id`). Recargar la página conserva el carrito.
- Operaciones: añadir (`POST …/items`, incrementa si el SKU ya existe), eliminar línea (`DELETE …/items/:sku`), vaciar (`DELETE /api/carts/:id`).
- Bajar la cantidad con `−` se hace vaciando y reañadiendo las demás líneas, porque `cart-api` no tiene `PATCH`. Mejora pendiente.

## Arranque

Requisitos: Node 20+ y un MongoDB sin autenticación (en esta sesión, el `mongod` local de Homebrew en `127.0.0.1:27017`; alternativa con Docker: `npm run infra:up`).

```bash
npm install
export MONGO_URL=mongodb://127.0.0.1:27017
npm run seed          # crea colecciones con validador $jsonSchema, índices y datos de ejemplo
npm run dev:api       # catalog-api :4001, cart-api :4002, content-api :4003
npm run dev           # tienda en http://localhost:5173
```

### Puertos y variables

| Variable | Dónde | Por defecto |
|---|---|---|
| `MONGO_URL` | servicios y seed | `mongodb://localhost:27017` |
| `PORT` | cada servicio | 4001 / 4002 / 4003 |
| `CORS_ORIGIN` | servicios (lista separada por comas) | `http://localhost:5173,http://127.0.0.1:5173` |
| `VITE_CATALOG_API` | frontend | `http://localhost:4001` |
| `VITE_CART_API` | frontend | `http://localhost:4002` |
| `VITE_CONTENT_API` | frontend | `http://localhost:4003` |

Si `shop-mfe` ya ocupa 4001–4003 (CORS al puerto 3000), arranca estas APIs en otros puertos y apunta el front:

```bash
PORT=4101 node services/catalog-api/src/index.mjs &
PORT=4102 node services/cart-api/src/index.mjs &
PORT=4103 node services/content-api/src/index.mjs &
VITE_CATALOG_API=http://localhost:4101 VITE_CART_API=http://localhost:4102 \
VITE_CONTENT_API=http://localhost:4103 npx vite --port 5173 --strictPort
```

## Datos de ejemplo (seed)

- `shop_catalog.products`: `KB-001` Teclado mecánico (79 €, destacado), `MN-027` Monitor 27" (249 €, destacado), `AU-010` Auriculares (59 €), `WC-004` Webcam HD (49 €).
- `shop_content.banners`: «Semana del setup» y «Envío gratis».
- `shop_cart.carts`: vacía; se crea al primer «Añadir».

## Retos propuestos

- **Simular la caída de catalog:** para `catalog-api` y abre `/catalogo` → fallback con «Reintentar».
- **Romper el contrato:** emite `cart:add-item` con `price` como string → `cartStore` lo rechaza.
- **Mini-carrito en el header:** ya muestra contador y total; convertirlo en desplegable.
- **Añadir `cart:remove-item`** al contrato y emitirlo desde `cart-view` en lugar de llamar al store directamente.
- **Quinto microfrontend `checkout`** que escuche `cart:checkout-started`.
- **`PATCH /api/carts/:id/items/:sku`** para ajustar cantidades sin vaciar el carrito.

## Notas técnicas

- **Class-field shadowing en Lit:** las propiedades reactivas (`static properties`) no deben inicializarse con class fields (`path = '/'`); en modo dev Lit lanza un error y la página queda en blanco. Se inicializan en el `constructor`.
- **Shadow DOM:** cada vista tiene estilos aislados; la comunicación entre piezas es solo por eventos y por las APIs.
- **Carga diferida:** cada ruta importa su módulo con `import()`, y la shell captura el fallo de carga y muestra un error en lugar de romper el layout.
- **Seguridad:** `cart-api` no valida el precio contra `catalog-api` (simple para clase); en producción habría que hacerlo y que las operaciones sean atómicas.

## Datos de la sesión

- **Fecha:** 2026-10-29 · Claude Code (Sonnet 5.5) · macOS, zsh.
- **Versiones:** Node v24.12.0, Vite 6.4.5, Lit 3, `@lit/task` 1.x, `mongodb` 6.x, Express 4.
- **Origen de los servicios:** copiados de `shop-mfe/services` e `infra`, con dos cambios: CORS por defecto al puerto 5173 y puerto configurable con `PORT`. Después se añadió `DELETE /api/carts/:id/items/:sku`.
- **Entorno de la sesión:** `mongod` local en 27017; APIs de `shop-mfe` ocupando 4001–4003, por lo que `shop-wc` se probó en 4101–4103 y la tienda en 5173.
- **Pruebas (agent-browser, flujo completo):**
  - Home con banners y destacados desde MongoDB.
  - Añadir desde Home y desde Catálogo con el carrito sin cargar (trampa resuelta).
  - Filtro por categoría, `+` / `−`, eliminar línea y vaciar carrito.
  - Persistencia tras recargar y documento verificado en `cart-api`.
  - Checkout (aviso con el total) y fallback con `catalog-api` parado.
- **Incidencia resuelta:** página en blanco por class-field shadowing (ver Notas técnicas).
