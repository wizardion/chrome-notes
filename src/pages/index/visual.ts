import 'styles/style.scss';
import { db } from 'modules/db';
import { CachedStorageService } from 'core/services/cached';
import { WindowNotesElement } from 'modules/notes/window/window.component';
import { ListViewElement } from 'modules/notes/list-view/list-view.component';
import { ListItemElement } from 'modules/notes/list-item/list-item.component';
import { VisualViewElement } from 'modules/notes/visual-view/visual-view.component';
import { EditorControlsElement } from 'modules/notes/editor-controls/editor-controls.component';
import { DropdownMenuElement } from 'components/dropdown-menu';


export function whenDefined(): Promise<CustomElementConstructor[]> {
  customElements.define(DropdownMenuElement.selector, DropdownMenuElement);
  customElements.define(EditorControlsElement.selector, EditorControlsElement);
  customElements.define(ListViewElement.selector, ListViewElement);
  customElements.define(ListItemElement.selector, ListItemElement);
  customElements.define(VisualViewElement.selector, VisualViewElement);
  customElements.define(WindowNotesElement.selector, WindowNotesElement);

  return Promise.all([
    customElements.whenDefined(DropdownMenuElement.selector),
    customElements.whenDefined(EditorControlsElement.selector),
    customElements.whenDefined(ListViewElement.selector),
    customElements.whenDefined(ListItemElement.selector),
    customElements.whenDefined(VisualViewElement.selector),
    customElements.whenDefined(WindowNotesElement.selector),
  ]);
}

export async function init() {
  const notes = document.getElementById('simple-popup-notes') as WindowNotesElement;
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
