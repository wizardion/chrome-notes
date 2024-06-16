export interface IEditorData {
  title: string;
  description: string;
  selection?: number[] | null;
  preview?: boolean;
  previewSelection?: string;
}

export interface IEditorView {
  get element(): HTMLElement;

  get hidden(): boolean;
  get scrollTop(): number;

  set hidden(value: boolean);
  set scrollTop(value: number);

  getData(): IEditorData;
  setData(data: IEditorData): void;

  focus(): void;
  render(): string;
  setSelection(selection: number[]): void;

  addEventListener(type: 'change' | 'save', listener: EventListener): void;
}
