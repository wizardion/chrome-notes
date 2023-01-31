import {tracker} from 'modules/notes/components/tracker';
tracker.track('init', 'Start');

import {Base} from 'modules/notes/base';
import storage from 'modules/storage/storage';
import {fromIDBNoteString} from 'modules/notes/builder';
import {buildEditor} from './components/builder';
import 'styles/style.scss';
import { Logger } from 'modules/logger/logger';
// import quota from './modules/sync/quota';


tracker.track('init', 'import');
// chrome.storage.session.get('key').then((result) => {
//   tracker.track('init', `storage.session.loaded: key:${result.key}`);
// });

storage.cached.get().then(async cache => {
  // tracker.track('init', `storage.cached.loaded...`);
  const logger: Logger = new Logger('popup.ts');
  logger.addLine();

  tracker.track('init', `local.get: [${Object.keys(cache)}`.substring(0, 75) + '] ...');
  var notes: HTMLElement = <HTMLElement>document.getElementById('notes');
  var editor: Base = buildEditor(cache.mode && cache.mode.value || 0);

  notes.classList.remove('hidden');
  if (cache.list && cache.list.value) {
    tracker.track('init', `cache`);
    editor.initFromCache(cache.list.value);
  }

  if (cache.new && cache.new.value) {
    editor.selectNew(
      cache.description && cache.description.value, 
      cache.selection && cache.selection.value,
      cache.sync && cache.sync.value
    );
    tracker.track('init', `selectNew`);
  } else if (cache.selected && cache.selected.value) {
    editor.selectFromCache(fromIDBNoteString(cache.selected.value));
    tracker.track('init', `selectFromCache`);
  } else {
    editor.showList();
    tracker.track('init', `showList`);
  }

  if (cache.syncEnabled && cache.internalKey 
    && cache.syncEnabled.value && !!cache.internalKey.value && !cache.syncLocked) {
    editor.unlock();
    tracker.track('init', `unlock`);
  }

  editor.init();
  tracker.track('init', `editor.init`);
  notes.classList.remove('transparent');
  // editor.maxLength = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 10);
  // editor.maxSyncItems = quota.MAX_ITEMS;
  // // editor.maxSyncItems = 4;
  // editor.syncedItems = (cache.syncedItems && cache.syncedItems.value || 0);

  tracker.track('init', 'End');
  // await logger.info(tracker.print());
});

tracker.track('init', 'page.ends');
