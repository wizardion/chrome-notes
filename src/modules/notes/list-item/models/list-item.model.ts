export interface IListFormItem {
  item: HTMLDivElement;
  button: HTMLInputElement;
  sort: HTMLButtonElement;
  index: HTMLSpanElement;
  title: HTMLSpanElement;
  date: HTMLSpanElement;
}

export type IEventListenerType =
  | 'sort:mousedown'
  | 'click';
