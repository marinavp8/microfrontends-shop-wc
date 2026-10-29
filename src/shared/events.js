// Contrato de eventos (bus = CustomEvent sobre window)
export const EVT = {
  ADD_ITEM: 'cart:add-item',               // {sku, name, price:number, qty}
  UPDATED: 'cart:updated',                 // {count, total}
  NAV: 'nav:go',                           // {path}
  CHECKOUT: 'cart:checkout-started',       // {total}
};
export const emit = (type, detail) =>
  window.dispatchEvent(new CustomEvent(type, { detail }));
export const on = (type, fn) => {
  window.addEventListener(type, fn);
  return () => window.removeEventListener(type, fn);
};
export const eur = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
