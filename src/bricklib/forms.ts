/**
 * Server forms UI wrapper.
 */

import { Player } from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import * as util from './utils.js';

// custom ui registry
const registry: Map<string, BaseFormBuilder> = new Map();
// ids of players that has open custom ui window
const playersOnUI: Set<string> = new Set();

/**
 * @class BaseFormBuilder
 * base form builder
 * @abstract
 */
export abstract class BaseFormBuilder
{
  /**
   * @protected
   */
  protected abstract _data:
      | ui.ActionFormData
      | ui.MessageFormData
      | ui.ModalFormData;
  protected _cancel: baseForm['cancel'];

  /**
   * the id of this form
   */
  public id: string = '';

  /**
   * set this form id
   */
  public setId(id: string): this
  {
    this.id = id;
    return this;
  }

  /**
   * register this form
   * @param id the id to use
   * @returns self
   */
  public register(id?: string): this
  {
    registry.set(id ?? this.id, this);
    this.id = id;
    return this;
  }

  /**
   * handle form cancelation
   * @param ctx the ui context
   * @param response the form response
   * @returns true if the form we're canceled
   * @protected
   */
  protected _handleCancel(ctx: UIContext, response: ui.FormResponse): boolean
  {
    if (!response.canceled) return false;
    util.safeCall(this._cancel, ctx, response.cancelationReason);
    return true;
  }

  /**
   * set title for the form
   * @param text the text to set
   * @returns self
   */
  public title(text: text): this
  {
    this._data.title(text);
    return this;
  }

  /**
   * set action when player canceled the form
   * @param callback the callback
   * @returns self
   */
  public cancel(callback: baseForm['cancel']): this
  {
    this._cancel = callback;
    return this;
  }

  /**
   * show this form to player
   * @param ctx ui context
   * @returns promise of form response
   * @abstract
   */
  public abstract show(ctx: UIContext): Promise<
    ui.ActionFormResponse |
    ui.MessageFormResponse |
    ui.ModalFormResponse
  >;
}

/**
 * @class ActionFormBuilder
 * action form builder class
 */
export class ActionFormBuilder extends BaseFormBuilder
{
  /**
   * @constructor
   * make a new action form
   * @param [data] form data in raw json
   */
  constructor(data?: actionForm)
  {
    super();

    // set data
    if (data) {
      this.title(data.title);
      if (data.body) this.body(data.body);
      if (data.cancel) this.cancel(data.cancel);
      data.buttons?.forEach?.(v => this.button(v.text, v.icon, v.action));
    }
  }

  protected _data: ui.ActionFormData = new ui.ActionFormData();
  private _actions: button['action'][] = [];

  /**
   * set body text to the form
   * @param text the text
   * @returns self
   */
  public body(text: text): this
  {
    this._data.body(text);
    return this;
  }

  /**
   * add a new action button
   * @param text label for the button
   * @param icon optional path to icon (you can set it to null)
   * @param action callback to execute when the button is selected
   * @returns self
   */
  public button(
      text: text, icon: string | null, action: button['action']): this
  {
    this._data.button(text, icon);
    this._actions.push(action);
    return this;
  }

  /**
   * show this form to a player
   * @param ctx ui context for the player
   * @returns promise for the form response
   */
  public async show(ctx: UIContext): Promise<ui.ActionFormResponse>
  {
    playersOnUI.add(ctx.user.id);

    return this._data.show(ctx.user).then(r => {
      playersOnUI.delete(ctx.user.id);

      if (this._handleCancel(ctx, r)) return r;

      util.safeCall(this._actions[r.selection], ctx);

      return r;
    });
  }
}

/**
 * @class MessageFormBuilder
 * message form builder class
 */
export class MessageFormBuilder extends BaseFormBuilder
{
  /**
   * @constructor
   * make a new message form
   * @param [data] form data in raw json
   */
  constructor(data?: messageForm)
  {
    super();

    // set data
    if (data) {
      this.title(data.title);
      if (data.message) this.message(data.message);
      if (data.cancel) this.cancel(data.cancel);
      this.btn1(data.btn1.text, data.btn1.action);
      this.btn2(data.btn2.text, data.btn2.action);
    }
  }

  protected _data: ui.MessageFormData = new ui.MessageFormData();
  private _btn1: button['action'];
  private _btn2: button['action'];

  /**
   * set the message text
   * @param text the text
   * @returns self
   */
  public message(text: text): this
  {
    this._data.body(text);
    return this;
  }

  /**
   * set the first button
   * @param text label for the button
   * @param action callback to execute when button is selected
   * @returns self
   */
  public btn1(text: text, action: button['action']): this
  {
    this._data.button1(text);
    this._btn1 = action;
    return this;
  }

  /**
   * set the second button
   * @param text label for the button
   * @param action callback to execute when button is selected
   * @returns self
   */
  public btn2(text: text, action: button['action']): this
  {
    this._data.button2(text);
    this._btn2 = action;
    return this;
  }

