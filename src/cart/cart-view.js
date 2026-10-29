import { LitElement, html, css } from 'lit';
import { cartStore } from './cart-store.js';
import { EVT, emit, on, eur } from '../shared/events.js';

export class CartView extends LitElement {
  static styles = css`
    :host{display:block}
    table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden}
    th,td{padding:.7rem 1rem;text-align:left;border-bottom:1px solid #eee}
    button{border:0;border-radius:6px;padding:.35rem .7rem;cursor:pointer;background:#e8eaf3}
    .del,.clear{background:#fee2e2;color:#991b1b}
    .pay{background:#4f46e5;color:#fff;padding:.7rem 1.4rem;font-size:1rem}
    .total{display:flex;justify-content:space-between;align-items:center;margin-top:1rem}
    .empty{text-align:center;padding:3rem;background:#fff;border-radius:10px}
  `;
  connectedCallback() {
    super.connectedCallback();
    this._off = on(EVT.UPDATED, () => this.requestUpdate());
  }
  disconnectedCallback() { this._off?.(); super.disconnectedCallback(); }

  render() {
    const items = cartStore.list;
    if (!items.length) return html`<div class="empty">
      <p>Tu carrito está vacío 🛒</p>
      <button @click=${() => emit(EVT.NAV, { path: '/catalogo' })}>Ir al catálogo</button></div>`;
    return html`
      <h2>Carrito</h2>
      <table>
        <tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
        ${items.map((i) => html`<tr>
          <td>${i.name}</td><td>${eur(i.price)}</td>
          <td><button @click=${() => cartStore.setQty(i.sku, i.qty - 1)}>−</button>
              ${i.qty}
              <button @click=${() => cartStore.setQty(i.sku, i.qty + 1)}>+</button></td>
          <td>${eur(i.price * i.qty)}</td>
          <td><button class="del" title="Eliminar" @click=${() => cartStore.remove(i.sku)}>🗑 Eliminar</button></td></tr>`)}
      </table>
      <div class="total">
        <strong>Total: ${eur(cartStore.total)}</strong>
        <span>
          <button class="clear" @click=${() => cartStore.clear()}>Vaciar carrito</button>
          <button class="pay" @click=${() => emit(EVT.CHECKOUT, { total: cartStore.total })}>Pagar</button>
        </span>
      </div>`;
  }
}
customElements.define('cart-view', CartView);
