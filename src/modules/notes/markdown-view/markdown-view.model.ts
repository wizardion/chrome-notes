import { IDetailsViewForm } from '../details-base/details-base.model';


export interface IMarkdownViewForm extends IDetailsViewForm {
  description: HTMLElement,
  preview: HTMLElement;
  htmlViewer: HTMLPreElement;
}
