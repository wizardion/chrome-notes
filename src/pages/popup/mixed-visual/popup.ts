import 'styles/style.scss';
import { db } from 'modules/db';
import { CachedStorageService } from 'core/services/cached';
import { PopupMixedNotesElement } from 'modules/notes/mixed/popup.component';
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
  customElements.define(PopupMixedNotesElement.selector, PopupMixedNotesElement);

  return Promise.all([
    customElements.whenDefined(DropdownMenuElement.selector),
    customElements.whenDefined(EditorControlsElement.selector),
    customElements.whenDefined(ListViewElement.selector),
    customElements.whenDefined(ListItemElement.selector),
    customElements.whenDefined(VisualViewElement.selector),
    customElements.whenDefined(PopupMixedNotesElement.selector),
  ]);
}

export async function init() {
  const notes = document.getElementById('simple-popup-notes') as PopupMixedNotesElement;
  const configs = await CachedStorageService.get();
  let selected = !!configs.selected;

  if (configs.selected) {
    notes.hidden = false;
    notes.select(configs.selected, false);
  }

  if (configs.draft) {
    notes.hidden = false;
    notes.draft(configs.draft.title, configs.draft.description, configs.draft.selection);
  }

  db.iterate(item => {
    if (!selected) {
      notes.select(item, false);
      selected = true;
    }

    notes.addItem(item);
  }).then(() => notes.disabled = false);
  notes.hidden = false;
}
