import { LitElement, html, css } from 'lit';
import { Task } from '@lit/task';
import { getProducts } from '../shared/api.js';
import '../shared/product-card.js';

export class CatalogView extends LitElement {
  static properties = { filter: { state: true } };
  static styles = css`
    :host{display:block}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem}
    select{padding:.4rem;margin-bottom:1rem}
    .err{background:#fee2e2;padding:1rem;border-radius:8px}
  `;
  constructor() {
    super();
    this.filter = '';
    this._products = new Task(this, { task: () => getProducts(), args: () => [] });
  }

  render() {
    return html`<h2>Catálogo</h2>${this._products.render({
      pending: () => html`<p>Cargando…</p>`,
      error: (e) => html`<div class="err">⚠️ El catálogo no está disponible (${e.message}).
        <button @click=${() => this._products.run()}>Reintentar</button></div>`,
      complete: (list) => {
        const cats = [...new Set(list.map((p) => p.category))];
        const shown = list.filter((p) => !this.filter || p.category === this.filter);
        return html`
          <select @change=${(e) => (this.filter = e.target.value)}>
            <option value="">Todas las categorías</option>
            ${cats.map((c) => html`<option>${c}</option>`)}
          </select>
          <div class="grid">${shown.map((p) => html`<product-card .product=${p}></product-card>`)}</div>`;
      },
    })}`;
  }
}
customElements.define('catalog-view', CatalogView);
