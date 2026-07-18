/**
 * Minimal Expander Card for Home Assistant.
 *
 * A drop-in, dependency-free replacement for `custom:expander-card` that
 * supports only the bits I actually use: a title, a chevron toggle button, and
 * a list of child cards that expand/collapse with a smooth animation.
 *
 * Everything else is hardcoded to the defaults I used to set explicitly:
 *   - card background kept (clear: false)
 *   - child cards made transparent (clear-children: true)
 *   - collapsed on load, animated open/close, light haptic on tap
 *
 * Install: drop this file in config/www/expander-card.js and add a resource:
 *   resources:
 *     - url: /local/expander-card.js
 *       type: module
 *
 * Config (the only keys read):
 *   type: custom:expander-card
 *   title: <string>
 *   cards: [<lovelace card configs>]
 */
(function () {
  'use strict';

  const ANIM_MS = 350;

  const STYLE = `
    :host { display: block; }
    ha-card.expander {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.85em 0.85em;
      border: none;
      background: transparent;
      color: var(--primary-text-color, #fff);
      font: inherit;
      cursor: pointer;
      border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
    }
    .title { text-align: left; flex: 1 1 auto; }
    .arrow {
      color: var(--primary-text-color, #fff);
      transition: transform ${ANIM_MS}ms ease;
    }
    ha-card.expander.open .arrow { transform: rotate(180deg); }
    .children-wrapper {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows ${ANIM_MS}ms ease;
    }
    ha-card.expander.open .children-wrapper { grid-template-rows: 1fr; }
    .children-inner {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 0.6em;
      opacity: 0;
      transition: opacity ${ANIM_MS}ms ease;
    }
    ha-card.expander.open .children-inner { opacity: 1; }
  `;

  class ExpanderCard extends HTMLElement {
    constructor() {
      super();
      this._open = false;
      this._hass = null;
      this._preview = false;
      this._connected = false;
      this._config = { title: '', cards: [] };
      this._childCards = [];

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>${STYLE}</style>
        <ha-card class="expander">
          <button class="header" type="button" aria-label="Toggle">
            <span class="title"></span>
            <ha-icon class="arrow" icon="mdi:chevron-down"></ha-icon>
          </button>
          <div class="children-wrapper">
            <div class="children-inner">
              <slot name="child"></slot>
            </div>
          </div>
        </ha-card>
      `;
      this._card = shadow.querySelector('ha-card');
      this._title = shadow.querySelector('.title');
      this._button = shadow.querySelector('.header');
      this._button.addEventListener('click', () => this._toggle());
    }

    static getStubConfig() {
      return { type: 'custom:expander-card', title: 'Expander', cards: [] };
    }

    setConfig(config = {}) {
      this._config = {
        title: config.title != null ? String(config.title) : '',
        cards: Array.isArray(config.cards) ? config.cards : [],
      };
      this._open = false;
      this._title.textContent = this._config.title;
      this._applyOpenClass();
      if (this._connected) this._buildChildren();
    }

    set hass(hass) {
      this._hass = hass;
      for (const el of this._childCards) {
        if (el) el.hass = hass;
      }
    }
    get hass() {
      return this._hass;
    }

    set preview(v) {
      this._preview = !!v;
      if (this._preview && !this._open) this._setOpen(true);
      for (const el of this._childCards) {
        if (el) el.preview = this._preview;
      }
    }

    getCardSize() {
      if (!this._open) return 1;
      let size = 1;
      for (const el of this._childCards) {
        if (el && typeof el.getCardSize === 'function') {
          try {
            const s = el.getCardSize();
            size += typeof s === 'number' ? s : 1;
          } catch (e) {
            size += 1;
          }
        }
      }
      return size;
    }

    connectedCallback() {
      this._connected = true;
      this._buildChildren();
    }

    _toggle() {
      this._setOpen(!this._open);
    }

    _setOpen(open) {
      this._open = !!open;
      this._applyOpenClass();
    }

    _applyOpenClass() {
      if (this._card) this._card.classList.toggle('open', this._open);
    }

    _buildChildren() {
      // Remove any previously rendered children.
      for (const el of this._childCards) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
      this._childCards = [];

      const build = () => {
        const frag = document.createDocumentFragment();
        for (const cardConfig of this._config.cards) {
          const el = document.createElement('hui-card');
          el.hass = this._hass;
          el.preview = this._preview;
          el.config = JSON.parse(JSON.stringify(cardConfig));
          el.setAttribute('slot', 'child');
          // clear-children: strip background/border/shadow from child cards.
          el.style.setProperty('--ha-card-background', 'transparent');
          el.style.setProperty('--ha-card-box-shadow', 'none');
          el.style.setProperty('--ha-card-border-color', 'transparent');
          el.style.setProperty('--ha-card-border-width', '0px');
          el.style.setProperty('--ha-card-backdrop-filter', 'none');
          el.load();
          this._childCards.push(el);
          frag.appendChild(el);
        }
        this.appendChild(frag);
      };

      if (customElements.get('hui-card')) {
        build();
      } else {
        customElements.whenDefined('hui-card').then(build);
      }
    }
  }

  customElements.define('expander-card', ExpanderCard);

  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c && c.type === 'expander-card')) {
    window.customCards.push({
      type: 'expander-card',
      name: 'Expander Card',
      preview: true,
      description: 'Minimal expandable container for child cards.',
    });
  }

  console.info(
    '%c expander-card %c minimal, dependency-free build ',
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray'
  );
})();
