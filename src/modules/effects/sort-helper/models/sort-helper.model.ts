export interface ISortEvents {
  move?: EventListener;
  end?: EventListener;
  wheel?: EventListener;
}

export interface ISortItem {
  startIndex: number;
  index: number;
  previous: number;
  pageY?: number;
  height?: number;
  element?: HTMLElement;
  placeholder?: HTMLElement;
  offsetHeight?: number;
}

export interface ISortContainer {
  offsetTop?: number;
  maxY?: number;
  height?: number;
  scrollHeight?: number;
  parentElement: HTMLElement;
  element: HTMLElement;
}

export interface ISortPoint {
  top: number;
  min: number;
  max: number;
}

/**
 * ------------------------------------------------------------------------------------------------------------------
 */
export type ISortEventListenerType =
  | 'start'
  | 'switch'
  | 'finish';

export interface ISortHelperEvents {
  switch: EventListener | null;
  complete: EventListener | null;
}

export interface ISortCollection {
  [key: number]: HTMLElement;
}

export interface ISortEventListener {
  (first?: number, second?: number): void;
}
