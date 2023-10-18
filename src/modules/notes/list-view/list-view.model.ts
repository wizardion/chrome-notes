import { ListItemElement } from '../list-item/list-item.component';


export type IEventListenerType = 'add' | 'click' | string;

export interface IListViewForm {
  add: HTMLButtonElement;
  scrollable: HTMLDivElement;
  list: HTMLDivElement;
  items: ListItemElement[];
}
