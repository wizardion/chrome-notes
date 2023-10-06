export interface IListFormItem {
  item: HTMLDivElement;
  button: HTMLInputElement;
  sort: HTMLInputElement;
  index: HTMLSpanElement;
  title: HTMLSpanElement;
  date: HTMLSpanElement;
}

export type IEventListenerType = 
  | 'sort:mousedown'
  | 'click';
