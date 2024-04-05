import { IDetailsViewForm } from '../../details-base/models/details-base.model';


export interface IMarkdownViewForm extends IDetailsViewForm {
  description: HTMLElement,
  preview: HTMLButtonElement;
  htmlViewer: HTMLPreElement;
}
