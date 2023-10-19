import { EditorView } from '@codemirror/view';
import { IEditorCustomEvents, ICustomIntervals } from './extension.model';
import { ListHelper } from './helpers/list.helper';
import { PrimitivesHelper } from './helpers/primitives.helper';
import { UrlHelper } from './helpers/url.helper';


export const CUSTOM_EVENTS: IEditorCustomEvents = {
  change: null,
  save: null
};

export const INTERVALS: ICustomIntervals = {
  changed: null,
  locked: null
};

export function toggleBold(view: EditorView) {
  const transaction = PrimitivesHelper.toggleBold(view);

  if (transaction) {
    view.dispatch(transaction);
  }
}

export function toggleItalic(view: EditorView) {
  const transaction = PrimitivesHelper.toggleItalic(view);

  if (transaction) {
    view.dispatch(transaction);
  }
}

export function toggleStrike(view: EditorView) {
  const transaction = PrimitivesHelper.toggleStrike(view);

  if (transaction) {
    view.dispatch(transaction);
  }
}

export function toggleUrl(view: EditorView) {
  const transaction = UrlHelper.toggle(view);

  if (transaction) {
    view.dispatch(transaction);
  }
}

export function toggleList(view: EditorView, template: string) {
  const transaction = ListHelper.toggle(view, template);

  if (transaction) {
    view.dispatch(transaction);
  }
}

export function removeFormat(view: EditorView) {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);

  if (text) {
    import('./md-render').then(({ mdRender }) => {
      const html = mdRender.render(text).replace(/(th|td)>\n<(th|td)/gi, '$1> <$2');
      const dirt = mdRender.unescapeAll(html.replace(/(<([^>]+)>)/gi, ''));
      const value = dirt.replace(/^[\s\n\r]+|[\s\n\r]+$|(\n)[\s\n\r]+/gi, '$1');

      view.dispatch(view.state.replaceSelection(value));
      view.dispatch({ selection: { anchor: range.from, head: range.from + value.length } });
    });
  }
}

export function saveChanges() {
  const event = new Event('save', { cancelable: true });

  if (CUSTOM_EVENTS.save && !event.defaultPrevented) {
    CUSTOM_EVENTS.save(event);
  }

  if (CUSTOM_EVENTS.change && !event.defaultPrevented) {
    CUSTOM_EVENTS.change(event);
  }
}