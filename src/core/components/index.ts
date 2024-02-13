export { BaseElement } from './base.component';
export { FormElement } from './form.component';

export type IEventListener = () => void;

export interface IIntervals {
  changed: NodeJS.Timeout | null;
  locked: NodeJS.Timeout | null;
  delay: number;
}
