// Clientes HTTP de los servicios (los frontends nunca tocan MongoDB)
const CATALOG = import.meta.env.VITE_CATALOG_API ?? 'http://localhost:4001';
const CART = import.meta.env.VITE_CART_API ?? 'http://localhost:4002';
const CONTENT = import.meta.env.VITE_CONTENT_API ?? 'http://localhost:4003';

async function req(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
export const getProducts = ({ category, featured } = {}) => {
  const q = new URLSearchParams();
  if (category) q.set('category', category);
  if (featured) q.set('featured', 'true');
  return req(`${CATALOG}/api/products?${q}`);
};
export const getBanners = () => req(`${CONTENT}/api/banners`);
export const getCart = (id) => req(`${CART}/api/carts/${id}`);
export const addCartItem = (id, item) =>
  req(`${CART}/api/carts/${id}/items`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(item),
  });
export const clearCart = (id) => req(`${CART}/api/carts/${id}`, { method: 'DELETE' });
export const removeCartItem = (id, sku) =>
  req(`${CART}/api/carts/${id}/items/${encodeURIComponent(sku)}`, { method: 'DELETE' });