  /**
   * show this form to a player
   * @param ctx ui context for the player
   * @returns promise for the form response
   */
  public async show(ctx: UIContext): Promise<ui.ActionFormResponse>
  {
    playersOnUI.add(ctx.user.id);

    return this._data.show(ctx.user).then(r => {
      playersOnUI.delete(ctx.user.id);

      if (this._handleCancel(ctx, r)) return r;

      if (r.selection == 0) util.safeCall(this._btn1, ctx);
      else if (r.selection == 1) util.safeCall(this._btn2, ctx);

      return r;
    });
  }
}

/**
 * @class ModalFormBuilder
 * modal form builder class
 */
export class ModalFormBuilder extends BaseFormBuilder
{
  /**
   * @constructor
   * make a new modal form
   * @param [data] form data in raw json
   */
  constructor(data?: modalForm)
  {
    super();

    // set data
    if (data) {
      this.title(data.title);
      if (data.cancel) this.cancel(data.cancel);
      data.inputs?.forEach?.(v => {
        if (!v) return;
        if (v.type == 'dropdown')
          this.dropdown(v.id, v.label, v.options, v.default);
        if (v.type == 'slider')
          this.slider(v.id, v.label, v.min, v.max, v.step, v.default);
        if (v.type == 'text')
          this.text(v.id, v.label, v.placeholder, v.default);
        if (v.type == 'toggle')
          this.toggle(v.id, v.label, v.default);
      });
      this.submit(data.submit);
    }
  }

  protected _data: ui.ModalFormData = new ui.ModalFormData();
  private _inputIds: string[] = [];
  private _submit: modalForm['submit'];

  /**
   * adds a dropdown to the modal form
   * @param id identifier for the input
   * @param label description for the input
   * @param options array of text, options for the form
   * @param [def] index of the default option on the options array
   * @returns self
   */
  public dropdown(id: string, label: text, options: text[], def?: number): this
  {
    this._inputIds.push(id);
    this._data.dropdown(label, options, { defaultValueIndex: def });
    return this;
  }

  /**
   * adds a slider to the modal form
   * @param id identifier for the input
   * @param label description for the input
   * @param min minimum range for the slider
   * @param max maximum range for the slider
   * @param [step] step count for the slider
   * @param [def] default slider value
   * @returns self
   */
  public slider(id: string, label: text, min: number, max: number,
      step?: number, def?: number): this
  {
    this._inputIds.push(id);
    this._data.slider(label, min, max, {
      valueStep: step ?? 1,
      defaultValue: def ?? min,
    });
    return this;
  }

  /**
   * adds a text field to the modal form
   * @param id identifier for the input
   * @param label description for the input
   * @param [placeholder] placeholder text
   * @param [def] default text
   * @returns self
   */
  public text(id: string, label: text, placeholder?: text, def?: text): this
  {
    this._inputIds.push(id);
    this._data.textField(label, placeholder, { defaultValue: def });
    return this;
  }

  /**
   * adds a toggle to the modal form
   * @param id identifier for the input
   * @param label description for the input
   * @param [def] default state of the toggle
   * @returns self
   */
  public toggle(id: string, label: text, def?: boolean): this
  {
    this._inputIds.push(id);
    this._data.toggle(label, { defaultValue: def });
    return this;
  }

  /**
   * set the submit action
   * @param submit the callback
   * @returns self
   */
  public submit(submit: modalForm['submit']): this
  {
    this._submit = submit;
    return this;
  }

  /**
   * show this form to a player
   * @param ctx ui context for the player
   * @returns promise for the form response
   */
  public async show(ctx: UIContext): Promise<ui.ActionFormResponse>
  {
    playersOnUI.add(ctx.user.id);

    return this._data.show(ctx.user).then(r => {
      playersOnUI.delete(ctx.user.id);

      if (this._handleCancel(ctx, r)) return r;

      const result: modalResponse = {};
      r.formValues.forEach((val, idx) => result[this._inputIds[idx]] = val);
      util.safeCall(this._submit, ctx, result);

      return r;
    });
  }
}

/**
 * @class UIContext
 * ui context class
 */
export class UIContext
{
  /**
   * @constructor
   * initialize a new ui context
   * @param player the subject player
   */
  constructor(player: Player)
  {
    this.user = player;
  }

  /**
   * player ui stack
   * @private
   */
  private _uiStack: BaseFormBuilder[] = [];

  /**
   * the subject player
   */
  public readonly user: Player;

  /**
   * whether we're on the root ui (we cant go back)
   */
  public get isOnRoot(): boolean
  {
    return this._uiStack.length == 1;
  }

  /**
   * the current ui
   */
  public get currentUI(): BaseFormBuilder
  {
    return this._uiStack[this._uiStack.length - 1];
  }

  /**
   * open ui
   * @param form the form class or registered id to show
   * @returns true if the ui were shown
   */
  public goto(form: BaseFormBuilder | string): boolean
  {
    if (isOnUI(this.user)) return false;

    const ui = form instanceof BaseFormBuilder ? form : registry.get(form);
    if (!ui) return false;

    this._uiStack.push(ui);
    ui.show(this);
    return true;
  }

