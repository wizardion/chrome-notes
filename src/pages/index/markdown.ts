import 'styles/style.scss';
import { CachedStorageService } from 'core/services/cached';
import { WindowNotesElement } from 'modules/notes/window/window.component';
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
  customElements.define(WindowNotesElement.selector, WindowNotesElement);

  return Promise.all([
    customElements.whenDefined(DropdownMenuElement.selector),
    customElements.whenDefined(EditorControlsElement.selector),
    customElements.whenDefined(ListViewElement.selector),
    customElements.whenDefined(ListItemElement.selector),
    customElements.whenDefined(MarkdownViewElement.selector),
    customElements.whenDefined(WindowNotesElement.selector),
  ]);
}

async function loadDBNotes(notes: WindowNotesElement, selected?: boolean) {
  const { db } = await import('modules/db');

  db.iterate(item => {
    if (!selected) {
      notes.select(item);
      selected = true;
    }

    notes.addItem(item);
  }).then(() => notes.init());
}

export async function init() {
  const notes = document.getElementById('simple-popup-notes') as WindowNotesElement;
  const configs = await CachedStorageService.get();

  notes.collapsed = configs.settings?.collapsed || false;
  notes.hidden = false;

  if (configs.selected) {
    notes.select(configs.selected);
  }

  loadDBNotes(notes, !!configs.selected);
  notes.classList.add('markdown-mode');
}
