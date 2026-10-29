import { LitElement, html, css } from 'lit';
import { EVT, emit, eur } from './events.js';

export class ProductCard extends LitElement {
  static properties = { product: { type: Object } };
  static styles = css`
    :host{display:block}
    .card{background:#fff;border-radius:12px;padding:1rem;text-align:center;box-shadow:0 1px 3px #0001}
    .e{font-size:3rem}.cat{color:#6b7280;font-size:.8rem}
    button{margin-top:.5rem;border:0;background:#4f46e5;color:#fff;border-radius:6px;padding:.5rem 1rem;cursor:pointer}
  `;
  render() {
    const p = this.product;
    return html`<div class="card">
      <div class="e">📦</div><div>${p.name}</div>
      <div class="cat">${p.category}</div><strong>${eur(p.price)}</strong><br>
      <button @click=${() => emit(EVT.ADD_ITEM, { sku: p.sku, name: p.name, price: p.price, qty: 1 })}>
        Añadir</button></div>`;
  }
}
customElements.define('product-card', ProductCard);
