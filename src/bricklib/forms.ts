import {
  uiManager,
  ActionFormData,
  MessageFormData,
  ModalFormData,
  FormCancelationReason,
} from '@minecraft/server-ui';
import { Player, RawMessage } from '@minecraft/server';


export class ActionForm
{
  private _data: ActionFormData;
  private _callbacks: ActionCallback[] = [];
  private _cancel: CancelCallback;

  constructor()
  {
    this._data = new ActionFormData();
  }

  title(txt: string | RawMessage): this
  {
    this._data.title(txt);
    return this;
  }

  body(txt: string | RawMessage): this
  {
    this._data.body(txt);
    return this;
  }

  header(txt: string | RawMessage): this
  {
    this._data.header(txt);
    return this;
  }

  label(txt: string | RawMessage): this
  {
    this._data.label(txt);
    return this;
  }

  divider(): this
  {
    this._data.divider();
    return this;
  }

  btn(txt: string | RawMessage, icon: string, fn: ActionCallback): this
  {
    this._data.button(txt, icon);
    this._callbacks.push(fn);
    return this;
  }

  cancel(fn: CancelCallback): this
  {
    this._cancel = fn;
    return this;
  }

  show(plr: Player): void
  {
    this._data.show(plr)
      .then(val => {
        if (val.canceled) {
          this._cancel(plr, val.cancelationReason);
          return;
        }
        this._callbacks[val.selection]?.(plr);
      });
  }
}



export type ActionCallback = (ctx: Player) => void;
export type CancelCallback = (ctx:Player,reason:FormCancelationReason)=>void;
