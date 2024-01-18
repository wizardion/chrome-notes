import 'styles/style.scss';
import { db } from 'modules/db';
import { CachedStorageService } from 'core/services/cached';
import { PopupNotesElement } from 'modules/notes/popup/popup.component';
import { ListViewElement } from 'modules/notes/list-view/list-view.component';
import { ListItemElement } from 'modules/notes/list-item/list-item.component';
import { MarkdownViewElement } from 'modules/notes/markdown-view/markdown-view.component';
import { EditorControlsElement } from 'modules/notes/editor-controls/editor-controls.component';
import { DropdownMenuElement } from 'components/dropdown-menu';


Promise.all([
  customElements.whenDefined(DropdownMenuElement.selector),
  customElements.whenDefined(EditorControlsElement.selector),
  customElements.whenDefined(ListViewElement.selector),
  customElements.whenDefined(ListItemElement.selector),
  customElements.whenDefined(MarkdownViewElement.selector),
  customElements.whenDefined(PopupNotesElement.selector),
]).then(async () => {
  setTimeout(async () => {
    const notes = document.getElementById('simple-popup-notes') as PopupNotesElement;
    const configs = await CachedStorageService.get();

    if (configs.selected) {
      notes.hidden = false;
      notes.select(configs.selected, false);
    }

    if (configs.draft) {
      notes.hidden = false;
      notes.draft(configs.draft.title, configs.draft.description, configs.draft.selection);
    }

    if (configs.selected || configs.draft) {
      return setTimeout(() => {
        db.iterate(item => notes.addItem(item)).then(() => notes.disabled = false);
        notes.hidden = false;
      }, 50);
    }

    db.iterate(item => notes.addItem(item)).then(() => notes.disabled = false);
    notes.hidden = false;
  }, 1);
});
// window.addEventListener('load', async () => {});

customElements.define(DropdownMenuElement.selector, DropdownMenuElement);
customElements.define(EditorControlsElement.selector, EditorControlsElement);
customElements.define(ListViewElement.selector, ListViewElement);
customElements.define(ListItemElement.selector, ListItemElement);
customElements.define(MarkdownViewElement.selector, MarkdownViewElement);
customElements.define(PopupNotesElement.selector, PopupNotesElement);
