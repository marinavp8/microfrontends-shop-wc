import { LitElement, html, css } from 'lit';
import { Task } from '@lit/task';
import { getProducts, getBanners } from '../shared/api.js';
import { EVT, emit, on } from '../shared/events.js';
import '../shared/product-card.js';

export class HomeView extends LitElement {
  static styles = css`
    :host{display:block}
    .banner{background:linear-gradient(120deg,#4f46e5,#9333ea);color:#fff;border-radius:14px;padding:2rem;margin-bottom:1.5rem}
    .banner button{border:0;border-radius:6px;padding:.5rem 1rem;cursor:pointer}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem}
    .badge{margin-top:1rem;color:#6b7280}
  `;
  count = 0;
  _banners = new Task(this, { task: getBanners, args: () => [] });
  _featured = new Task(this, { task: () => getProducts({ featured: true }), args: () => [] });
  connectedCallback() {
    super.connectedCallback();
    this._off = on(EVT.UPDATED, (e) => { this.count = e.detail.count; this.requestUpdate(); });
  }
  disconnectedCallback() { this._off?.(); super.disconnectedCallback(); }

  render() {
    return html`
      ${this._banners.render({
        error: () => html``,
        complete: (list) => list.map((b) => html`<div class="banner"><h1>${b.title}</h1><p>${b.subtitle}</p>
          <button @click=${() => emit(EVT.NAV, { path: b.cta.path })}>${b.cta.label}</button></div>`),
      })}
      <h2>Destacados</h2>
      ${this._featured.render({
        pending: () => html`<p>Cargando…</p>`,
        error: () => html`<p>Destacados no disponibles ahora mismo.</p>`,
        complete: (l) => html`<div class="grid">${l.map((p) => html`<product-card .product=${p}></product-card>`)}</div>`,
      })}
      <p class="badge">Artículos en tu carrito: ${this.count}</p>`;
  }
}
customElements.define('home-view', HomeView);
