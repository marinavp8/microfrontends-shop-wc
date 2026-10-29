import { EVT, emit, on } from '../shared/events.js';
import { getCart, addCartItem, clearCart, removeCartItem } from '../shared/api.js';

const cartId = (() => {
  let id = localStorage.getItem('shop-cart-id');
  if (!id) localStorage.setItem('shop-cart-id', (id = crypto.randomUUID()));
  return id;
})();

// Dueño del estado del carrito, persistido en cart-api (MongoDB shop_cart.carts).
// La shell lo inicia SIEMPRE (evita la "trampa del carrito").
class CartStore {
  items = [];
  started = false;
  async start() {
    if (this.started) return;
    this.started = true;
    on(EVT.ADD_ITEM, (e) => this.add(e.detail));
    try { this.#set(await getCart(cartId)); } catch (e) { console.warn('cart-api no disponible', e.message); }
  }
  async add({ sku, name, price, qty = 1 }) {
    if (typeof price !== 'number') return console.warn('Contrato roto: price debe ser number', price);
    try { this.#set(await addCartItem(cartId, { sku, name, price, qty })); }
    catch (e) { console.warn('No se pudo añadir', e.message); }
  }
  // cart-api solo expone añadir/vaciar: ajustar cantidad = añadir delta
  async setQty(sku, qty) {
    const cur = this.items.find((i) => i.sku === sku);
    if (!cur) return;
    if (qty > cur.qty) return this.add({ ...cur, qty: qty - cur.qty });
    // bajar cantidad: vaciar y reponer (simple para clase; ideal: PATCH en cart-api)
    const keep = this.items.map((i) => (i.sku === sku ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    await clearCart(cartId);
    for (const i of keep) await addCartItem(cartId, i).then((c) => this.#set(c));
    if (!keep.length) this.#set({ items: [] });
  }
  async remove(sku) {
    try { this.#set(await removeCartItem(cartId, sku)); }
    catch (e) { console.warn('No se pudo eliminar', e.message); }
  }
  async clear() { this.#set(await clearCart(cartId)); }
  get list() { return this.items; }
  get count() { return this.items.reduce((n, i) => n + i.qty, 0); }
  get total() { return this.items.reduce((t, i) => t + i.qty * i.price, 0); }
  #set(cart) {
    this.items = cart.items ?? [];
    emit(EVT.UPDATED, { count: this.count, total: this.total });
  }
}
export const cartStore = new CartStore();
