export interface IDialog<D> {
  dialog: string;
  dialogData?: D;
  readonly?: boolean;
}

export interface IEtoolsDialogResponse {
  confirmed: boolean;
}

export interface IDialogResponse<R> extends IEtoolsDialogResponse {
  response?: R;
}
