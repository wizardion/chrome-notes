import { ListItemElement } from '../../list-item/list-item.component';


export type IListListenerType = 'create' | 'click';

export interface IListViewForm {
  create: HTMLButtonElement;
  scrollable: HTMLDivElement;
  list: HTMLDivElement;
  placeholder: HTMLDivElement | null;
  items: ListItemElement[];
}
