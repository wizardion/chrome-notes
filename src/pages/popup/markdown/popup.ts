import 'styles/style.scss';
import { CachedStorageService } from 'core/services/cached';
import { PopupNotesElement } from 'modules/notes/popup/popup.component';
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
  customElements.define(PopupNotesElement.selector, PopupNotesElement);

  return Promise.all([
    customElements.whenDefined(DropdownMenuElement.selector),
    customElements.whenDefined(EditorControlsElement.selector),
    customElements.whenDefined(ListViewElement.selector),
    customElements.whenDefined(ListItemElement.selector),
    customElements.whenDefined(MarkdownViewElement.selector),
    customElements.whenDefined(PopupNotesElement.selector),
  ]);
}

async function loadDBNotes(popup: PopupNotesElement) {
  const { db } = await import('modules/db');

  db.iterate(item => popup.addItem(item)).then(() => popup.init());
}

export async function init() {
  const notes = document.getElementById('simple-popup-notes') as PopupNotesElement;
  const configs = await CachedStorageService.get();

  if (configs.selected) {
    notes.select(configs.selected);

    return setTimeout(() => loadDBNotes(notes), 150);
  }

  loadDBNotes(notes);
}
