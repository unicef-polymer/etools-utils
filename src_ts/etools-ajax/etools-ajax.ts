import { html, LitElement, css, PropertyValues } from 'lit';
import { customElement ,property} from 'lit/decorators.js';
import EtoolsAjaxRequestMixin from './etools-ajax-request-mixin';
import { debounce } from "../debouncer.util";
import { EtoolsLogger } from "../singleton/logger";

/**
 * @customElement
 */
@customElement('etools-ajax')
export class EtoolsAjax extends EtoolsAjaxRequestMixin(LitElement) {
  @property({ type: String }) url = '';
  @property({ type: String }) method = '';
  @property({ type: Object }) endpoint: Record<string, unknown> | null = null;
  @property({ type: Object }) params: Record<string, unknown> | null = null;
  @property({ type: Object }) body: Record<string, unknown> | null = null;

  private _debouncer: any = null;

  static styles = css``;

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('url') || changedProperties.has('endpoint') || changedProperties.has('params') || changedProperties.has('method')) {
      this._optionsChanged();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._debouncer.cancel();
  }
  send() {
    const opt = {
      endpoint: this.endpoint || { url: this.url },
      params: this.params,
      method: this.method,
      body: this.body,
    };

    return this.sendRequest(opt)
      .then((data: any) => {
        this.dispatchEvent(new CustomEvent('success', { detail: data, bubbles: true, composed: true }));
        return data;
      })
      .catch((error: any) => {
        this.handleError(error);
      });
  }

  private _optionsChanged() {
    this._debouncer = debounce( () => {
      if (!this.endpoint && !this.url) {
        return;
      }
      this.send();
    },300);
  }

  private handleError(error: { status: number; error: unknown }) {
    if (error.status === 401) {
      this.dispatchEvent(new CustomEvent('unauthorized', { detail: error.error, bubbles: true, composed: true }));
      return;
    }

    if (error.status === 403) {
      this.dispatchEvent(new CustomEvent('forbidden', { detail: error.error, bubbles: true, composed: true }));
      return;
    }

    EtoolsLogger.error('error', error.error);
    this.dispatchEvent(new CustomEvent('fail', { detail: error.error, bubbles: true, composed: true }));
  }

  render() {
    return html`<slot></slot>`;
  }
}
