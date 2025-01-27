import {IDialog, IDialogResponse} from './types/dialog.types';

// you need to fire 'dialog-closed' event on dialog close!
export function openDialog<D, R = any>({dialog, dialogData, readonly}: IDialog<D>): Promise<IDialogResponse<R>> {
  return new Promise((resolve: (detail: IDialogResponse<R>) => any, reject: (e: Error) => any) => {
    const dialogElement: HTMLElement & IDialog<D> & any = document.createElement(dialog) as HTMLElement & IDialog<D>;
    const body: HTMLBodyElement | null = document.querySelector('body');
    if (body) {
      body.appendChild(dialogElement);
    } else {
      reject(new Error('Body not exist'));
    }
    dialogElement.dialogData = dialogData;
    let etoolsDialog: any;
    dialogElement.updateComplete.then(() =>
      setTimeout(() => {
        etoolsDialog = dialogElement.shadowRoot.querySelector('etools-dialog');
        etoolsDialog.opened = true;
      })
    );

    if (readonly) {
      dialogElement.readonly = readonly;
    }

    dialogElement.addEventListener('dialog-closed', (e: Event) => {
      const event: CustomEvent<IDialogResponse<R>> = e as CustomEvent<IDialogResponse<R>>;
      resolve(event.detail);
      etoolsDialog.opened = false;
      dialogElement.remove();
    });
  });
}
