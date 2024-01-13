export interface IEditorData {
  title: string;
  description: string;
  selection?: number[] | null;
}

export interface IEditorView {
  get value(): string;
  set value(text: string);

  get element(): HTMLElement;

  get hidden(): boolean;
  set hidden(value: boolean);

  get scrollTop(): number;
  set scrollTop(value: number);

  getData(): IEditorData;
  setData(data: IEditorData): void;

  focus(): void;
  render(): string;

  addEventListener(type: 'change' | 'save', listener: EventListener): void;
}
