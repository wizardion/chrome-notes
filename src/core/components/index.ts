export { BaseElement } from './base.component';
export { FormElement } from './form.component';

export type IEventListener = (e?: Event) => void;

export interface IEventIntervals {
  intervals: {
    [key: string]: NodeJS.Timeout | null;
  };
  delay: number;
}

// Delayed Interval in ms when the save trigger will be performed.
export const delayedInterval = 1200;
