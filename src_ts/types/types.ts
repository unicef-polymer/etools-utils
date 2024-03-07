export declare type Constructor<T> = new (...args: any[]) => T;
export interface CustomElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  readonly isConnected: boolean;
}
