import { LitElement, html, css } from 'lit';
import { EVT, on, eur } from '../shared/events.js';
import { cartStore } from '../cart/cart-store.js';

// Cada remote se carga bajo demanda (dynamic import = "Module Federation" casero)
const ROUTES = {
  '/': { tag: 'home-view', load: () => import('../home/home-view.js') },
  '/catalogo': { tag: 'catalog-view', load: () => import('../catalog/catalog-view.js') },
  '/carrito': { tag: 'cart-view', load: () => import('../cart/cart-view.js') },
};

export class ShopShell extends LitElement {
  static properties = { path: { state: true }, count: { state: true }, total: { state: true }, error: { state: true }, ready: { state: true } };
  static styles = css`
    :host{display:block}
    header{display:flex;align-items:center;gap:1.5rem;background:#1b1f2a;color:#fff;padding:.8rem 1.5rem}
    header b{font-size:1.2rem;margin-right:auto}
    a{color:#c7c9d9;text-decoration:none;cursor:pointer}a.on{color:#fff;font-weight:600}
    .cart{background:#4f46e5;padding:.3rem .8rem;border-radius:99px;color:#fff}
    main{max-width:960px;margin:1.5rem auto;padding:0 1rem}
    .err{background:#fee2e2;padding:1rem;border-radius:8px}
    .toast{position:fixed;bottom:1rem;right:1rem;background:#16a34a;color:#fff;padding:.8rem 1.2rem;border-radius:8px}
  `;
  constructor() {
    super();
    this.path = location.pathname in ROUTES ? location.pathname : '/';
    this.count = 0; this.total = 0; this.error = null; this.toast = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this._offs = [
      on(EVT.UPDATED, (e) => ({ count: this.count, total: this.total } = e.detail)),
      on(EVT.NAV, (e) => this.go(e.detail.path)),
      on(EVT.CHECKOUT, (e) => { this.toast = `Checkout iniciado: ${eur(e.detail.total)}`; this.requestUpdate(); setTimeout(() => { this.toast = ''; this.requestUpdate(); }, 3000); }),
    ];
    addEventListener('popstate', this._pop = () => (this.path = location.pathname in ROUTES ? location.pathname : '/'));
    cartStore.start(); // siempre activo, sea cual sea la ruta
  }
  disconnectedCallback() { this._offs.forEach((f) => f()); removeEventListener('popstate', this._pop); super.disconnectedCallback(); }

  go(path) {
    if (!(path in ROUTES)) path = '/';
    history.pushState({}, '', path + location.search);
    this.path = path;
  }
  async willUpdate(changed) {
    if (changed.has('path')) {
      this.error = null;
      try { await ROUTES[this.path].load(); } catch (e) { this.error = `No se pudo cargar el módulo: ${e.message}`; }
    }
  }
  _link(p, label) {
    return html`<a class=${this.path === p ? 'on' : ''} @click=${() => this.go(p)}>${label}</a>`;
  }
  render() {
    const tag = ROUTES[this.path].tag;
    return html`
      <header>
        <b>🛍️ Shop WC</b>
        ${this._link('/', 'Home')}${this._link('/catalogo', 'Catálogo')}${this._link('/carrito', 'Carrito')}
        <span class="cart" @click=${() => this.go('/carrito')}>🛒 ${this.count} · ${eur(this.total)}</span>
      </header>
      <main>${this.error
        ? html`<div class="err">${this.error}</div>`
        : this.path === '/' ? html`<home-view></home-view>`
        : this.path === '/catalogo' ? html`<catalog-view></catalog-view>`
        : html`<cart-view></cart-view>`}</main>
      ${this.toast ? html`<div class="toast">${this.toast}</div>` : ''}`;
  }
}
customElements.define('shop-shell', ShopShell);
