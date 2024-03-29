import 'styles/style.scss';
import { db } from 'modules/db';
import { CachedStorageService } from 'core/services/cached';
import { PopupMixedNotesElement } from 'modules/notes/mixed/popup.component';
import { ListViewElement } from 'modules/notes/list-view/list-view.component';
import { ListItemElement } from 'modules/notes/list-item/list-item.component';
import { MarkdownViewElement } from 'modules/notes/markdown-view/markdown-view.component';
import { EditorControlsElement } from 'modules/notes/editor-controls/editor-controls.component';
import { DropdownMenuElement } from 'components/dropdown-menu';


export function whenDefined(): Promise<CustomElementConstructor[]> {
  customElements.define(DropdownMenuElement.selector, DropdownMenuElement);
  customElements.define(EditorControlsElement.selector, EditorControlsElement);
  customElements.define(ListViewElement.selector, ListViewElement);
  customElements.define(ListItemElement.selector, ListItemElement);
  customElements.define(MarkdownViewElement.selector, MarkdownViewElement);
  customElements.define(PopupMixedNotesElement.selector, PopupMixedNotesElement);

  return Promise.all([
    customElements.whenDefined(DropdownMenuElement.selector),
    customElements.whenDefined(EditorControlsElement.selector),
    customElements.whenDefined(ListViewElement.selector),
    customElements.whenDefined(ListItemElement.selector),
    customElements.whenDefined(MarkdownViewElement.selector),
    customElements.whenDefined(PopupMixedNotesElement.selector),
  ]);
}

export async function init() {
  const notes = document.getElementById('simple-popup-notes') as PopupMixedNotesElement;
  const configs = await CachedStorageService.get();
  let selected = !!configs.selected;

  if (configs.selected) {
    notes.hidden = false;
    notes.select(configs.selected);
  }

  if (configs.draft) {
    notes.hidden = false;
    notes.draft(configs.draft.title, configs.draft.description, configs.draft.selection);
  }

  db.iterate(item => {
    if (!selected) {
      notes.select(item);
      selected = true;
    }

    notes.addItem(item);
  }).then(() => notes.init());
  notes.hidden = false;
}
