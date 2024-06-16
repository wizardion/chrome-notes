export interface ILinkForm {
  tooltip: HTMLDivElement;
  container: HTMLDivElement;
  controls: HTMLDivElement;
  edit: HTMLButtonElement;
  remove: HTMLButtonElement;
}

export interface ITooltipEvents {
  edit: EventListener;
  remove: EventListener;
}
