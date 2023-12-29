export type IExtension = {extension: IExtension} | readonly IExtension[];

export interface IEditorCustomEvents {
  change: EventListener | null;
  save?: EventListener | null;
}

export interface ICustomIntervals {
  changed: NodeJS.Timeout;
  locked: NodeJS.Timeout;
}

export const CUSTOM_EVENTS: IEditorCustomEvents = {
  change: null,
  save: null
};

export const INTERVALS: ICustomIntervals = {
  changed: null,
  locked: null
};
