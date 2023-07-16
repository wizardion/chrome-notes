import { tracker } from 'modules/notes/components/tracker';
tracker.track('init', 'start');

import {Base} from 'modules/notes/base';
import storage from 'modules/storage/storage';
import {fromIDBNoteString} from 'modules/notes/builder';
import {buildEditor} from './components/builder';
import 'styles/style.scss';


tracker.track('init', 'import');
storage.cached.get().then(cache => {
  tracker.track('init', `local.get: ${cache.list && cache.list.value}`.substring(0, 75) + ' ...');

  var notes: HTMLElement = <HTMLElement>document.getElementById('notes');
  var editor: Base = buildEditor();
  
  notes.classList.remove('hidden');
  if (cache.list && cache.list.value) {
    tracker.track('init', `cache`);
    editor.initFromCache(<string>cache.list.value);
  }

  if (cache.new && cache.new.value) {
    editor.selectNew(<string>(cache.description && cache.description.value), <string>(cache.selection && cache.selection.value));
  } else if (cache.selected && cache.selected.value) {
    editor.selectFromCache(fromIDBNoteString(<string>cache.selected.value));
  } else {
    editor.showList();
  }

  if (cache.syncEnabled && cache.internalKey && cache.syncEnabled.value 
    && !!cache.internalKey.value && !cache.syncLocked) {
    editor.unlock();
  }

  editor.init();
  notes.classList.remove('transparent');
  // editor.maxLength = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 10);
  // editor.maxSyncItems = (chrome.storage.sync.MAX_ITEMS - 12);
  // // editor.maxSyncItems = 4;
  // editor.syncedItems = (cache.syncedItems && cache.syncedItems.value || 0);

  tracker.track('init', 'Done');
  tracker.print();
});

tracker.track('init', 'chrome.storage');
