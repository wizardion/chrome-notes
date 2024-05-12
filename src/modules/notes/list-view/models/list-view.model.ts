export type IListListenerType = 'create' | 'click';

export interface IListViewForm {
  create: HTMLButtonElement;
  scrollable: HTMLDivElement;
  list: HTMLDivElement;
  placeholder: HTMLDivElement | null;
  controls: HTMLDivElement | null;
  content: HTMLElement;
}
