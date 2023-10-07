import storage from 'modules/storage/storage';
import { IDataDaft, IPopupData } from './components/popup.models';
import { PopupNotesElement } from 'modules/notes/popup/popup-notes.component';
import { ListViewElement } from 'modules/notes/list-view/list-view.component';
import { ListItemElement } from 'modules/notes/list-item/list-item.component';
import { DetailsViewElement } from 'modules/notes/details-view/details-view.component';
import { IDBNote } from 'modules/db/interfaces';
import 'styles/style.scss';


storage.cached.get().then(async (cache) => {
  const notes = document.getElementById('simple-popup-notes') as PopupNotesElement;
  const configs: IPopupData = {
    items: <IDBNote[]>cache.list?.value,
    index: <number>cache.selected?.value,
    draft: <IDataDaft>cache.draft?.value
  };

  // console.log('list', cache.list?.value);

  if (configs.items) {
    notes.init(configs.items);

    if (configs.index !== null) {
      const item = configs.items.find(i => i.id === configs.index);

      // console.log('item', item);

      if (item) {
        notes.hidden = false;

        return notes.select(item, false);
      }
    }
  }

  if (configs.draft) {
    notes.hidden = false;

    return notes.draft(configs.draft.title, configs.draft.description, configs.draft.selection);
  }

  notes.hidden = false;
});

customElements.define(ListViewElement.selector, ListViewElement);
customElements.define(ListItemElement.selector, ListItemElement);
customElements.define(DetailsViewElement.selector, DetailsViewElement);
customElements.define(PopupNotesElement.selector, PopupNotesElement);