  /**
   * back to previous ui
   * @returns true if the ui were shown
   */
  public back(): boolean
  {
    if (isOnUI(this.user) || this.isOnRoot) return false;

    this._uiStack.pop();
    this.currentUI.show(this);

    return true;
  }

  /**
   * pop the ui stack up to the given ui id
   * @returns true if the ui were shown
   */
  public backto(id: string): boolean
  {
    if (isOnUI(this.user)) return false;

    while (!this.isOnRoot) {
      this._uiStack.pop();
      if (this.currentUI.id != id)
        continue;
      // found it!
      this.currentUI.show(this);
      return true;
    }

    return false;
  }
}

/**
 * show ui to player
 * @param form the form class or id
 * @param player the player
 * @returns ui context
 */
export function showForm(
    form: BaseFormBuilder | string, player: Player): UIContext
{
  const ctx = new UIContext(player);
  ctx.goto(form);
  return ctx;
}

/**
 * returns true if player has an open ui window
 * @param player the player to test
 * @returns boolean
 */
export function isOnUI(player: Player): boolean
{
  return playersOnUI.has(player.id);
}

/**
 * register a new form
 * @param id the form id
 * @param data the form data
 * @returns form builder object
 * @throws this will throw error if the form data is invalid
 */
export function registerForm(id: string, data: actionForm): ActionFormBuilder;
export function registerForm(id: string, data: messageForm): MessageFormBuilder;
export function registerForm(id: string, data: modalForm): ModalFormBuilder;
export function registerForm(id: string, data: formType): BaseFormBuilder
{
  if ('buttons' in data) return new ActionFormBuilder(data).register(id);
  if ('message' in data) return new MessageFormBuilder(data).register(id);
  if ('inputs' in data) return new ModalFormBuilder(data).register(id);
  throw new Error('Invalid form type!');
}

/**
 * returns a registered form by id
 * @param id the form id
 * @returns the form
 */
export function getForm(id: string): BaseFormBuilder | undefined
{
  return registry.get(id);
}


// TODO: support rawtext
/**
 * text type
 */
export type text = string /* | RawText */;

/**
 * message form button
 */
export interface button
{
  /**
   * label for the button
   */
  text: text,

  /**
   * function to be called if a player selected this button
   */
  action: (ctx: UIContext) => void,
}

/**
 * action form button
 */
export interface actionBtn extends button
{
  /**
   * optional icon path for the button icon
   */
  icon?: string,
}

/**
 * base modal input structure
 */
export interface baseInput
{
  /**
   * identifier for the input, which can later be accessed by the submit
   * function
   */
  id: string,

  /**
   * type of the input
   */
  type: string,

  /**
   * label text for the input
   */
  label: text,

  /**
   * default value
   */
  default?: any,
}

/**
 * dropdown input
 */
export interface dropdownInput extends baseInput
{
  /**
   * type of the input
   */
  type: 'dropdown',

  /**
   * an array of text as the input options
   */
  options: text[],

  /**
   * default index of selection on dropdown
   */
  default?: number,
}

/**
 * slider input
 */
export interface sliderInput extends baseInput
{
  /**
   * type of input
   */
  type: 'slider',

  /**
   * minimum slider range
   */
  min: number,
  /**
   * maximum slider range
   */
  max: number,

  /**
   * slider step count
   */
  step?: number,

  /**
   * default slider value
   */
  default?: number,
}

/**
 * text input
 */
export interface textInput extends baseInput
{
  /**
   * type of input
   */
  type: 'text',

  /**
   * placeholder text for the text field
   */
  placeholder?: text,

  /**
   * default assigned text
   */
  default?: text,
}

/**
 * toggle input
 */
export interface toggleInput extends baseInput
{
  /**
   * type of input
   */
  type: 'toggle',

  /**
   * default value of input
   */
  default?: boolean,
}

/**
 * base form
 */
export interface baseForm
{
  /**
   * title for the form
   */
  title: text,

  /**
   * form cancelation handler callback
   */
  cancel?: (ctx: UIContext, reason: ui.FormCancelationReason) => void,
}

/**
 * action form
 */
export interface actionForm extends baseForm
{
  /**
   * body text
   */
  body?: text,

  /**
   * action buttons
   */
  buttons: actionBtn[],
}

/**
 * message form
 */
export interface messageForm extends baseForm
{
  /**
   * message to show
   */
  message: text,

  /**
   * first button
   */
  btn1: button,

  /**
   * second button
   */
  btn2: button,
}

/**
 * mod form
 */
export interface modalForm extends baseForm
{
  /**
   * array of modal input field data
   */
  inputs: (dropdownInput | sliderInput | textInput | toggleInput)[],

  /**
   * function to execute when this modal form is submitted
   */
  submit: (ctx: UIContext, result: modalResponse) => void,
}

/**
 * modal form response
 */
export type modalResponse = Record<string, number | string | boolean>;

/**
 * form types
 */
export type formType = actionForm | messageForm | modalForm;
